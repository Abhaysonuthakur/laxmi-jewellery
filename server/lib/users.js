/**
 * User records.
 *
 * All SQL touching the `users` table lives here, so the rule that
 * `password_hash` never leaves this module is enforced by there being exactly
 * one place to check.
 */
import { db } from '../db.js'
import { hashPassword } from './passwords.js'

const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, display_name, role)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(email) DO NOTHING
`)

const selectByEmail = db.prepare(`
  SELECT id, email, password_hash, display_name, role, created_at
  FROM users
  WHERE email = ?
`)

const selectById = db.prepare(`
  SELECT id, email, password_hash, display_name, role, created_at
  FROM users
  WHERE id = ?
`)

const selectAll = db.prepare(`
  SELECT id, email, display_name, role, created_at
  FROM users
  ORDER BY id ASC
`)

const countUsers = db.prepare('SELECT COUNT(*) AS n FROM users')
const countAdmins = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
const updateDisplayName = db.prepare('UPDATE users SET display_name = ? WHERE id = ?')

/**
 * The only shape a user is ever allowed to leave the server in.
 *
 * Note what is absent: `password_hash`. Callers pass a row straight from any of
 * the queries above and get back something safe to serialise. There is no
 * opt-in to leaking the hash because there is no field to opt into.
 */
export function publicUser(row) {
  if (!row) return null

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  }
}

/**
 * Create a user.
 *
 * Returns `{ ok: false, reason: 'email_taken' }` rather than throwing, because
 * a duplicate email is an ordinary outcome of a public form, not an exception.
 * `ON CONFLICT ... DO NOTHING` + `changes` is used instead of catching the
 * constraint error: it needs no string matching on an error message, and it
 * cannot be broken by SQLite rephrasing its diagnostics.
 */
export function createUser({ email, password, displayName = '', role = 'customer' }) {
  const result = insertUser.run(email, hashPassword(password), displayName, role)

  if (result.changes === 0) return { ok: false, reason: 'email_taken' }

  return { ok: true, user: publicUser(selectById.get(Number(result.lastInsertRowid))) }
}

export function findByEmail(email) {
  return selectByEmail.get(email) ?? null
}

export function findById(id) {
  return selectById.get(id) ?? null
}

export function listUsers() {
  return selectAll.all().map(publicUser)
}

export function userCounts() {
  return { users: countUsers.get().n, admins: countAdmins.get().n }
}

export function setPassword(userId, password) {
  updatePassword.run(hashPassword(password), userId)
}

export function setDisplayName(userId, displayName) {
  updateDisplayName.run(displayName, userId)
}

export default { publicUser, createUser, findByEmail, findById, listUsers, userCounts }
