import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion'
import { BRAND, NAV_LINKS, SECTION_IDS } from '../../data/site'
import { EASE } from '../../lib/anim'
import { useSmoothScroll } from '../../lib/smooth-scroll'
import { useAuth } from '../../auth/AuthProvider'
import { useWishlist } from '../../auth/WishlistProvider'

/* --- Icons (hand-rolled, 1px stroke, no icon dependency) ----------------- */

function HeartIcon({ filled = false }) {
  return (
    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" aria-hidden="true">
      <path
        d="M8.5 14.2 2.4 8.35A3.55 3.55 0 0 1 8.5 4.1a3.55 3.55 0 0 1 6.1 4.25L8.5 14.2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <span className="relative block h-[9px] w-[19px]" aria-hidden="true">
      <motion.span
        className="absolute left-0 block h-px w-full bg-current"
        animate={{ top: open ? 4 : 0, rotate: open ? 45 : 0 }}
        transition={{ duration: 0.4, ease: EASE.silk }}
      />
      <motion.span
        className="absolute left-0 block h-px w-full bg-current"
        animate={{ top: open ? 4 : 8, rotate: open ? -45 : 0 }}
        transition={{ duration: 0.4, ease: EASE.silk }}
      />
    </span>
  )
}

/* --- Component ----------------------------------------------------------- */

