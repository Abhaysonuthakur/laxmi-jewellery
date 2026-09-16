# LAXMI JEWELLERY — Matihani, Nepal

A light, cinematic, scroll-driven 3D jewellery experience. Not an e-commerce
site: an Awwwards-style interactive product piece built around one continuous
WebGL story.

**Palette:** ivory `#F8F5EF` · cream `#FFFDF8` · champagne gold `#C9A24D` ·
ink `#211E19` · muted `#777066` · accent `#8B2331`.
Never dark. Never neon.

---

## 1. Getting it running

```bash
cd laxmi-jewellery
npm install
npm run dev:all      # web on :5173 + api on :3001 — one command, one Ctrl-C
```

Then open <http://127.0.0.1:5173>.

Other commands:

```bash
npm run dev          # frontend only
npm run dev:api      # api only, restarts on change
npm run build        # production bundle into dist/
npm start            # production: serves the built site AND the api from :3001
npm run preview      # serve the built bundle alone — no api, so auth will not work
npm run test:api     # 92 end-to-end api tests against a throwaway database
npm run create-admin -- --email you@example.com --password 'a long passphrase'
```

**Run both halves.** `npm run dev` alone gives you a site whose sign-in button
does nothing — the frontend proxies `/api` to `:3001`, and if nothing is
listening there every auth call fails. `npm run dev:all` starts both and takes
them both down together, which is why it is the recommended command.

There is no seeded admin account and there never will be. Use `create-admin`
(above) to make one; `--promote` upgrades an account that already registered
through the normal form.

Verified on **Node 24.13.0 / npm 10.9.7** and **Node 22.22.2**.

## 2. Stack — exact installed versions

| Package | Version | Role |
|---|---|---|
| `react` / `react-dom` | 19.2.8 | UI runtime |
| `react-router-dom` | 7.18.4 | routing for the account pages |
| `vite` | 8.3.0 | build (Rolldown-based) |
| `tailwindcss` + `@tailwindcss/vite` | 4.3.3 | styling (CSS-first config) |
| `three` | 0.186.0 | WebGL |
| `@react-three/fiber` | 9.7.0 | React renderer for three |
| `@react-three/drei` | 10.7.8 | `Environment`, `Lightformer`, `ContactShadows`, `useGLTF` |
| `gsap` | 3.15.0 | ScrollTrigger scroll choreography |
| `lenis` | 1.3.26 | smooth scroll |
| `framer-motion` | 12.43.0 | UI enter/exit, magnetic buttons |
| `express` | 5.2.1 | **server only** — routing, body parsing, static files |

### Backend dependencies: exactly one

The API is Express plus four things that ship inside Node:

| Need | Solution | Why not a package |
|---|---|---|
| database | `node:sqlite` (`DatabaseSync`) | real SQL, real transactions, real foreign keys, **zero** dependencies and no native module to compile |
| password hashing | `node:crypto` `scrypt` | memory-hard KDF; bcrypt/argon2 would mean node-gyp and a platform binary that goes stale |
| tokens | `node:crypto` `randomBytes` + SHA-256 | 256 bits of CSPRNG output needs no library |
| cookies | `server/lib/cookies.js` | 60 lines, and the defaults *are* the security — a helper that hides them lets someone switch them off by accident |

Express 5 is a genuinely different major version from 4 in ways that bite:
`app.get('*')` **throws** (path-to-regexp v8 removed the bare wildcard), so the
SPA fallback in `server/index.js` is a plain middleware rather than a route.
Async errors are forwarded automatically, so route handlers do not need
`try/catch` wrappers.

**React is pinned to 19.2.x on purpose.** `@react-three/fiber@9.7` declares
`react >=19 <19.3`. Installing the latest React (19.3.0) breaks the peer graph
and `npm install` fails outright. Do not "helpfully" bump it.

