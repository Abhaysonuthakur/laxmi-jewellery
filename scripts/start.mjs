/**
 * Production entry point.
 *
 *   npm run build && npm start
 *
 * Exists so that NODE_ENV can be set without relying on shell syntax. `npm
 * start` runs scripts through cmd.exe on Windows, where `NODE_ENV=production
 * node ...` is not a command — it is a syntax error. Setting it here works
 * identically on every platform.
 */
process.env.NODE_ENV = 'production'

await import('../server/index.js')
