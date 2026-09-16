/**
 * The database.
 *
 * SQLite via `node:sqlite`, which ships with Node 22.5+. That choice is
 * deliberate: a real SQL database with real transactions, constraints and
 * foreign keys, with **zero dependencies and nothing to install**. No native
 * module to compile, no server to run, no connection string to leak.
 *
 * The schema is created on boot and is idempotent, so a fresh clone needs no
 * migration step to get running. The SQL is deliberately portable — it moves to
 * Postgres with few changes when this outgrows a single file.
 */
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { config } from './config.js'

mkdirSync(dirname(config.databasePath), { recursive: true })

export const db = new DatabaseSync(config.databasePath)

/**
 * Pragmas.
 *
 * `foreign_keys` is OFF by default in SQLite — a genuinely dangerous default,
 * because every `ON DELETE CASCADE` below would silently do nothing and
 * deleting a user would leave orphaned sessions and wishlist rows behind.
 *
 * WAL lets reads proceed during writes, which matters as soon as more than one
 * person is using the site.
 */
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')
db.exec('PRAGMA busy_timeout = 5000')

/*
 * HAZARD: this is a template literal, so a backtick anywhere inside it —
 * including inside the SQL comments below — ends the string early and the file
 * fails to parse with a misleading "missing ) after argument list". Prose in
 * here must use plain words or single quotes, never backticks.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL DEFAULT '',
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  /*
   * Sessions.
   *
   * The primary key is the SHA-256 of the token, never the token itself. A
   * leaked database therefore does not hand over a set of live sessions — the
   * attacker would have to invert SHA-256 to use any of these rows.
   */
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    expires_at TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  /*
   * Wishlist.
   *
   * The piece column is a stable key from the frontend's catalogue rather than
   * a row id, so the wishlist survives the catalogue being restructured. The
   * composite primary key makes "add twice" a no-op at the database level
   * instead of something the application has to remember to check.
   */
  CREATE TABLE IF NOT EXISTS wishlist_items (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    piece      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (user_id, piece)
  );

  /*
   * Password resets. Same hashing rule as sessions; the used_at column makes
   * each token single-use.
   */
  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    used_at    TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_resets_user ON password_resets(user_id);
`)

/** Housekeeping: expired rows have no value and should not accumulate. */
export function pruneExpired() {
  const now = new Date().toISOString()
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now)
  db.prepare('DELETE FROM password_resets WHERE expires_at < ?').run(now)
}

export default db
