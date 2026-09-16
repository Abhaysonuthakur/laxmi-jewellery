import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Single registration point for GSAP plugins.
 *
 * Registering a plugin twice throws, and importing `gsap` from a dozen files
 * makes that easy to get wrong — so every module imports from here instead.
 */
let registered = false

export function registerGsap() {
  if (registered || typeof window === 'undefined') return

  gsap.registerPlugin(ScrollTrigger)

  gsap.defaults({ ease: 'power3.out', duration: 1 })

  ScrollTrigger.config({
    // Mobile browsers fire resize when the URL bar collapses. Without this the
    // whole scroll timeline re-measures mid-scroll and visibly jumps.
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  })

  registered = true
}

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export { gsap, ScrollTrigger }
