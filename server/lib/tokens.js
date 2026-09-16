/**
 * Opaque tokens.
 *
 * Used for both session cookies and password-reset links. The rule in both cases
 * is the same and it is the whole point of this module:
 *
 *   the raw token goes to the client, only its SHA-256 is stored.
 *
 * So the database never holds anything that can be replayed. Lookup works
 * because SHA-256 is deterministic: hash the incoming token and use that as the
 * primary key.
 *
 * A plain SHA-256 is correct here — and a slow KDF would be wrong. These tokens
 * are 256 bits of CSPRNG output, so there is no dictionary to attack and nothing
 * for a slow hash to buy. Password hashing is slow because humans pick
 * passwords; token hashing must be fast because it runs on every request.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** 32 bytes = 256 bits. Guessing one is not a threat model, it is a rounding error. */
export function createToken() {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Compare two hex digests without leaking where they first differ.
 *
 * Only useful for comparing values of a known equal length; callers must have
 * already hashed both sides.
 */
export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false

  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

export default { createToken, hashToken, safeEqualHex }
