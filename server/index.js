/**
 * LAXMI JEWELLERY — API server.
 *
 * Express 5 on Node's built-in SQLite. Start with `npm run dev:api`.
 *
 * Middleware order is load-bearing and is commented where it matters:
 * security headers, then body parsing, then origin check, then identity, then
 * rate limiting, then routes. An error handler is last, and the SPA fallback is
 * after that — a fallback registered before the routes would swallow them.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import express from 'express'

import { ROOT, config, envFileLoaded } from './config.js'
import { db, pruneExpired } from './db.js'
import { adminRouter } from './routes/admin.js'
import { authRouter } from './routes/auth.js'
import { wishlistRouter } from './routes/wishlist.js'
import { attachUser, requireSameOrigin } from './middleware/auth.js'
import { rateLimit } from './lib/rate-limit.js'

const app = express()

/** Drop the `X-Powered-By: Express` fingerprint. Free, and it costs nothing. */
app.disable('x-powered-by')

/*
 * Behind a reverse proxy (nginx, Fly, Render) `req.ip` is the proxy's address
 * unless this is set — which would collapse every visitor into one rate-limit
 * bucket. It is off by default because enabling it where no proxy exists lets a
 * client forge X-Forwarded-For and mint a fresh bucket per request.
 */
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)
}

/* ------------------------------------------------------------ security headers */

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')

  /*
   * CSP is applied in production only, and only there because the dev server
   * injects inline scripts for HMR that no useful policy can allow.
   *
   * `style-src` needs 'unsafe-inline' because Tailwind v4 injects a <style>
   * element. `worker-src blob:` and `img-src blob:` are required by three.js,
   * which builds workers and textures from blobs at runtime.
   */
  if (config.isProduction) {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
    )
  }

  next()
})

/* ---------------------------------------------------------------- body parsing */

/*
 * 16 kB. The largest legitimate body here is an email and a password; anything
 * bigger is either a bug or an attempt to make us allocate. No file uploads
 * exist on this site, so there is no reason to accept a large payload.
 */
app.use(express.json({ limit: '16kb' }))

/* ------------------------------------------------------------------- the API */

const api = express.Router()

// Cross-site state changes are refused before any handler sees them.
api.use(requireSameOrigin)

// Identity is resolved for every request; routes decide whether it is required.
api.use(attachUser)

// A blunt ceiling on total traffic, above every specific limiter.
api.use(rateLimit({ name: 'api', limit: 600, windowMs: 15 * 60 * 1000 }))

api.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) })
})

api.use('/auth', authRouter)
api.use('/wishlist', wishlistRouter)
api.use('/admin', adminRouter)

// Unknown API paths get JSON, never the HTML fallback — a client that asked for
// JSON and received an HTML page reports a parse error instead of a 404.
api.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'No such endpoint.' })
})

app.use('/api', api)

/* --------------------------------------------------------- static build (prod) */

const distDir = join(ROOT, 'dist')

if (config.isProduction && existsSync(distDir)) {
  /*
   * Vite names hashed output `name-HASH.ext` — a hyphen before the hash, and a
   * base64url hash with mixed case (e.g. `r3f-B_P6ZVqx.js`). A webpack-style
   * pattern looking for `name.HASH.ext` matches nothing here and silently
   * downgrades every asset to `max-age=0`, so this is written against the real
   * filenames and verified against them.
   */
  const HASHED_ASSET = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, path) {
        // index.html must never be cached or a deploy leaves visitors on the
        // previous build; hashed assets are immutable by construction.
        if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache')
        else if (HASHED_ASSET.test(path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      },
    }),
  )

  /*
   * SPA fallback.
   *
   * Express 5 removed the wildcard path string (path-to-regexp v8 rejects it),
   * so this is a plain middleware rather than a wildcard route.
   *
   * The extension check is load-bearing and was missing at first. Testing only
   * `req.accepts('html')` is not enough: browsers request scripts and
   * stylesheets with a wildcard Accept header, which satisfies that test, so a
   * missing chunk came back as the HTML shell with status 200 and the browser
   * reported a JavaScript parse error instead of a 404. Refusing anything with
   * a file extension lets missing assets fall through to a real 404.
   *
   * NOTE: do not write the literal wildcard media type in this comment. Its
   * second and third characters close the block comment and the file stops
   * parsing — the same trap as a backtick inside a template literal.
   */
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (/\.[a-z0-9]+$/i.test(req.path)) return next()
    if (!req.accepts('html')) return next()

    return res.sendFile(join(distDir, 'index.html'))
  })
}

/* -------------------------------------------------------------- error handler */

// eslint-disable-next-line no-unused-vars -- Express identifies this by arity.
app.use((err, _req, res, _next) => {
  // A malformed JSON body is the client's mistake, not a server fault.
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'bad_json', message: 'Request body was not valid JSON.' })
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'too_large', message: 'Request body was too large.' })
  }

  // Logged in full server-side, summarised to the client. A stack trace in a
  // response is a map of the internals for whoever asked.
  console.error('[api error]', err)

  return res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' })
})

/* -------------------------------------------------------------------- startup */

pruneExpired()

const pruneTimer = setInterval(pruneExpired, 60 * 60 * 1000)
pruneTimer.unref?.()

const server = app.listen(config.port, () => {
  console.log(`\n  LAXMI JEWELLERY api`)
  console.log(`  ──────────────────────────────────────────`)
  console.log(`  listening   http://127.0.0.1:${config.port}`)
  console.log(`  mode        ${config.isProduction ? 'production' : 'development'}`)
  console.log(`  database    ${config.databasePath}`)
  console.log(`  .env        ${envFileLoaded ? 'loaded' : 'not found (using defaults)'}`)
  console.log(`  mail        ${config.mailConfigured ? 'configured' : 'NOT configured — reset links print to this console'}`)
  console.log(`  static      ${config.isProduction && existsSync(distDir) ? 'serving dist/' : 'off'}`)
  console.log(`  ──────────────────────────────────────────\n`)
})

/**
 * Shut down cleanly.
 *
 * Closing the database is not optional: with WAL enabled, an abrupt exit can
 * leave the write-ahead log for the next process to recover. Closing also
 * checkpoints it, so the next boot starts from a tidy state.
 */
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down.`)

  server.close(() => {
    try {
      db.close()
    } catch {
      /* already closed */
    }
    process.exit(0)
  })

  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(0), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export default app