**framer-motion is pinned to 12.43.0 on purpose.** `npm install framer-motion`
resolves to 13.3.0, which is broken in this project: it applies each element's
`initial` style but never animates to the `animate` target. The failure is
silent — no console warning, no thrown error — and it takes the whole page with
it:

- `<h1>` stays at `opacity: 0` forever, so the hero is blank.
- The navbar stays at `translateY(-80px)`, i.e. 80px above the viewport, so
  there is no navigation either.
- The page looks empty while the DOM and the console both look healthy.

Verified in the browser against both versions:

```
framer-motion 13.3.0  →  h1 style: "opacity: 0; transform: translateY(26px);"
framer-motion 12.43.0 →  h1 style: "opacity: 1; transform: none;"
```

If you ever need to revisit this, the test is one line — load the dev server and
read `document.querySelector('h1').getAttribute('style')` after two seconds. It
must not still say `opacity: 0`.

**Tailwind is v4, not v3.** There is no `tailwind.config.js` and there never
should be. All design tokens live in `@theme` inside `src/index.css`. Mixing v3
and v4 syntax in one project is the fastest way to a silent, baffling bug.

## 3. Folder structure

```
laxmi-jewellery/
├── index.html                    fonts, meta, SEO, #root
├── vite.config.js                plugins, @ alias, chunk splitting, /api proxy
├── jsconfig.json                 @/* path alias for editors
├── .env.example                  copy to .env; every value has a dev default
├── public/
│   ├── favicon.svg
│   ├── images/                   ← photography drop-zone (+ README)
│   └── models/                   ← .glb drop-zone (+ README)
├── server/                       ── THE BACKEND ──────────────────────
│   ├── index.js                  express app, middleware order, static + SPA fallback
│   ├── config.js                 env loading and validated config
│   ├── db.js                     node:sqlite connection + schema (idempotent)
│   ├── lib/
│   │   ├── passwords.js          scrypt hash/verify + timing-burn for unknown users
│   │   ├── tokens.js             random tokens, SHA-256 storage, constant-time compare
│   │   ├── cookies.js            httpOnly / SameSite=Lax / Secure cookie helpers
│   │   ├── sessions.js           session create / resolve / destroy
│   │   ├── users.js              all user SQL; publicUser() strips the hash
│   │   ├── pieces.js             catalogue keys, imported from src/data/models.js
│   │   ├── rate-limit.js         in-memory fixed-window limiter
│   │   └── validate.js           email / password / name rules
│   ├── middleware/auth.js        attachUser, requireAuth, requireAdmin, requireSameOrigin
│   ├── routes/
│   │   ├── auth.js               register, login, logout, me, forgot/reset
│   │   ├── wishlist.js           scoped to req.user.id, always
│   │   └── admin.js              read-only staff listing
│   └── data/                     ← the .db file lives here (gitignored)
├── scripts/
│   ├── dev.mjs                   runs web + api together
│   ├── start.mjs                 production entry (sets NODE_ENV cross-platform)
│   ├── create-admin.mjs          the only way to make a staff account
│   └── test-api.mjs              92 end-to-end api tests
└── src/
    ├── main.jsx                  React root + router + providers
    ├── App.jsx                   routes + page composition + preloader gate
    ├── index.css                 ALL design tokens, base, utilities
    ├── auth/
    │   ├── AuthProvider.jsx      current user; the session lives in a cookie it cannot read
    │   ├── WishlistProvider.jsx  saved pieces, shared by navbar and account page
    │   └── guards.jsx            RequireAuth / RequireAdmin / RedirectIfAuthenticated
    ├── pages/                    Login, Register, ForgotPassword, ResetPassword,
    │                             Account, Admin, NotFound
    ├── data/
    │   ├── images.js             single source of truth for image paths
    │   ├── models.js             single source of truth for .glb paths
    │   ├── pieces.js             catalogue keys + presentation, validated at load
    │   └── site.js               brand copy, nav, collections, contact
    ├── lib/
    │   ├── api.js                the only place that calls fetch()
    │   ├── gsap.js               one-time plugin registration
    │   ├── smooth-scroll.jsx     Lenis ⇄ ScrollTrigger wiring + scroll lock
    │   └── anim.js               easings, springs, damp(), mapRange()
    ├── hooks/
    │   ├── usePrefersReducedMotion.js
    │   ├── useMediaQuery.js
    │   ├── useDeviceTier.js      quality tiers + particle budgets
    │   ├── usePointer.js         cursor tracking with zero re-renders
    │   └── useScrollReveal.js    the default `data-reveal` entrance
    ├── components/
    │   ├── layout/               Preloader, Navbar, ScrollProgress, Footer
    │   ├── auth/                 AuthLayout (header/backdrop), Field, SubmitButton
    │   ├── ui/                   MediaFrame, MagneticButton, GoldLine,
    │   │                         SectionHeading, MithilaPattern
    │   └── 3d/
    │       ├── Scene3D.jsx        ← THE ONLY 3D IMPORT SECTIONS USE
    │       ├── SceneRuntime.jsx   lazy boundary (three.js lives here)
    │       ├── JewelleryScene.jsx Canvas wrapper
    │       ├── JewelleryLighting.jsx studio rig
    │       ├── InteractivePiece.jsx pointer-driven rotation
    │       ├── Model.jsx          .glb loader + procedural fallback
    │       ├── GoldMaterial.jsx   PBR gold recipe
    │       ├── FloatingParticles.jsx
    │       └── Necklace / Ring / Bangle / Earrings.jsx
    └── sections/                 one file per scroll beat, in page order
```

