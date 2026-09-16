/**
 * Rate limiting.
 *
 * A fixed-window counter in memory. Deliberately the simplest thing that
 * works: for a single-process deployment this is genuinely sufficient, and a
 * sliding-window or token-bucket implementation would buy nothing that a
 * customer would ever notice.
 *
 * LIMITATION, stated plainly: this state lives in the process. Behind more than
 * one instance, each instance keeps its own counters, so the effective limit is
 * (limit x instances). Move the store to Redis before scaling out. The interface
 * below is shaped so that swap is contained to this file.
 *
 * The limiters are layered rather than clever. Login gets two: one keyed by IP
 * (blunts a spray across many accounts) and one keyed by email (blunts a
 * targeted attack from many IPs). Neither alone covers both.
 */

/** key -> { count, resetAt } */
const buckets = new Map()

/**
 * Identify the client.
 *
 * `req.ip` honours `trust proxy`, which must only be enabled when something
 * that actually sets X-Forwarded-For is in front of us — otherwise a client can
 * forge the header and mint themselves a fresh bucket per request.
 */
function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * Build a limiter middleware.
 *
 * @param {object}   options
 * @param {string}   options.name     Bucket namespace. Must be unique per limiter.
 * @param {number}   options.limit    Requests allowed per window.
 * @param {number}   options.windowMs Window length.
 * @param {Function} [options.keyFn]  Derive the key from the request. Defaults to IP.
 */
export function rateLimit({ name, limit, windowMs, keyFn = clientIp }) {
  if (!name || !limit || !windowMs) {
    throw new Error('rateLimit requires { name, limit, windowMs }')
  }

  /*
   * Each limiter can be overridden with an environment variable named after it,
   * e.g. RATE_LIMIT_LOGIN_IP=100. Two reasons this exists: the test suite needs
   * to make more requests than a real visitor ever would, and a deployment may
   * legitimately want different numbers without editing code. It cannot be used
   * to disable a limiter — the override must still be a positive number.
   */
  const envKey = `RATE_LIMIT_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
  const override = Number(process.env[envKey])
  const effectiveLimit = Number.isFinite(override) && override > 0 ? Math.floor(override) : limit

  return function rateLimiter(req, res, next) {
    const now = Date.now()
    const key = `${name}:${keyFn(req)}`

    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }

    bucket.count += 1

    const remaining = Math.max(0, effectiveLimit - bucket.count)
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

    // Advertised so a well-behaved client can back off without guessing.
    res.setHeader('RateLimit-Limit', String(effectiveLimit))
    res.setHeader('RateLimit-Remaining', String(remaining))
    res.setHeader('RateLimit-Reset', String(retryAfterSeconds))

    if (bucket.count > effectiveLimit) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({
        error: 'rate_limited',
        message: `Too many attempts. Try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'}.`,
      })
    }

    return next()
  }
}

/**
 * Sweep expired buckets.
 *
 * Without this the Map is an unbounded memory leak driven by whoever sends the
 * most requests from the most addresses. `unref` keeps the timer from holding
 * the process open, so it never blocks a clean shutdown.
 */
const sweep = setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}, 60_000)

sweep.unref?.()

/** Test seam. Not wired to any route. */
export function resetAllRateLimits() {
  buckets.clear()
}

export default { rateLimit, resetAllRateLimits }
