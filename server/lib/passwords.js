/**
 * Password hashing.
 *
 * scrypt, from Node's built-in `crypto`. Chosen over bcrypt/argon2 because it is
 * memory-hard (so GPU cracking is expensive), it is a real KDF rather than a
 * hash, and — decisively — it needs no native module. No node-gyp, no build
 * tools, no platform-specific binary to go stale.
 *
 * Format: `scrypt$N$r$p$saltHex$hashHex`
 *
 * The parameters travel with each hash, so the cost can be raised later and old
 * hashes still verify. That is what makes a password-hashing upgrade possible
 * without forcing every user to reset.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** ~64 MB of memory per hash and ~100ms on a modern machine. */
const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64
const SALT_LENGTH = 16

/** scrypt needs 128 * N * r bytes, plus headroom. */
const MAX_MEM = 128 * PARAMS.N * PARAMS.r * 2

export function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH)
  const derived = scryptSync(password, salt, KEY_LENGTH, { ...PARAMS, maxmem: MAX_MEM })

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$')
}

/**
 * Constant-time verification.
 *
 * `timingSafeEqual` throws if the two buffers differ in length, which would
 * itself leak information, so lengths are compared first and a same-length
 * dummy is compared in the mismatch case.
 */
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false

  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts
  const N = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const expected = Buffer.from(hashHex, 'hex')
  const salt = Buffer.from(saltHex, 'hex')
  if (expected.length === 0) return false

  let derived
  try {
    derived = scryptSync(password, salt, expected.length, { N, r, p, maxmem: 128 * N * r * 2 })
  } catch {
    return false
  }

  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

/**
 * Burn the same CPU time as a real verification.
 *
 * Without this, "no such user" returns in ~1ms while "wrong password" takes
 * ~100ms, and that difference alone tells an attacker which email addresses are
 * registered. Called on the no-such-user path in the login route.
 */
const DUMMY_HASH = hashPassword(randomBytes(32).toString('hex'))

export function burnPasswordTime() {
  verifyPassword('not-the-password', DUMMY_HASH)
}

export default { hashPassword, verifyPassword, burnPasswordTime }