### Routes

| Path | Renders | Guard |
|---|---|---|
| `/` | the showcase | — |
| `/login` | sign in | redirects to `/account` if already signed in |
| `/register` | create account | same |
| `/forgot-password` | request a reset link | same |
| `/reset-password?token=…` | choose a new password | **none** — a reset link must work even in a browser holding a stale session |
| `/account` | saved pieces, name, sign out | `RequireAuth` |
| `/admin` | registered accounts (read-only) | `RequireAdmin` |
| `*` | 404 | — |

### API

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/health` | — | uptime probe |
| `POST` | `/api/auth/register` | — | 5/hour/IP |
| `POST` | `/api/auth/login` | — | 20/15min/IP **and** 10/15min/email |
| `POST` | `/api/auth/logout` | — | destroys the session server-side |
| `GET` | `/api/auth/me` | — | 401 when signed out; this is the session check |
| `PATCH` | `/api/auth/me` | ✔ | display name only |
| `POST` | `/api/auth/forgot-password` | — | always reports success |
| `POST` | `/api/auth/reset-password` | — | single-use token; kills all sessions |
| `GET` | `/api/wishlist` | ✔ | returns items **and** the valid catalogue |
| `POST` | `/api/wishlist` | ✔ | body `{ piece }`; idempotent |
| `DELETE` | `/api/wishlist/:piece` | ✔ | idempotent |
| `GET` | `/api/admin/users` | admin | no hashes, no tokens |

## 4. Architecture decisions worth keeping

These are the load-bearing choices. Changing one without understanding it will
break something subtle.

### 4.1 The 3D boundary is a prop API, not children

Sections never import from `components/3d/` except `Scene3D`:

```jsx
<Scene3D className="h-[68vw] lg:h-full" piece="necklace" interactive contactShadow />
```

Everything else that touches `three` sits behind `React.lazy` in
`SceneRuntime.jsx`. **If a section ever renders `<Necklace />` directly, that
import drags three.js back into the main bundle and the code split silently
stops working** — the build still succeeds, the site still works, and you only
find out when someone checks the network tab.

Current split: entry `49 kB` → React `178 kB` → motion `280 kB` → 3D `1026 kB`
(278 kB gzipped), requested only when a canvas comes within 320 px of the
viewport.

### 4.2 Lenis and ScrollTrigger are wired in exactly one place

`src/lib/smooth-scroll.jsx`. Three details matter and are easy to get wrong:

1. `lenis.on('scroll', ScrollTrigger.update)` — without it, pins drift.
2. Lenis is driven by `gsap.ticker`, so both run on one clock. The ticker gives
   **seconds**, Lenis wants **milliseconds** — hence `raf(time * 1000)`.
3. `autoRaf: false` on the Lenis instance, or you get two competing RAF loops.

Reduced-motion visitors get **no Lenis at all** — native scrolling, and every
GSAP timeline is skipped rather than shortened.

### 4.3 `gsap.context()` for every component, always

```js
const ctx = gsap.context(() => { /* ... */ }, scopeRef.current)
return () => ctx.revert()
```

`ctx.revert()` kills the tweens **and** their ScrollTriggers. Skipping it is how
scroll sites end up with orphaned triggers firing at detached DOM nodes after a
route change or hot reload.

### 4.4 Animation lives on transform / opacity / filter / clip-path only

Never animate `width`, `height`, `top`, `left`, `margin`, `padding` or
`font-size`. Use `transform: scale()` or `clip-path` instead. There is one
exception in the codebase (the preloader's split panels use `translateY`, which
is a transform — fine).

### 4.5 Cursor tracking never calls setState

`usePointer()` returns a **ref**, not state. `useFrame` reads it and damps
toward it. Calling `setState` on `pointermove` is the classic way to turn a
60 fps scene into a 20 fps one.

### 4.6 Every canvas pauses when off screen

`JewelleryScene` uses an `IntersectionObserver` to set `frameloop="never"` when
a canvas leaves the viewport. With four canvases on one page, an always-on
render loop in each is the difference between a laptop that is warm and one
that is not.

### 4.7 Missing assets are a supported state, not an error

- No `.glb`? `Model.jsx` probes with `HEAD`, sees it is absent, and renders a
  procedural gold stand-in. No crash, no empty canvas.
- No `.webp`? `MediaFrame` renders a reserved ivory plate with the slot name.
- Either way the box always has its `aspect-ratio` set, so dropping the real
  files in causes **zero layout shift** and does not disturb ScrollTrigger.

### 4.8 Entrances are explicit, never variant-propagated

Do not use a parent `motion` element with `variants` + `staggerChildren` to
orchestrate a group entrance. When the parent's own target variant resolves to
an empty object — which is exactly what an orchestrator's `hidden: {}` is — the
variant label does not propagate, and every child stays pinned at its `initial`
state permanently.

That was tried first and failed in exactly this way: the parent reported the
revealed state while `<h1>` still computed to `opacity: 0` after six seconds.

Give each element its own `initial` / `animate` pair. `Hero.jsx` has the
pattern; copy it. It is a few lines longer and it cannot fail this way.

### 4.9 Critical content is never gated on a single signal

`App.jsx` runs a timed failsafe that forces the hero visible ~2.6s after mount,
just past the preloader's own reveal. A handshake between two components with
independent timers should not be able to leave the first screen blank — and if
it ever does, nothing appears in the console to tell you.

### 4.10 No invented business data

`src/data/site.js` keeps phone, address, hours, map URL and social links empty
on purpose. `Showroom.jsx` renders an explicit "awaiting details" state for each
one rather than a dead link. **Do not fill these with plausible-looking values.**

### 4.11 The DOM and the WebGL layer talk through a number, not through React

`src/lib/scroll-channels.js` is a mutable singleton registry. GSAP
ScrollTrigger writes `channel('hero').progress`; `HeroStage` reads it inside
`useFrame`. Neither layer imports the other, and nothing re-renders.

Putting scroll progress in `useState` would schedule a React render of the whole
section tree 60 times a second — the single most common way to turn a smooth 3D
site into a janky one. A mutable object costs nothing to read.

The corollary matters just as much: **the 3D work is not a set of CSS tweens on
a wrapper element.** Transforming the canvas with GSAP would slide a picture
around, not move a camera. Publishing a number and letting the 3D layer
interpret it is what makes the camera actually orbit the piece.

### 4.12 Idle motion is bounded, never accumulating

The hero's piece sways `sin(t * 0.42) * 0.085` — about ±5°, on a ~15 second
period. It does **not** do `idle += dt * speed`.

This looks like a stylistic choice and is actually a correctness one. The
choreography's rotation track (`PIECE_SPIN`) is authored as an *absolute* value
per scroll position: −0.22 rad at the top of the section through to 2.75 rad at
the bottom. An accumulating turntable added on top makes the pose depend on how
long the visitor has been on the page, so the same scroll position shows a
different angle every visit — and after a couple of minutes the piece has
rotated past edge-on and is presenting itself as a thin sliver. Measured drift
before the fix, sampled every ~7s at a fixed scroll position:

```
rotY 0.284 → 0.578 → 1.43        (unbounded: 0.05 rad/s, never returns)
rotY -0.332 → -0.466 → -0.350 → -0.443 → -0.377 → -0.417   (bounded sway)
```

**Any accumulating animation on an authored track has this bug.** Prefer a
bounded function of elapsed time.

### 4.13 A missing capability signal means "unknown", not "weak"

`useDeviceTier` used to read `navigator.deviceMemory || 4`. `deviceMemory` is
Chromium-only — Safari and Firefox return `undefined` — so the fallback made
`memory <= 4` true for every non-Chromium visitor. Every Safari and Firefox
user was silently classified as a weak device: 300 particles instead of 800,
dpr capped at 1.5, and no mouse parallax at all.

Both signals are now read as `null` when unavailable and only compared when
actually present. `hardwareConcurrency` is supported everywhere and still
catches genuinely low-core machines, and phones are handled by the
`isTouch && isSmallScreen` branch regardless.

**Rule:** when a capability hint is absent, fail toward the better experience.
Never let a default value masquerade as a measurement.

### 4.14 A fixed-height stage must respond to viewport HEIGHT, not just width

The hero's heading lives inside a `100dvh` sticky stage. Every other heading on
the site sits in normal flow, where tall type simply makes the page taller. In a
fixed-height stage it has nowhere to go — and the failure is invisible at the
size you happen to be developing at.

Two separate collisions, both only below ~814px of viewport height:

1. **Eyebrow under the navbar.** The `h1` used a width-only
   `clamp(2.5rem, 10.5vw, 7.5rem)`, so it was 120px whether the window was 900px
   tall or 443px. Worse, the heading sat in a `1fr` grid row with `self-end`, so
   once it was taller than half the stage it grew *upward*, straight through the
   fixed 85px navbar.

2. **Scroll-cue strip on top of the CTA.** The baseline strip is
   `absolute bottom-0`, so it takes no part in layout and cannot push anything —
   which also means it is the first thing to collide when the window shrinks.

The fixes, in order of importance:

- The heading now sits in an **`auto`** grid row, not `1fr` + `self-end`. An auto
  row grows to fit its content, so upward overflow is structurally impossible
  rather than merely unlikely.
- `display-hero` in `src/index.css` is height-aware:
  `clamp(2.5rem, min(10.5vw, calc(47vh - 148px)), 7.5rem)`. The `vh` term is
  calibrated against the *measured* column, not guessed — see the comment there
  for the derivation and the two measured points it is fitted to.
- The top padding and the two 28px gaps are fluid (`14vh`, `3vh`), so the
  vertical rhythm compresses before the type has to.
- The decorative strip is dropped below 660px of height via a combined
  `@media (min-width:1024px) and (min-height:660px)` query.

**Verified with no overlap, no clipping and no horizontal overflow at
1440×900 / 800 / 700 / 660 / 600 / 550 / 500 / 443 / 400, and at 1280×720 and
1024×640.** The 120px heading is preserved down to 600px tall, so the desktop
design is untouched; it only shrinks on genuinely short windows.

**Rule:** if a component's height is fixed to the viewport, every value inside it
that affects vertical space must be a function of viewport height. Measure the
real box positions before writing the clamp — a hand-derived constant was off
enough to leave a 1px clip at 400px and a 13px clip at 443px.

### 4.15 The session token is never stored, only its hash

`server/lib/tokens.js`. The client gets 256 bits of CSPRNG output in an httpOnly
cookie; the database stores only the SHA-256 of it. A leaked database therefore
contains no usable session — the attacker would have to invert SHA-256 to replay
one.

A **plain** SHA-256 is the right choice here, and a slow KDF would be the wrong
one. Passwords need scrypt because humans pick guessable ones and the attacker
can grind offline. These tokens have no dictionary to attack, and the hash runs
on *every authenticated request*, so it has to be fast.

### 4.16 Login must take the same time whether or not the account exists

`server/lib/passwords.js` → `burnPasswordTime()`. Without it, "no such user"
returns in about a millisecond while "wrong password" spends ~100ms in scrypt,
and that gap is a reliable "is this address registered?" oracle — no error
message required.

So the no-such-user path hashes against a dummy and throws the result away. The
test suite asserts it: two samples of each path must land within 3× of each
other.

The related rule is that both failures return a **byte-identical** body. The test
compares the raw response text, not just the status code, because "Invalid email
or password" versus "No account with that email" is the same leak in words.

### 4.17 `SameSite=Lax` is the CSRF defence; the Origin check is the backstop

The cookie's `SameSite=Lax` means a browser will not attach it to a cross-site
POST at all, which removes the attack rather than detecting it. `requireSameOrigin`
in `server/middleware/auth.js` is the second layer, and it exists because
`SameSite` is a *browser* guarantee — a rewriting proxy or a non-conforming client
would drop it silently.

A request with no `Origin` header is allowed through. Browsers always send it on
cross-origin mutations, so its absence means the caller was not a page — curl, a
health check, a native client. Those hold no ambient cookie and therefore cannot
be CSRF victims.

### 4.18 `user_id` comes from the session, never from the request

Every wishlist query is scoped to `req.user.id`. Not a body field, not a query
parameter, not a header. A wishlist endpoint that accepts a user id from the
client lets anyone read and edit anyone else's list, and it is the single easiest
mistake to make in that file.

The test suite proves the isolation with two real accounts: B cannot see A's
list, B deleting a piece cannot touch A's row, and A's list survives the attempt.

### 4.19 The dev server proxies `/api` — that is what makes cookies work

`vite.config.js`. Routing `/api` through the Vite dev server makes the browser
treat API calls as same-origin, which solves three problems at once: no CORS
preflight, `SameSite=Lax` actually applies, and `Secure` can stay off for
`http://localhost` without the cookie being rejected as third-party.

