/**
 * Chrome for the account pages.
 *
 * Deliberately not the site Navbar: its links are `#section` anchors that only
 * resolve on the home route, so on /login every one of them would be a dead
 * link. These pages get their own minimal header instead — a wordmark that goes
 * home, and nothing that can lie about where it leads.
 *
 * `AuthHeader` and `AuthBackdrop` are exported separately so wider pages
 * (account, admin) can build their own body while keeping identical chrome.
 * Duplicating a header is how two pages end up with wordmarks that are 2px
 * apart.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BRAND } from '../../data/site'
import { EASE } from '../../lib/anim'

export function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label={`${BRAND.name} — home`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)] transition-colors duration-500 group-hover:border-gold">
        <span className="font-display text-[1.05rem] leading-none text-ink">L</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] tracking-[0.28em] text-ink md:text-[1.05rem]">
          {BRAND.nameParts[0]}
        </span>
        <span className="mt-1 text-[0.48rem] tracking-[0.42em] text-muted uppercase">{BRAND.nameParts[1]}</span>
      </span>
    </Link>
  )
}

export function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[46vh]"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--color-champagne) 62%, transparent) 0%, transparent 68%)',
      }}
    />
  )
}

export function AuthHeader() {
  return (
    <header className="relative z-10">
      <div className="shell flex h-[4.5rem] items-center justify-between md:h-[5.25rem]">
        <Wordmark />
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-[0.62rem] tracking-[0.26em] text-muted uppercase transition-colors duration-400 hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-500 ease-silk group-hover:-translate-x-1"
          >
            ←
          </span>
          Back to site
        </Link>
      </div>
    </header>
  )
}

export function AuthLayout({ eyebrow, title, intro, children, footer, aside }) {
  const reduced = useReducedMotion()

  const rise = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
      }

  return (
    <div className="relative min-h-dvh bg-ivory">
      {/* A single warm wash so the page is not a flat rectangle. */}
      <AuthBackdrop />
      <AuthHeader />

      <main className="relative z-10 pb-24">
        <div className="shell">
          <div className="mx-auto w-full max-w-[30rem] pt-6 md:pt-12">
            <motion.div
              {...rise}
              transition={{ duration: 0.75, ease: EASE.silk }}
              className="border border-line bg-cream/80 px-6 py-9 backdrop-blur-[2px] sm:px-10 sm:py-11"
              style={{ borderRadius: 'var(--radius-facet)' }}
            >
              {eyebrow && <p className="eyebrow text-[0.6rem] text-gold-deep">{eyebrow}</p>}

              <h1 className="font-display mt-4 text-[clamp(1.75rem,5.2vw,2.5rem)] leading-[1.05] font-light text-ink">
                {title}
              </h1>

              {intro && <p className="mt-3 text-[0.9rem] leading-relaxed text-muted">{intro}</p>}

              <div className="gold-rule mt-7 mb-7 opacity-60" />

              {children}
            </motion.div>

            {aside && <div className="mt-6">{aside}</div>}

            {footer && (
              <motion.div
                {...rise}
                transition={{ duration: 0.75, delay: 0.08, ease: EASE.silk }}
                className="mt-7 text-center text-[0.86rem] text-muted"
              >
                {footer}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
