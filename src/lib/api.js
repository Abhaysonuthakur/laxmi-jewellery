/**
 * API client.
 *
 * One place that knows how to talk to the backend, so no component ever calls
 * `fetch` directly. That matters for three reasons:
 *
 *   - every request must send cookies (`credentials`), and a single forgotten
 *     call site produces a bug that looks like "login randomly doesn't stick"
 *   - every error must arrive in the same shape, so forms can render a message
 *     without each one guessing at the response format
 *   - the base path is one string, so moving the API is a one-line change
 *
 * Requests go to a relative `/api` path. In development Vite proxies that to
 * :3001, which makes the browser treat it as same-origin — that is what lets the
 * session cookie work without any CORS configuration at all.
 */

const BASE = '/api'

/**
 * A failed request.
 *
 * `status` is 0 for a network failure — a distinction worth preserving, because
 * "the server said no" and "the server isn't running" need different advice.
 * `fields` carries per-field validation messages when the server sends them.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', fields = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isNetwork() {
    return this.status === 0
  }

  get isRateLimited() {
    return this.status === 429
  }
}

async function request(method, path, body) {
  const init = {
    method,
    // Explicit rather than relying on the default: this is the line that makes
    // the session cookie travel with the request.
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
  }

  if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, init)
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', { status: 0, code: 'network' })
  }

  const text = await res.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      // A non-JSON body from our own API means something upstream interfered —
      // a proxy error page, most likely. Surfacing the status is more useful
      // than surfacing an HTML fragment.
      throw new ApiError(`Unexpected response from the server (${res.status}).`, { status: res.status, code: 'bad_response' })
    }
  }

  if (!res.ok) {
    throw new ApiError(payload?.message || `Request failed (${res.status}).`, {
      status: res.status,
      code: payload?.error || 'error',
      fields: payload?.fields || null,
    })
  }

  return payload ?? {}
}

/* ------------------------------------------------------------------- auth */

export const api = {
  me: () => request('GET', '/auth/me'),

  register: ({ email, password, displayName }) =>
    request('POST', '/auth/register', { email, password, displayName }),

  login: ({ email, password }) => request('POST', '/auth/login', { email, password }),

  logout: () => request('POST', '/auth/logout'),

  updateProfile: ({ displayName }) => request('PATCH', '/auth/me', { displayName }),

  forgotPassword: ({ email }) => request('POST', '/auth/forgot-password', { email }),

  resetPassword: ({ token, password }) => request('POST', '/auth/reset-password', { token, password }),

  /* --------------------------------------------------------------- wishlist */

  getWishlist: () => request('GET', '/wishlist'),

  addToWishlist: ({ piece }) => request('POST', '/wishlist', { piece }),

  removeFromWishlist: ({ piece }) => request('DELETE', `/wishlist/${encodeURIComponent(piece)}`),

  /* ------------------------------------------------------------------ admin */

  adminUsers: () => request('GET', '/admin/users'),

  health: () => request('GET', '/health'),
}

export default api
