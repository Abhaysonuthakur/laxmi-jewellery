/**
 * Authentication routes.
 *
 * Two rules run through all of this:
 *
 *   1. Never reveal whether an email address is registered. Login says
 *      "invalid email or password" whether the user is missing or the password
 *      is wrong, and does the same amount of work in both cases. Forgot-password
 *      always reports success. Otherwise the login form is a free account
 *      enumeration oracle.
 *   2. Never return a password hash. Not on success, not on error, not in a
 *      log line. Every user object leaving here has been through `publicUser`.
 */
import { Router } from 'express'
import { config } from '../config.js'
import { db } from '../db.js'
import { clearCookie, parseCookies, setCookie } from '../lib/cookies.js'
import { burnPasswordTime, verifyPassword } from '../lib/passwords.js'
import { rateLimit } from '../lib/rate-limit.js'
import {
  createSession,
  destroySession,
  destroySessionsForUser,
} from '../lib/sessions.js'
import { createToken, hashToken } from '../lib/tokens.js'
import { createUser, findByEmail, findById, publicUser, setPassword, setDisplayName } from '../lib/users.js'
import { collect, normalizeEmail, validateDisplayName, validateEmail, validatePassword } from '../lib/validate.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

/** Set the session cookie and return the token for the response body. */
function issueSession(req, res, userId) {
  const { token, expiresAt } = createSession(userId, req.headers['user-agent'] || '')

  setCookie(res, config.session.cookieName, token, {
    maxAgeSeconds: Math.floor(config.session.ttlMs / 1000),
    isProduction: config.isProduction,
    sameSite: 'Lax',
    path: '/',
  })

  return { token, expiresAt }
}

function readCookie(req, name) {
  return parseCookies(req.headers?.cookie)[name] ?? null
}

/* ------------------------------------------------------------------ register */

const registerLimit = rateLimit({ name: 'register', limit: 5, windowMs: 60 * 60 * 1000 })

authRouter.post('/register', registerLimit, (req, res) => {
  const body = req.body ?? {}

  const { ok, values, errors } = collect({
    email: validateEmail(body.email),
    password: validatePassword(body.password),
    displayName: validateDisplayName(body.displayName),
  })

  if (!ok) {
    return res.status(400).json({ error: 'validation_error', message: 'Please check the form.', fields: errors })
  }

  const result = createUser(values)
  if (!result.ok) {
    // The one place we admit an address is taken — unavoidable, since the user
    // cannot proceed without knowing. Rate limiting is what keeps this from
    // being a useful enumeration tool.
    return res.status(409).json({
      error: 'email_taken',
      message: 'An account with that email already exists.',
      fields: { email: 'An account with that email already exists.' },
    })
  }

  const session = issueSession(req, res, result.user.id)

  return res.status(201).json({ user: result.user, expiresAt: session.expiresAt })
})

/* --------------------------------------------------------------------- login */

/**
 * Two limiters, because they stop different attacks.
 *
 * `loginIp` caps a broad spray across many accounts from one address.
 * `loginAccount` caps a targeted attack on one account from many addresses.
 * Neither is sufficient alone, and the account key is the email as submitted —
 * normalised, so case tricks cannot mint fresh buckets.
 */
const loginIp = rateLimit({ name: 'login-ip', limit: 20, windowMs: 15 * 60 * 1000 })
const loginAccount = rateLimit({
  name: 'login-account',
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keyFn: (req) => normalizeEmail(req.body?.email) || 'none',
})

authRouter.post('/login', loginIp, loginAccount, (req, res) => {
  const body = req.body ?? {}
  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Email and password are required.',
      fields: {
        ...(email ? {} : { email: 'Email is required.' }),
        ...(password ? {} : { password: 'Password is required.' }),
      },
    })
  }

  const user = findByEmail(email)

  if (!user) {
    // Do the same work as a real verification before failing. Without this the
    // no-such-user path returns in ~1ms and the wrong-password path in ~100ms,
    // and that gap is a reliable "is this address registered?" signal.
    burnPasswordTime()
    return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password.' })
  }

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password.' })
  }

  const session = issueSession(req, res, user.id)

  return res.json({ user: publicUser(user), expiresAt: session.expiresAt })
})

/* -------------------------------------------------------------------- logout */

