/**
 * Session lifecycle.
 *
 * A session is a row keyed by the SHA-256 of a random token. The raw token
 * exists in exactly two places: the client's httpOnly cookie, and the response
 * body of the request that created it. It is never logged and never stored.
 *
 * The TTL is absolute rather than sliding. A sliding window is friendlier, but
 * it also means a stolen token can be kept alive forever by an attacker who
 * simply uses it — with an absolute expiry, every session dies on a fixed
 * schedule no matter what.
 */
import { config } from '../config.js'
import { db } from '../db.js'
import { createToken, hashToken } from './tokens.js'
import { publicUser } from './users.js'

const insertSession = db.prepare(`
  INSERT INTO sessions (token_hash, user_id, expires_at, user_agent)
  VALUES (?, ?, ?, ?)
`)

const selectSession = db.prepare(`
  SELECT s.token_hash AS token_hash,
         s.expires_at  AS expires_at,
         u.id          AS id,
         u.email       AS email,
         u.display_name AS display_name,
         u.role        AS role,
         u.created_at  AS created_at
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ?
`)

const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
const deleteForUser = db.prepare('DELETE FROM sessions WHERE user_id = ?')
const listForUser = db.prepare('SELECT token_hash, created_at, expires_at, user_agent FROM sessions WHERE user_id = ?')

/** User-agent strings are attacker-controlled; cap what we persist. */
const MAX_UA = 400

export function createSession(userId, userAgent = '') {
  const token = createToken()
  const expiresAt = new Date(Date.now() + config.session.ttlMs).toISOString()

  insertSession.run(hashToken(token), userId, expiresAt, String(userAgent).slice(0, MAX_UA))

  return { token, expiresAt }
}

/**
 * Resolve a raw token to a user, or null.
 *
 * An expired row is deleted on sight rather than merely ignored, so the table
 * cleans itself up on the paths people actually use.
 */
export function resolveSession(token) {
  if (!token) return null

  const row = selectSession.get(hashToken(token))
  if (!row) return null

  if (row.expires_at <= new Date().toISOString()) {
    deleteSession.run(row.token_hash)
    return null
  }

  return { user: publicUser(row), expiresAt: row.expires_at }
}

export function destroySession(token) {
  if (!token) return
  deleteSession.run(hashToken(token))
}

/**
 * Invalidate every session for a user.
 *
 * Called after a password reset. Without this, changing a password would leave
 * an attacker who already had a session logged in — which is the exact scenario
 * a password reset is supposed to end.
 */
export function destroySessionsForUser(userId) {
  deleteForUser.run(userId)
}

export function sessionCountForUser(userId) {
  return listForUser.all(userId).length
}

export default { createSession, resolveSession, destroySession, destroySessionsForUser }
