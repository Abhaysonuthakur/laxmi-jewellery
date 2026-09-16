/**
 * Input validation.
 *
 * Every rule returns the same `{ ok, value } | { ok: false, message }` shape so
 * routes can collect errors without branching on type. Validation happens here
 * and only here — routes never re-implement a rule, because two copies of a
 * rule is one copy that is wrong.
 */

/**
 * Deliberately permissive.
 *
 * A stricter regex is a well-known way to reject valid addresses: the RFC
 * permits far more than most patterns allow, and the only real test of an
 * address is whether mail to it arrives. This rejects obvious garbage and
 * leaves the rest alone.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MIN_PASSWORD = 8
/** Bounded so a megabyte-long "password" cannot be used to burn CPU in scrypt. */
const MAX_PASSWORD = 200
const MAX_DISPLAY_NAME = 80

/**
 * A short list of passwords that are guaranteed to be tried first.
 *
 * Not a security control on its own — it is a speed bump that costs three lines
 * and catches the single most common bad choice. Real strength enforcement
 * belongs in a length requirement, which is the only rule with evidence behind
 * it, and that is `MIN_PASSWORD` above.
 */
const OBVIOUS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyui',
  'qwerty123',
  'iloveyou',
  'letmein1',
  'welcome1',
  'admin123',
  'abc12345',
  'laxmi123',
  'jewellery',
])

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function validateEmail(value) {
  const email = normalizeEmail(value)

  if (!email) return { ok: false, message: 'Email is required.' }
  if (email.length > 254) return { ok: false, message: 'That email address is too long.' }
  if (!EMAIL_RE.test(email)) return { ok: false, message: 'That does not look like a valid email address.' }

  return { ok: true, value: email }
}

export function validatePassword(value) {
  if (typeof value !== 'string' || !value) {
    return { ok: false, message: 'Password is required.' }
  }

  if (value.length < MIN_PASSWORD) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD} characters.` }
  }

  if (value.length > MAX_PASSWORD) {
    return { ok: false, message: `Password must be ${MAX_PASSWORD} characters or fewer.` }
  }

  if (OBVIOUS.has(value.toLowerCase())) {
    return { ok: false, message: 'That password is too common. Please choose another.' }
  }

  return { ok: true, value }
}

/**
 * Display name is optional.
 *
 * No character restrictions beyond a length cap: a person's name is not ours to
 * police, and the value is escaped by React on render, never concatenated into
 * HTML or SQL.
 */
export function validateDisplayName(value) {
  if (value === undefined || value === null) return { ok: true, value: '' }
  if (typeof value !== 'string') return { ok: false, message: 'Name must be text.' }

  const name = value.trim().replace(/\s+/g, ' ')
  if (name.length > MAX_DISPLAY_NAME) {
    return { ok: false, message: `Name must be ${MAX_DISPLAY_NAME} characters or fewer.` }
  }

  return { ok: true, value: name }
}

/**
 * Run a set of validators and collect every failure.
 *
 * Returning all errors at once lets the form highlight every bad field in one
 * pass instead of making the user submit repeatedly to discover them one by one.
 */
export function collect(validators) {
  const values = {}
  const errors = {}

  for (const [field, result] of Object.entries(validators)) {
    if (result.ok) values[field] = result.value
    else errors[field] = result.message
  }

  return { ok: Object.keys(errors).length === 0, values, errors }
}

export const limits = { MIN_PASSWORD, MAX_PASSWORD, MAX_DISPLAY_NAME }

export default { validateEmail, validatePassword, validateDisplayName, collect, normalizeEmail }
