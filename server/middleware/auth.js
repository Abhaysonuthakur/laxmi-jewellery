/**
 * Request authentication middleware.
 *
 * Three pieces that compose:
 *
 *   attachUser      reads the session cookie and puts `req.user` in place.
 *                   Never rejects — it only observes. Routes decide what an
 *                   absent user means.
 *   requireAuth     401 unless `req.user` exists.
 *   requireAdmin    403 unless that user's role is 'admin'.
 *
 * `requireAdmin` deliberately returns 403 for a logged-in non-admin and 401 for
 * nobody at all: "you are not allowed" and "you are not logged in" are
 * different problems with different fixes, and collapsing them makes a
 * misconfiguration look like a permissions bug.
 */
import { config } from '../config.js'
import { parseCookies } from '../lib/cookies.js'
import { resolveSession } from '../lib/sessions.js'

export function attachUser(req, _res, next) {
  req.user = null
  req.sessionToken = null
  req.sessionExpiresAt = null

  const cookies = parseCookies(req.headers?.cookie)
  const token = cookies[config.session.cookieName]

  if (token) {
    const session = resolveSession(token)
    if (session) {
      req.user = session.user
      req.sessionToken = token
      req.sessionExpiresAt = session.expiresAt
    }
  }

  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'unauthenticated',
      message: 'You need to be signed in to do that.',
    })
  }

  return next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'unauthenticated',
      message: 'You need to be signed in to do that.',
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'forbidden',
      message: 'That area is restricted to staff accounts.',
    })
  }

  return next()
}

/**
 * Reject cross-site state changes.
 *
 * The primary CSRF defence is the cookie's `SameSite=Lax`, which stops a
 * browser attaching the session to a cross-site POST at all. This is the second
 * layer, and it exists because `SameSite` is a browser guarantee — a proxy that
 * rewrites headers, or a client that ignores the attribute, would remove it
 * silently.
 *
 * A request with no Origin at all is allowed through: browsers always send
 * Origin on cross-origin mutations, so its absence means the request did not
 * come from a page at all (curl, a health check, a native client). Those callers
 * cannot be victims of CSRF because they hold no ambient cookie.
 */
export function requireSameOrigin(req, res, next) {
  const method = req.method?.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()

  const origin = req.headers?.origin
  if (!origin) return next()

  const host = req.headers?.host
  const allowed = new Set(config.allowedOrigins)
  if (host) allowed.add(`${req.protocol}://${host}`)

  if (allowed.has(origin)) return next()

  return res.status(403).json({
    error: 'bad_origin',
    message: 'This request came from an unrecognised origin.',
  })
}

export default { attachUser, requireAuth, requireAdmin, requireSameOrigin }