export function Navbar() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const lenis = useSmoothScroll()
  const reduced = useReducedMotion()
  const panelRef = useRef(null)
  const toggleRef = useRef(null)

  /*
   * The heart used to be local `useState` — a toggle that meant nothing and
   * forgot itself on reload. It now reflects the server's list, so the count
   * here and the grid on /account are the same number by construction.
   */
  const { isAuthenticated, user } = useAuth()
  const wishlist = useWishlist()

  // Threshold-crossing only — never a setState per scroll frame.
  useMotionValueEvent(scrollY, 'change', (value) => {
    const nextSolid = value > 28
    setSolid((prev) => (prev === nextSolid ? prev : nextSolid))

    if (open) return
    const goingDown = value > lastY.current && value > 220
    setHidden((prev) => (prev === goingDown ? prev : goingDown))
    lastY.current = value
  })

  // Lock the page behind the mobile menu, and restore focus on close.
  useEffect(() => {
    if (open) {
      lenis?.stop()
      document.body.style.overflow = 'hidden'
      panelRef.current?.querySelector('a')?.focus()
    } else {
      document.body.style.overflow = ''
      lenis?.start()
    }
    return () => {
      document.body.style.overflow = ''
      /*
       * Restore Lenis too. Following a link out of this overlay unmounts the
       * navbar while it is still stopped, and a stopped Lenis on the next route
       * means a page that renders perfectly and refuses to scroll.
       */
      lenis?.start()
    }
  }, [open, lenis])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const goTo = (event, href) => {
    event.preventDefault()
    const id = href.replace('#', '')
    setOpen(false)

    const target = document.getElementById(id)
    if (!target) return

    if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.2 })
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE.silk }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-silk ${
            solid
              ? 'frosted border-[color-mix(in_srgb,var(--color-gold)_22%,transparent)]'
              : 'border-transparent bg-transparent'
          }`}
        >
          <nav
            aria-label="Primary"
            className="shell flex h-[4.5rem] items-center justify-between gap-6 md:h-[5.25rem]"
          >
            {/* Wordmark */}
            <a
              href="#home"
              onClick={(event) => goTo(event, '#home')}
              className="group flex items-center gap-3"
            >
              <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)]">
                <span className="font-display text-[1.05rem] leading-none text-ink">L</span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-[0.95rem] tracking-[0.28em] text-ink md:text-[1.05rem]">
                  {BRAND.nameParts[0]}
                </span>
                <span className="mt-1 text-[0.48rem] tracking-[0.42em] text-muted uppercase">
                  {BRAND.nameParts[1]}
                </span>
              </span>
            </a>

            {/* Desktop links */}
            <ul className="hidden items-center gap-9 lg:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(event) => goTo(event, link.href)}
                    className="group relative block py-2 text-[0.66rem] tracking-[0.26em] text-muted uppercase transition-colors duration-400 hover:text-ink"
                  >
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-silk group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-5 md:gap-7">
              {/*
                A link, not a button. It used to toggle a boolean that existed
                only in this component's memory; now it reports the real saved
                count and goes where that list lives.
              */}
              <Link
                to="/account"
                aria-label={
                  wishlist.count > 0
                    ? `Your saved pieces: ${wishlist.count}`
                    : 'Your saved pieces'
                }
                className="relative hidden text-muted transition-colors duration-400 hover:text-gold-deep md:block"
              >
                <HeartIcon filled={wishlist.count > 0} />

                {wishlist.count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.54rem] leading-none text-cream tabular-nums"
                  >
                    {wishlist.count}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/account"
                  aria-label={`Your account${user?.displayName ? `, ${user.displayName}` : ''}`}
                  className="hidden md:block"
                >
                  <span className="font-display grid h-8 w-8 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_50%,transparent)] text-[0.85rem] leading-none text-ink transition-colors duration-500 hover:border-gold">
                    {(user?.displayName?.trim()?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase()}
                  </span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="hidden text-[0.62rem] tracking-[0.28em] text-ink uppercase transition-colors duration-400 hover:text-gold-deep md:block"
                >
                  Sign in
                </Link>
              )}

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-controls="site-menu"
                className="flex items-center gap-3 text-[0.62rem] tracking-[0.28em] text-ink uppercase"
              >
                <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
                <MenuIcon open={open} />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile / overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            ref={panelRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE.silk }}
            className="fixed inset-0 z-40 bg-ivory"
          >
            <div className="shell flex h-full flex-col justify-center pt-[4.5rem] pb-16">
              <p className="eyebrow mb-8 text-gold-deep">Navigate</p>

              <ul className="flex flex-col">
                {NAV_LINKS.map((link, index) => (
                  <li key={link.href} className="overflow-hidden border-b border-line">
                    <motion.a
                      href={link.href}
                      onClick={(event) => goTo(event, link.href)}
                      initial={{ y: '110%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '110%', opacity: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.06 + index * 0.055,
                        ease: EASE.silk,
                      }}
                      className="font-display block py-5 text-[clamp(1.9rem,9vw,3.4rem)] leading-none font-light text-ink"
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-12 flex flex-col gap-2"
              >
                <span className="eyebrow text-[0.55rem] text-gold-deep">{BRAND.location}</span>
                <a
                  href={`#${SECTION_IDS.contact}`}
                  onClick={(event) => goTo(event, `#${SECTION_IDS.contact}`)}
                  className="text-[0.8rem] tracking-[0.16em] text-muted uppercase"
                >
                  Contact
                </a>

                {/*
                  The only entries in this panel that leave the home page. The
                  rest are anchors, so these are visually distinguished rather
                  than blended into a list where four items scroll and two
                  navigate.
                */}
                <Link
                  to={isAuthenticated ? '/account' : '/login'}
                  onClick={() => setOpen(false)}
                  className="text-[0.8rem] tracking-[0.16em] text-ink uppercase transition-colors duration-400 hover:text-gold-deep"
                >
                  {isAuthenticated ? 'Your account' : 'Sign in'}
                </Link>

                {!isAuthenticated && (
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="text-[0.8rem] tracking-[0.16em] text-muted uppercase transition-colors duration-400 hover:text-ink"
                  >
                    Create account
                  </Link>
                )}

                {isAuthenticated && wishlist.count > 0 && (
                  <span className="mt-1 text-[0.7rem] tracking-[0.16em] text-gold-deep uppercase">
                    {wishlist.count} piece{wishlist.count === 1 ? '' : 's'} saved
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