Pointing the frontend straight at `:3001` means solving all three, and getting
the third one wrong in a way that only reproduces in Safari.

### 4.20 A backend is not done until the refusals are tested

`npm run test:api` runs 92 assertions against a real server on a throwaway
database. Roughly half of them assert that the wrong things are **impossible**:

- no response body anywhere contains `password_hash` or `scrypt$`
- login failures are byte-identical for unknown-email and wrong-password
- the two paths take comparable time
- a logged-out token cannot be replayed (the row is deleted, not just the cookie)
- a reset token cannot be used twice, and using it kills every existing session
- one user's wishlist is invisible and untouchable to another
- `/api/admin/users` is 401 anonymous, 403 as a customer
- a cross-origin POST is refused
- repeated failed logins eventually return 429 with `Retry-After`
- malformed JSON is a 400, an oversized body a 413 — never a 500

Two limiters are raised for the suite via `RATE_LIMIT_*` env vars, because it
makes more register and login calls in ten seconds than a visitor makes in a
month. `RATE_LIMIT_LOGIN_ACCOUNT` is deliberately left alone, since the
rate-limiting test depends on it actually firing.

---

## 5. Build roadmap

| Step | Scope | Status |
|---|---|---|
| 1 | Foundation: Vite, Tailwind tokens, Navbar, Preloader, section skeleton, 3D rig | **done** |
| 2 | Hero: GSAP ScrollTrigger camera timeline, text fade, handoff into the story | **done** |
| 3 | 3D scroll story: pinned canvas, camera path, piece rotation/scale, bg transition | next |
| 4 | Collections: pointer tilt + pinned horizontal rail (replaces the native rail) | |
| 5 | Bridal: clip-path image reveal, parallax, background transition | |
| 6 | Ring: scroll-controlled rotation, camera push, text reveal | |
| 7 | Heritage pattern draw + Showroom expanding image | |
| 8 | Final CTA exit choreography + footer | |
| 9 | Mobile pass: 320 / 375 / 390 / 430 / 768 — overflow and animation audit | |
| 10 | Performance: lazy loading audit, image compression, a11y, SEO | |