authRouter.post('/logout', (req, res) => {
  const token = readCookie(req, config.session.cookieName)

  // Server-side invalidation, not just a cleared cookie. A cookie the browser
  // forgets is still a valid token to anyone who copied it.
  destroySession(token)
  clearCookie(res, config.session.cookieName, { isProduction: config.isProduction })

  return res.json({ ok: true })
})

/* ------------------------------------------------------------------------ me */

authRouter.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'unauthenticated', message: 'Not signed in.' })

  return res.json({ user: req.user, expiresAt: req.sessionExpiresAt })
})

authRouter.patch('/me', requireAuth, (req, res) => {
  const result = validateDisplayName(req.body?.displayName)
  if (!result.ok) {
    return res.status(400).json({
      error: 'validation_error',
      message: result.message,
      fields: { displayName: result.message },
    })
  }

  setDisplayName(req.user.id, result.value)

  return res.json({ user: publicUser(findById(req.user.id)) })
})

/* --------------------------------------------------------- password recovery */

const forgotLimit = rateLimit({ name: 'forgot', limit: 5, windowMs: 60 * 60 * 1000 })
const resetLimit = rateLimit({ name: 'reset', limit: 10, windowMs: 60 * 60 * 1000 })

const insertReset = db.prepare(`
  INSERT INTO password_resets (token_hash, user_id, expires_at)
  VALUES (?, ?, ?)
`)
const selectReset = db.prepare(`
  SELECT token_hash, user_id, expires_at, used_at
  FROM password_resets
  WHERE token_hash = ?
`)
const consumeReset = db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ? AND used_at IS NULL')
const deleteResetsForUser = db.prepare('DELETE FROM password_resets WHERE user_id = ?')

authRouter.post('/forgot-password', forgotLimit, (req, res) => {
  const email = normalizeEmail(req.body?.email)

  // The response is identical whether or not the address exists. This is the
  // whole point of the endpoint: it must not be usable to test for accounts.
  const generic = {
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  }

  if (!email) return res.json(generic)

  const user = findByEmail(email)
  if (!user) return res.json(generic)

  const token = createToken()
  const expiresAt = new Date(Date.now() + config.session.resetTtlMs).toISOString()

  // Only one live reset per account, so an old link cannot be replayed after a
  // newer one is issued.
  deleteResetsForUser.run(user.id)
  insertReset.run(hashToken(token), user.id, expiresAt)

  const resetUrl = `http://127.0.0.1:5173/reset-password?token=${token}`

  /*
   * No mail provider is configured, so the link is written to the server
   * console — that is the honest fallback, and it means the flow is fully
   * exercisable today. The `devResetUrl` field is gated behind a non-production
   * environment and must be removed by configuring SMTP_URL before launch:
   * shipping it would let anyone reset anyone's password.
   */
  console.log(`\n[password reset] ${user.email}\n  ${resetUrl}\n  expires ${expiresAt}\n`)

  return res.json(config.isProduction ? generic : { ...generic, devResetUrl: resetUrl })
})

authRouter.post('/reset-password', resetLimit, (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : ''
  const password = req.body?.password

  const validation = validatePassword(password)
  if (!validation.ok) {
    return res.status(400).json({
      error: 'validation_error',
      message: validation.message,
      fields: { password: validation.message },
    })
  }

  if (!token) {
    return res.status(400).json({ error: 'invalid_token', message: 'That reset link is not valid.' })
  }

  const row = selectReset.get(hashToken(token))
  const now = new Date().toISOString()

  if (!row || row.used_at || row.expires_at <= now) {
    return res.status(400).json({
      error: 'invalid_token',
      message: 'That reset link has expired or has already been used. Please request a new one.',
    })
  }

  // Mark used before changing the password: if the update fails, a single-use
  // token must not survive to be tried again.
  const consumed = consumeReset.run(now, row.token_hash)
  if (consumed.changes === 0) {
    return res.status(400).json({ error: 'invalid_token', message: 'That reset link has already been used.' })
  }

  setPassword(row.user_id, password)

  // Changing a password must end every existing session, including any an
  // attacker opened with the old one.
  destroySessionsForUser(row.user_id)
  clearCookie(res, config.session.cookieName, { isProduction: config.isProduction })

  return res.json({ ok: true, message: 'Your password has been changed. Please sign in.' })
})

export default authRouter
