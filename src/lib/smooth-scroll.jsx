import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, registerGsap } from './gsap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

/**
 * Lenis + GSAP ScrollTrigger, wired correctly.
 *
 * The three details that matter:
 *  1. `lenis.on('scroll', ScrollTrigger.update)` — ScrollTrigger must be told
 *     about Lenis' virtual scroll position, otherwise pins drift.
 *  2. `gsap.ticker` drives Lenis' RAF loop, so both run on one clock. Lenis
 *     expects milliseconds; the ticker hands us seconds — hence `* 1000`.
 *  3. `autoRaf: false` on the Lenis instance, or you get two competing loops
 *     and jittery scrolling on high-refresh displays.
 *
 * Reduced-motion visitors get native scrolling and no Lenis at all.
 */
const SmoothScrollContext = createContext(null)

export function SmoothScrollProvider({ children }) {
  const reducedMotion = usePrefersReducedMotion()
  const [lenis, setLenis] = useState(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    registerGsap()

    if (reducedMotion) {
      ScrollTrigger.refresh()
      return undefined
    }

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
      autoRaf: false,
    })

    instanceRef.current = instance
    setLenis(instance)

    const onScroll = () => ScrollTrigger.update()
    instance.on('scroll', onScroll)

    const raf = (time) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // Web fonts land after first paint and shift every section height.
    // Re-measure once they are in so no trigger is left pointing at stale pixels.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
    }

    return () => {
      instance.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      instance.destroy()
      instanceRef.current = null
      setLenis(null)
    }
  }, [reducedMotion])

  return <SmoothScrollContext.Provider value={lenis}>{children}</SmoothScrollContext.Provider>
}

/** Returns the live Lenis instance, or `null` when smooth scroll is disabled. */
export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}

/**
 * Locks page scrolling while the preloader is on screen, then hands control
 * back and re-measures ScrollTrigger.
 */
export function useScrollLock(locked) {
  const lenis = useSmoothScroll()

  useEffect(() => {
    const html = document.documentElement

    if (locked) {
      lenis?.stop()
      html.classList.add('lenis-stopped')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      html.classList.remove('lenis-stopped')
      lenis?.start()
      lenis?.scrollTo(0, { immediate: true })
      ScrollTrigger.refresh()
    }

    /*
     * Release the lock on unmount.
     *
     * Without this, navigating away from the page that holds the lock while it
     * is still engaged leaves `body { overflow: hidden }` behind for the rest of
     * the session — and the next route renders unscrollable, with nothing in the
     * console to explain why. Cleanup also runs before every re-run, which is
     * harmless because the effect immediately re-applies the correct state.
     */
    return () => {
      document.body.style.overflow = ''
      html.classList.remove('lenis-stopped')
      // A stopped Lenis outlives this component otherwise, and the next route
      // renders unscrollable with nothing in the console to explain it.
      lenis?.start()
    }
  }, [locked, lenis])
}
