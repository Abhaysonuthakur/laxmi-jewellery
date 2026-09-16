/**
 * End-to-end API tests.
 *
 *   npm run test:api
 *
 * Spawns a throwaway server on its own port with its own database, exercises
 * every route over real HTTP, then tears it down. Nothing is mocked: these are
 * the actual Express handlers, the actual SQLite file, the actual scrypt hashes
 * and the actual cookies.
 *
 * The tests that matter most here are the ones asserting *refusals*. A backend
 * that registers and logs in correctly but leaks a password hash, enumerates
 * accounts, or lets one user read another's wishlist is not a backend — so
 * roughly half of what follows checks that the wrong things are impossible.
 */
import { spawn } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Node's fetch ignores proxy environment variables, but only as long as nobody
 * has set NODE_USE_ENV_PROXY. Clearing them removes the question entirely —
 * and it matters here, because this sandbox sets HTTP_PROXY to an intercepting
 * proxy that answers 502 for loopback addresses.
 */
for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy', 'NODE_USE_ENV_PROXY']) {
  delete process.env[key]
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 3999
const BASE = `http://127.0.0.1:${PORT}`
const DB_PATH = join(root, '.qa', 'test-api.db')

for (const suffix of ['', '-wal', '-shm']) {
  const file = DB_PATH + suffix
  if (existsSync(file)) rmSync(file, { force: true })
}

/* ------------------------------------------------------------- test harness */

let passed = 0
const failures = []
let currentSection = ''