**Off-plan: accounts and a real backend — done.** Added at the client's request
mid-build, after the question "why is there no login?" was answered with "because
nothing was ever built to log in *to*". The site now has real registration, real
sessions, real password hashing and a server-side wishlist, verified by 92
end-to-end tests and a browser pass over register → save → reload → sign out →
sign in.

It does not disturb Steps 3-10: the showcase at `/` is untouched, the backend is
a separate process, and nothing in `src/sections/` imports anything from `src/auth/`.

What Step 1 deliberately does **not** include: pinned sections, the horizontal
hijack, the scroll camera timeline, and the clip-path image reveals. Every
section is laid out, styled, copy-complete and reveals on entry — the cinematic
scroll layer is what Steps 2-8 add.

**Carried into Step 9 — mobile framing of the hero piece.** Nothing is broken
(no overflow, no clipping at any width, verified at 320/375/390/430/768), but
the hero necklace is much smaller in frame on a phone than on desktop: roughly
**23% of the canvas width at 390px vs ~72% at 1440px**. The camera `fov` is
vertical, so a short wide canvas maps the piece to very few pixels. Fixing it
means either a taller mobile canvas or a mobile camera-distance scale — the
same kind of responsive adaptation `horizontalTravel` already does. Deferred to
Step 9, which is where mobile framing belongs.

