/**
 * Cookie helpers.
 *
 * Written by hand rather than pulled from a package because the defaults are
 * exactly where the security lives, and a helper that hides them is a helper
 * that lets someone turn them off by accident.
 *
 * The attributes that matter:
 *
 *   HttpOnly  — JavaScript cannot read the cookie, so an XSS bug cannot walk
 *               off with the session.
 *   SameSite  — Lax means the cookie is NOT sent on cross-site POSTs. This is
 *               the primary CSRF defence, and it works in every current browser
 *               without a token round-trip.
 *   Secure    — HTTPS only. Off in development because localhost is http, on in
 *               production. A cookie without it can be read off a downgraded
 *               connection.
 *   Path=/    — scoped to the whole site; there is no reason to narrow it.
 */

/**
 * Parse a `Cookie:` header.
 *
 * Only the pairs are extracted; no decoding beyond percent-decoding, because
 * anything cleverer becomes an injection surface.
 */
export function parseCookies(header) {
  const out = {}

  if (!header || typeof header !== 'string') return out

  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue

    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (!key) continue

    try {
      out[key] = decodeURIComponent(value)
    } catch {
      out[key] = value
    }
  }

  return out
}

export function serializeCookie(name, value, options = {}) {
  const {
    maxAgeSeconds,
    path = '/',
    httpOnly = true,
    secure = false,
    sameSite = 'Lax',
  } = options

  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`]

  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${Math.floor(maxAgeSeconds)}`)
  if (httpOnly) parts.push('HttpOnly')
  if (secure) parts.push('Secure')
  if (sameSite) parts.push(`SameSite=${sameSite}`)

  return parts.join('; ')
}

/**
 * Set a cookie on the response.
 *
 * `secure` is derived from the environment rather than passed in, so there is no
 * way for a call site to forget it in production.
 */
export function setCookie(res, name, value, { maxAgeSeconds, isProduction, ...rest } = {}) {
  const cookie = serializeCookie(name, value, {
    maxAgeSeconds,
    secure: Boolean(isProduction),
    ...rest,
  })

  appendSetCookie(res, cookie)
}

/** Expire a cookie by setting it to nothing with Max-Age=0. */
export function clearCookie(res, name, { isProduction, path = '/' } = {}) {
  appendSetCookie(
    res,
    serializeCookie(name, '', { maxAgeSeconds: 0, path, secure: Boolean(isProduction) }),
  )
}

/**
 * Append without clobbering.
 *
 * Express exposes `res.append('Set-Cookie', ...)`; Node's raw response needs the
 * array form. Supporting both keeps this usable from either.
 */
function appendSetCookie(res, cookie) {
  if (typeof res.append === 'function') {
    res.append('Set-Cookie', cookie)
    return
  }

  const existing = res.getHeader?.('Set-Cookie')
  const next = existing ? [].concat(existing, cookie) : cookie
  res.setHeader('Set-Cookie', next)
}

export default { parseCookies, serializeCookie, setCookie, clearCookie }