function section(name) {
  currentSection = name
  console.log(`\n\x1b[1m${name}\x1b[0m`)
}

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  \x1b[32mPASS\x1b[0m ${label}`)
  } else {
    failures.push(`${currentSection} → ${label}${detail ? ` (${detail})` : ''}`)
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}${detail ? ` \x1b[90m${detail}\x1b[0m` : ''}`)
  }
}

/* --------------------------------------------------------------- http client */

/** A minimal cookie jar: remembers Set-Cookie per label so we can hold two users. */
function makeClient() {
  const jar = new Map()

  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  async function request(method, path, { body, rawBody, headers = {}, useCookies = true, origin } = {}) {
    const finalHeaders = { ...headers }

    if (body !== undefined || rawBody !== undefined) finalHeaders['content-type'] = 'application/json'
    if (useCookies && jar.size) finalHeaders.cookie = cookieHeader()
    if (origin !== undefined) finalHeaders.origin = origin

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    })

    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';')
      const eq = pair.indexOf('=')
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()

      if (value === '') jar.delete(name)
      else jar.set(name, value)
    }

    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      /* not JSON — leave null so a test can assert on raw text */
    }

    return { status: res.status, headers: res.headers, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
  }

  return {
    jar,
    cookieHeader,
    get: (path, opts) => request('GET', path, opts),
    post: (path, body, opts) => request('POST', path, { ...opts, body }),
    patch: (path, body, opts) => request('PATCH', path, { ...opts, body }),
    del: (path, opts) => request('DELETE', path, opts),
    raw: request,
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------ server control */

const serverLog = []
const server = spawn(process.execPath, [join(root, 'server', 'index.js')], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(PORT),
    DATABASE_PATH: DB_PATH,
    NODE_ENV: 'development',

    /*
     * Raise the two limiters this suite would otherwise trip through ordinary
     * use — it makes more register and login calls in ten seconds than a real
     * visitor makes in a month.
     *
     * RATE_LIMIT_LOGIN_ACCOUNT is deliberately left at its real value, because
     * the rate-limiting test depends on it actually firing.
     */
    RATE_LIMIT_REGISTER: '200',
    RATE_LIMIT_LOGIN_IP: '200',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

server.stdout.on('data', (d) => serverLog.push(d.toString()))
server.stderr.on('data', (d) => serverLog.push(d.toString()))

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return true
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  return false
}

function stopServer() {
  return new Promise((done) => {
    if (server.exitCode !== null) return done()
    server.once('exit', done)
    server.kill()
    setTimeout(() => {
      server.kill('SIGKILL')
      done()
    }, 2000).unref()
  })
}

/* -------------------------------------------------------------------- tests */

const A = makeClient()
const B = makeClient()
const ANON = makeClient()

const PW = 'correct-horse-battery'
const PW2 = 'a-different-passphrase'

async function run() {
  if (!(await waitForServer())) {
    console.error('\nServer never became healthy. Output:\n' + serverLog.join(''))
    process.exit(1)
  }

  /* ------------------------------------------------------------------ health */
  section('Health & headers')
  {
    const res = await ANON.get('/api/health')
    check('GET /api/health returns 200', res.status === 200, `got ${res.status}`)
    check('health reports ok', res.json?.ok === true)
    check('X-Powered-By is not disclosed', !res.headers.get('x-powered-by'))
    check('X-Content-Type-Options: nosniff', res.headers.get('x-content-type-options') === 'nosniff')
    check('X-Frame-Options: DENY', res.headers.get('x-frame-options') === 'DENY')
    check('unknown API path returns JSON 404', (await ANON.get('/api/nope')).status === 404)
  }

  /* ---------------------------------------------------------------- register */
  section('Registration')
  let userAId = null
  {
    const weak = await A.post('/api/auth/register', { email: 'a@example.com', password: 'short' })
    check('short password rejected (400)', weak.status === 400, `got ${weak.status}`)
    check('weak-password error names the field', Boolean(weak.json?.fields?.password))

    const common = await A.post('/api/auth/register', { email: 'a@example.com', password: 'password123' })
    check('common password rejected (400)', common.status === 400, `got ${common.status}`)

    const badEmail = await A.post('/api/auth/register', { email: 'not-an-email', password: PW })
    check('malformed email rejected (400)', badEmail.status === 400, `got ${badEmail.status}`)

    const ok = await A.post('/api/auth/register', { email: 'A@Example.com', password: PW, displayName: 'Asha' })
    check('valid registration returns 201', ok.status === 201, `got ${ok.status}`)
    check('email is normalised to lowercase', ok.json?.user?.email === 'a@example.com', `got ${ok.json?.user?.email}`)
    check('display name is stored', ok.json?.user?.displayName === 'Asha')
    check('role defaults to customer', ok.json?.user?.role === 'customer')
    check('response contains NO password hash', !/password_hash|scrypt\$|\$scrypt/.test(ok.text))
    userAId = ok.json?.user?.id

    const cookie = ok.setCookies[0] ?? ''
    check('session cookie is set on register', cookie.startsWith('laxmi_session='))
    check('cookie is HttpOnly', /HttpOnly/i.test(cookie))
    check('cookie is SameSite=Lax', /SameSite=Lax/i.test(cookie))
    check('cookie has Path=/', /Path=\//i.test(cookie))
    check('cookie is NOT Secure in development', !/;\s*Secure/i.test(cookie))

    const dup = await ANON.post('/api/auth/register', { email: 'a@EXAMPLE.com', password: PW })
    check('duplicate email rejected case-insensitively (409)', dup.status === 409, `got ${dup.status}`)

    const missing = await ANON.post('/api/auth/register', {})
    check('empty body rejected (400)', missing.status === 400, `got ${missing.status}`)

    const malformed = await ANON.raw('POST', '/api/auth/register', { rawBody: '{"email": "a@example.com",,}' })
    check('malformed JSON returns 400, not 500', malformed.status === 400, `got ${malformed.status}`)
    check('malformed JSON is reported as bad_json', malformed.json?.error === 'bad_json', `got ${malformed.json?.error}`)

    const noBody = await ANON.raw('POST', '/api/auth/register', { headers: { 'content-type': 'application/json' } })
    check('request with no body does not 500', noBody.status < 500, `got ${noBody.status}`)

    const oversized = await ANON.raw('POST', '/api/auth/register', {
      rawBody: JSON.stringify({ email: 'a@example.com', password: PW, displayName: 'x'.repeat(40_000) }),
    })
    check('oversized body is refused (413)', oversized.status === 413, `got ${oversized.status}`)
  }

  /* ------------------------------------------------------------------- login */
  section('Login — no account enumeration')
  {
    const wrongPw = await ANON.post('/api/auth/login', { email: 'a@example.com', password: 'wrong-password' })
    const noUser = await ANON.post('/api/auth/login', { email: 'ghost@example.com', password: 'wrong-password' })

    check('wrong password returns 401', wrongPw.status === 401, `got ${wrongPw.status}`)
    check('unknown email returns 401', noUser.status === 401, `got ${noUser.status}`)
    check(
      'both failures are byte-identical (no enumeration)',
      wrongPw.text === noUser.text,
      `"${wrongPw.json?.message}" vs "${noUser.json?.message}"`,
    )

    /*
     * Timing is a real signal, not a theoretical one. Without burnPasswordTime()
     * the unknown-email path returns in ~1ms while the wrong-password path
     * takes ~100ms. This samples both and requires them to be within the same
     * order of magnitude.
     */
    const sample = async (email) => {
      const started = process.hrtime.bigint()
      await ANON.post('/api/auth/login', { email, password: 'wrong-password' })
      return Number(process.hrtime.bigint() - started) / 1e6
    }

    const known = (await Promise.all([sample('a@example.com'), sample('a@example.com')])).reduce((a, b) => a + b) / 2
    const unknown = (await Promise.all([sample('nobody@example.com'), sample('nobody@example.com')])).reduce((a, b) => a + b) / 2
    const ratio = Math.max(known, unknown) / Math.max(1, Math.min(known, unknown))

    check(
      'timing of known vs unknown email is comparable',
      ratio < 3,
      `known ${known.toFixed(0)}ms vs unknown ${unknown.toFixed(0)}ms (ratio ${ratio.toFixed(2)})`,
    )

    const ok = await A.post('/api/auth/login', { email: 'a@example.com', password: PW })
    check('correct credentials return 200', ok.status === 200, `got ${ok.status}`)
    check('login sets a session cookie', ok.setCookies.length > 0)
    check('login response contains no hash', !/password_hash|scrypt\$/.test(ok.text))

    const missing = await ANON.post('/api/auth/login', { email: 'a@example.com' })
    check('missing password rejected (400)', missing.status === 400, `got ${missing.status}`)
  }

  /* ---------------------------------------------------------------------- me */
  section('Session identity')
  {
    const me = await A.get('/api/auth/me')
    check('GET /me with cookie returns the user', me.status === 200 && me.json?.user?.email === 'a@example.com')
    check('/me never includes a hash', !/password_hash|scrypt\$/.test(me.text))

    const anon = await ANON.get('/api/auth/me')
    check('GET /me without cookie returns 401', anon.status === 401, `got ${anon.status}`)

    const forged = await ANON.get('/api/auth/me', { headers: { cookie: 'laxmi_session=totally-made-up-token' } })
    check('forged session token returns 401', forged.status === 401, `got ${forged.status}`)

    const renamed = await A.patch('/api/auth/me', { displayName: 'Asha Thakur' })
    check('PATCH /me updates the display name', renamed.status === 200 && renamed.json?.user?.displayName === 'Asha Thakur')

    const longName = await A.patch('/api/auth/me', { displayName: 'x'.repeat(200) })
    check('over-long display name rejected (400)', longName.status === 400, `got ${longName.status}`)
  }

  /* ---------------------------------------------------------------- wishlist */
  section('Wishlist')
  {
    const anon = await ANON.get('/api/wishlist')
    check('unauthenticated wishlist read is 401', anon.status === 401, `got ${anon.status}`)

    const anonWrite = await ANON.post('/api/wishlist', { piece: 'ring' })
    check('unauthenticated wishlist write is 401', anonWrite.status === 401, `got ${anonWrite.status}`)

    const empty = await A.get('/api/wishlist')
    check('new account has an empty wishlist', empty.status === 200 && empty.json?.items?.length === 0)

    const added = await A.post('/api/wishlist', { piece: 'ring' })
    check('adding a real piece returns 201', added.status === 201, `got ${added.status}`)
    check('wishlist now holds one item', added.json?.items?.length === 1)

    const again = await A.post('/api/wishlist', { piece: 'ring' })
    check('adding the same piece twice is idempotent', again.json?.items?.length === 1, `got ${again.json?.items?.length}`)

    const bogus = await A.post('/api/wishlist', { piece: '../../etc/passwd' })
    check('piece not in the catalogue is rejected (400)', bogus.status === 400, `got ${bogus.status}`)

    const sql = await A.post('/api/wishlist', { piece: "ring'; DROP TABLE users;--" })
    check('SQL-ish piece value is rejected (400)', sql.status === 400, `got ${sql.status}`)

    await A.post('/api/wishlist', { piece: 'necklace' })
    const two = await A.get('/api/wishlist')
    check('two distinct pieces are stored', two.json?.items?.length === 2, `got ${two.json?.items?.length}`)
    check('wishlist response exposes the catalogue', Array.isArray(two.json?.catalogue) && two.json.catalogue.length === 4)

    const removed = await A.del('/api/wishlist/ring')
    check('removing a piece returns the remaining list', removed.status === 200 && removed.json?.items?.length === 1)

    const removedAgain = await A.del('/api/wishlist/ring')
    check('removing a missing piece is not an error', removedAgain.status === 200, `got ${removedAgain.status}`)

    /* Isolation — the whole reason user_id comes from the session. */
    const regB = await B.post('/api/auth/register', { email: 'b@example.com', password: PW, displayName: 'Bina' })
    check('second user registers', regB.status === 201, `got ${regB.status}`)

    const bList = await B.get('/api/wishlist')
    check("user B does not see user A's wishlist", bList.json?.items?.length === 0, `B sees ${bList.json?.items?.length}`)

    await B.post('/api/wishlist', { piece: 'earrings' })
    const aList = await A.get('/api/wishlist')
    check("user A does not see user B's wishlist", aList.json?.items?.length === 1, `A sees ${aList.json?.items?.length}`)
    check("A's remaining item is still necklace", aList.json?.items?.[0]?.piece === 'necklace')

    const bDel = await B.del('/api/wishlist/necklace')
    check("user B deleting a piece cannot touch A's row", bDel.json?.items?.length === 1 && bDel.json.items[0].piece === 'earrings')
    const aAfter = await A.get('/api/wishlist')
    check("A's list survived B's delete attempt", aAfter.json?.items?.length === 1 && aAfter.json.items[0].piece === 'necklace')
  }

  /* ------------------------------------------------------------------- admin */
  section('Admin authorisation')
  {
    const anon = await ANON.get('/api/admin/users')
    check('admin route unauthenticated is 401', anon.status === 401, `got ${anon.status}`)

    const asCustomer = await A.get('/api/admin/users')
    check('admin route as customer is 403', asCustomer.status === 403, `got ${asCustomer.status}`)
    check('403 does not leak the user list', !asCustomer.text.includes('@example.com'))

    // Promote via the real CLI, then log in fresh — this tests the documented
    // bootstrap path rather than poking the database directly.
    const cli = spawn(process.execPath, [join(root, 'scripts', 'create-admin.mjs'), '--email', 'boss@example.com', '--password', PW], {
      cwd: root,
      env: { ...process.env, DATABASE_PATH: DB_PATH, NODE_ENV: 'development' },
    })
    const cliOut = await new Promise((done) => {
      let out = ''
      cli.stdout.on('data', (d) => (out += d))
      cli.stderr.on('data', (d) => (out += d))
      cli.on('exit', (code) => done({ code, out }))
    })
    check('create-admin script succeeds', cliOut.code === 0, cliOut.out.trim().split('\n')[0])
    check('create-admin reports the admin count', /admins: 1/.test(cliOut.out), cliOut.out.trim().replace(/\n/g, ' '))

    const admin = makeClient()
    const login = await admin.post('/api/auth/login', { email: 'boss@example.com', password: PW })
    check('admin can log in', login.status === 200 && login.json?.user?.role === 'admin', `got ${login.status}`)

    const list = await admin.get('/api/admin/users')
    check('admin can read the user list', list.status === 200 && Array.isArray(list.json?.users))
    check('user list includes both customers', list.json?.users?.length === 3, `got ${list.json?.users?.length}`)
    check('user list contains NO password hashes', !/password_hash|scrypt\$/.test(list.text))
    check('user list reports wishlist counts', list.json?.users?.find((u) => u.email === 'a@example.com')?.wishlistCount === 1)
  }

  /* ------------------------------------------------------------------ logout */
  section('Logout & session invalidation')
  {
    const beforeLogout = await A.get('/api/auth/me')
    check('session is valid before logout', beforeLogout.status === 200)

    const staleToken = A.jar.get('laxmi_session')

    const out = await A.post('/api/auth/logout')
    check('logout returns 200', out.status === 200, `got ${out.status}`)
    check('logout clears the cookie', (out.setCookies[0] ?? '').includes('Max-Age=0'))

    const after = await A.get('/api/auth/me')
    check('session is gone after logout', after.status === 401, `got ${after.status}`)

    // The critical case: a copied cookie must stop working server-side, not just
    // be forgotten by one browser.
    const replay = await ANON.get('/api/auth/me', { headers: { cookie: `laxmi_session=${staleToken}` } })
    check('logged-out token cannot be replayed', replay.status === 401, `got ${replay.status}`)
  }

  /* ---------------------------------------------------------- password reset */
  section('Password reset')
  {
    const unknown = await ANON.post('/api/auth/forgot-password', { email: 'ghost@example.com' })
    const known = await ANON.post('/api/auth/forgot-password', { email: 'b@example.com' })
    check('forgot-password returns 200 for an unknown email', unknown.status === 200, `got ${unknown.status}`)
    check('responses are identical for known and unknown email', unknown.json?.message === known.json?.message)

    const resetUrl = known.json?.devResetUrl
    check('dev build returns a reset link for testing', typeof resetUrl === 'string' && resetUrl.includes('token='))
    check('reset link is logged to the server console', serverLog.join('').includes('password reset'))

    const token = new URL(resetUrl).searchParams.get('token')
    check('reset token is a long random string', typeof token === 'string' && token.length >= 40, `length ${token?.length}`)

    const weak = await ANON.post('/api/auth/reset-password', { token, password: 'short' })
    check('reset rejects a weak password (400)', weak.status === 400, `got ${weak.status}`)

    const bogus = await ANON.post('/api/auth/reset-password', { token: 'not-a-real-token', password: PW2 })
    check('reset rejects a bogus token (400)', bogus.status === 400, `got ${bogus.status}`)

    const good = await ANON.post('/api/auth/reset-password', { token, password: PW2 })
    check('reset with a valid token succeeds', good.status === 200, `got ${good.status}`)

    const reuse = await ANON.post('/api/auth/reset-password', { token, password: 'yet-another-passphrase' })
    check('reset token cannot be used twice', reuse.status === 400, `got ${reuse.status}`)

    const oldPw = await ANON.post('/api/auth/login', { email: 'b@example.com', password: PW })
    check('old password no longer works', oldPw.status === 401, `got ${oldPw.status}`)

    const newPw = await ANON.post('/api/auth/login', { email: 'b@example.com', password: PW2 })
    check('new password works', newPw.status === 200, `got ${newPw.status}`)

    // B's session from before the reset must be dead.
    const staleB = await B.get('/api/auth/me')
    check("a session opened before the reset is invalidated", staleB.status === 401, `got ${staleB.status}`)
  }

  /* ------------------------------------------------------------------ origin */
  section('CSRF / origin check')
  {
    const evil = await A.raw('POST', '/api/auth/login', {
      origin: 'https://evil.example.com',
      body: { email: 'a@example.com', password: PW },
    })
    check('cross-origin POST is refused (403)', evil.status === 403, `got ${evil.status}`)

    const good = await A.raw('POST', '/api/auth/login', {
      origin: 'http://127.0.0.1:5173',
      body: { email: 'a@example.com', password: PW },
    })
    check('allow-listed origin is accepted', good.status === 200, `got ${good.status}`)

    const noOrigin = await A.raw('POST', '/api/auth/login', { body: { email: 'a@example.com', password: PW } })
    check('non-browser client with no Origin is accepted', noOrigin.status === 200, `got ${noOrigin.status}`)
  }

  /* ------------------------------------------------------------ rate limiting */
  section('Rate limiting')
  {
    // Deliberately last: this exhausts the login limiter for this address.
    let limited = null
    let attempts = 0

    for (let i = 0; i < 15; i += 1) {
      attempts += 1
      const res = await ANON.post('/api/auth/login', { email: 'ratelimit@example.com', password: 'wrong-password' })
      if (res.status === 429) {
        limited = res
        break
      }
    }

    check('repeated failed logins eventually return 429', limited !== null, `no 429 after ${attempts} attempts`)
    check('429 includes a Retry-After header', Boolean(limited?.headers.get('retry-after')))
    check('429 body explains the limit', limited?.json?.error === 'rate_limited')

    const header = await ANON.post('/api/auth/login', { email: 'ratelimit@example.com', password: 'wrong-password' })
    check('limit is still enforced on the next attempt', header.status === 429, `got ${header.status}`)
  }

  /* -------------------------------------------------------------------- done */
  console.log(`\n${'─'.repeat(60)}`)
  if (failures.length === 0) {
    console.log(`\x1b[32m  ${passed} passed, 0 failed\x1b[0m`)
  } else {
    console.log(`\x1b[31m  ${passed} passed, ${failures.length} FAILED\x1b[0m\n`)
    for (const failure of failures) console.log(`  \x1b[31m✗\x1b[0m ${failure}`)
  }
  console.log(`${'─'.repeat(60)}\n`)
}

try {
  await run()
} catch (err) {
  console.error('\nTest run threw:', err)
  console.error('\nServer output:\n' + serverLog.join(''))
  process.exitCode = 1
} finally {
  await stopServer()
  for (const suffix of ['', '-wal', '-shm']) {
    const file = DB_PATH + suffix
    if (existsSync(file)) rmSync(file, { force: true })
  }
  process.exit(process.exitCode ?? (failures.length ? 1 : 0))
}
