/**
 * Server configuration.
 *
 * Everything environment-dependent is read once, here. A misconfigured server
 * should fail loudly on boot, not silently at the first login attempt.
 *
 * NOTE ON SECRETS: there is deliberately no `SESSION_SECRET` here. Session
 * tokens are 256 bits of CSPRNG output, and only their SHA-256 is stored, so
 * there is nothing to sign and no key to manage — a database leak yields hashes
 * that cannot be turned back into usable tokens. Adding a secret that nothing
 * reads would imply a security property this design does not rely on.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(here, '..')

/**
 * Minimal .env loader.
 *
 * Node's `--env-file` is not available on every runtime we might deploy to, and
 * it silently ignores a missing file. Loading it ourselves behaves identically
 * everywhere and lets us report what we found.
 */
function loadEnvFile() {
  const path = join(ROOT, '.env')
  if (!existsSync(path)) return false

  for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    if (value.length > 1 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1)
    }

    // A real environment variable always wins over the file.
    if (process.env[key] === undefined) process.env[key] = value
  }

  return true
}

export const envFileLoaded = loadEnvFile()

export const config = {
  isProduction: process.env.NODE_ENV === 'production',

  port: Number(process.env.PORT) || 3001,

  /** Where the SQLite file lives. */
  databasePath: process.env.DATABASE_PATH || join(ROOT, 'server', 'data', 'laxmi.db'),

  session: {
    cookieName: 'laxmi_session',
    /** 30 days. Convenient, and bounds how long a leaked token stays useful. */
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    /** Reset tokens are deliberately short-lived. */
    resetTtlMs: 60 * 60 * 1000,
  },

  /**
   * Origins allowed to make mutating requests.
   *
   * The Vite dev server proxies /api to us, so in development the browser sees
   * a same-origin request. In production the site and API share an origin.
   */
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  /** Set to a transactional mail provider's URL before going live. */
  mailConfigured: Boolean(process.env.SMTP_URL),
}

export default config