**Note on the `r3f` chunk.** The build emits `<link rel="modulepreload">` for
the 1 MB `r3f` chunk even though nothing imports it statically. This is Rolldown
walking `__vite__mapDeps`, not a broken split — the entry chunk (14.5 kB gzip)
does not import three.js, so first paint and the preloader never wait on it.
It is left in place because the hero canvas is above the fold and mounts within
a frame of hydration, so the bytes are needed either way; preloading simply
starts the fetch earlier. Revisit in Step 10 if the hero canvas ever moves below
the fold or becomes conditional.

## 6. Conventions for the team

- **JavaScript only.** No TypeScript in this project, per the brief.
- **No emoji** anywhere — in code, comments, copy or commits.
- **No remote asset URLs.** All images ship from `public/images/`. No
  Unsplash, no picsum, no placeholder.com.
- **Never hardcode an image path.** Import from `src/data/images.js`.
- **Never mix GSAP and Framer Motion in the same component.** Framer owns UI
  enter/exit/layout; GSAP owns scroll choreography. `Navbar`, `Preloader` and
  `ScrollProgress` are Framer. `useScrollReveal` and every pinned timeline are
  GSAP.
- **Prefer Tailwind utilities over custom CSS.** If a rule is genuinely
  reusable, add it as `@utility` in `index.css`, not a new stylesheet.
