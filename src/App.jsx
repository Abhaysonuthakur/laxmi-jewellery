import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SmoothScrollProvider, useScrollLock, useSmoothScroll } from './lib/smooth-scroll'
import Navbar from './components/layout/Navbar'
import Preloader from './components/layout/Preloader'
import ScrollProgress from './components/layout/ScrollProgress'
import Footer from './components/layout/Footer'
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './auth/guards'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Account from './pages/Account'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import {
  Hero,
  ScrollStory,
  BrandStatement,
  Collection,
  HorizontalShowcase,
  Bridal,
  RingSection,
  Heritage,
  Showroom,
  FinalCta,
} from './sections'

/**
 * Page composition.
 *
 * The order of <main> is the order of the experience, and it is deliberately
 * the only place that order is expressed. Each section owns its own
 * ScrollTriggers; nothing here needs to know about them.
 *
 * The preloader gates the hero's entrance rather than the other way round:
 * `onReveal` fires as the curtain starts to part, so the hero is already
 * animating in behind it and the two read as one continuous move.
 */
function Site() {
  const [revealed, setRevealed] = useState(false)
  const [preloaderDone, setPreloaderDone] = useState(false)

  // Page is not scrollable until the curtain opens.
  useScrollLock(!revealed)

  const handleReveal = useCallback(() => setRevealed(true), [])
  const handleDone = useCallback(() => setPreloaderDone(true), [])

  /**
   * Failsafe.
   *
   * The hero's visibility depends on a signal from the preloader, which is a
   * second component with its own timers. If that handshake is ever
   * interrupted — a hot reload mid-sequence, a throttled background tab, a
   * thrown error inside the preloader — the hero would sit at `opacity: 0`
   * forever and the site would look broken with nothing in the console.
   *
   * A timed fallback makes "hero never appears" structurally impossible. The
   * delay sits just past the preloader's 1.25s reveal, so in the normal path
   * it never fires.
   */
  useEffect(() => {
    const failsafe = window.setTimeout(() => setRevealed(true), 2600)
    return () => window.clearTimeout(failsafe)
  }, [])

  return (
    <>
      {!preloaderDone && <Preloader onReveal={handleReveal} onDone={handleDone} />}

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Navbar />
      <ScrollProgress />

      <main id="main">
        <Hero ready={revealed} />
        <ScrollStory />
        <BrandStatement />
        <Collection />
        <HorizontalShowcase />
        <Bridal />
        <RingSection />
        <Heritage />
        <Showroom />
        <FinalCta />
      </main>

      <Footer />
    </>
  )
}

/**
 * Reset scroll on navigation.
 *
 * The browser restores the previous scroll position on a client-side route
 * change, so arriving at /login from halfway down the home page would land you
 * halfway down the login form. With Lenis driving the scroll, `window.scrollTo`
 * alone is not enough — the virtual scroll position has to be moved too.
 */
function RouteScrollReset() {
  const { pathname } = useLocation()
  const lenis = useSmoothScroll()

  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname, lenis])

  return null
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <RouteScrollReset />

      <Routes>
        <Route path="/" element={<Site />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthenticated>
              <Register />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectIfAuthenticated>
              <ForgotPassword />
            </RedirectIfAuthenticated>
          }
        />

        {/*
          Not wrapped in RedirectIfAuthenticated: a reset link opened in a
          browser that still holds a session must keep working, and bouncing the
          visitor to their account would strand them with a link they cannot use.
        */}
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </SmoothScrollProvider>
  )
}