- **Comment the *why*.** The existing comments explain decisions, not syntax.
  Match that standard.
- **Run `npm run build` before every commit.** It catches things the dev server
  does not (it is how the Rolldown `manualChunks` breakage was caught).
- **Never call `fetch` outside `src/lib/api.js`.** One client means one place
  that sets `credentials`, one error shape, and one base path to change.
- **Never accept a `user_id` from the request.** It comes from `req.user.id`.
  See 4.18 — this is the mistake that turns a wishlist into a data breach.
- **Never return a user row without `publicUser()`.** That function is the only
  reason a password hash cannot leak, and it works by having no field to opt into.
- **Run `npm run test:api` before committing anything in `server/`.** It takes
  ten seconds and it is the only thing standing between a refactor and an auth
  bypass.
- **A template literal containing SQL must not contain a backtick in its
  comments.** A stray `` `piece` `` in a SQL comment ends the string early and the
  file fails with a misleading "missing ) after argument list". Cost an hour
  once; `db.js` carries a warning comment about it now.

## 7. Accessibility

- Every animation respects `prefers-reduced-motion` — and reduced motion means
  *no animation*, not faster animation.
- Focus rings use `outline`, never `box-shadow`, so they survive on any
  background.
- There is a skip link to `#main`.
- Decorative SVG, particles and gold lines carry `aria-hidden="true"`.
- The mobile menu closes on `Escape` and restores focus to its toggle.
- The preloader announces itself with `role="status"`.
- Every form field is built from `components/auth/Field.jsx`, which supplies a
  `<label for>`, a stable id, `aria-invalid` when wrong, and `aria-describedby`
  pointing at the message. Written once, so it cannot be forgotten in one of five
  forms.
- Form-level failures use `role="alert"` so they announce themselves — the user's
  eyes are on the button they just pressed, not on the top of the form.
- Submit buttons expose `aria-busy` and disable while in flight.
- The save toggle reports `aria-pressed` and changes its visible label, because
  the state is otherwise conveyed only by a filled heart.
- `RequireAuth` and `RedirectIfAuthenticated` wait for the session check before
  deciding, so a signed-in visitor refreshing `/account` never sees a login page
  flash past.

## 8. Content that still needs to come from the client

1. Photography — `public/images/` (see the README there).
2. 3D models — `public/models/` (see the README there).
3. Phone, street address, opening hours, map link, social handles.

### Before the site goes live

These are not optional, and each one is a switch that is currently set for
development:

1. **`SMTP_URL` in `.env`.** Until it is set, password-reset links are printed to
   the API console *and returned in the response body* outside production. That
   last part is a testing convenience and must never ship: it would let anyone
   reset anyone's password. Setting `SMTP_URL` and running with
   `NODE_ENV=production` closes it.
2. **HTTPS.** The session cookie sets `Secure` automatically when
   `NODE_ENV=production`. Serving that over plain HTTP means the browser silently
   drops the cookie and nobody can stay signed in.
3. **`TRUST_PROXY=1` if — and only if — something sits in front of the server.**
   Without it behind a proxy, every visitor shares one rate-limit bucket. With it
   and no proxy, a client can forge `X-Forwarded-For` and mint unlimited buckets.
4. **An admin account**, via `npm run create-admin`.
5. **A decision about what accounts are actually for.** Today an account does two
   things: it remembers which of the four piece families you like, and it proves
   the auth works. That is honest but thin. The obvious next candidates are
   showroom appointment booking and per-piece enquiry — both need the client's
   real opening hours before they can be built, and neither should be invented.

### A note on the wishlist's size

The catalogue holds four pieces — necklace, ring, bangle, earrings — because
those are the four the client supplied. So the wishlist holds at most four items,
and the UI says "saved pieces" rather than pretending to be a shop. When
individual SKUs exist, `src/data/models.js` gains keys, `src/data/pieces.js`
gains labels, and the server validates against them automatically: `server/lib/pieces.js`
imports the registry rather than restating it, so the two cannot drift.
