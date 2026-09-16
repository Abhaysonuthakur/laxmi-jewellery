import { useEffect, useRef } from 'react'
import { gsap, registerGsap } from '../lib/gsap'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * The site's default entrance animation, wrapped in a hook.
 *
 * Any element inside the returned ref that carries `data-reveal` animates once,
 * when its section crosses 82% of the viewport height. Animation is
 * `gsap.from`, so the resting DOM state is the *visible* one — if JavaScript
 * fails, the page still reads.
 *
 * Why `gsap.context` rather than a bare `gsap.from`:
 *   - selectors are scoped to the section, so `[data-reveal]` in one section
 *     can never accidentally target another,
 *   - and `ctx.revert()` kills every tween *and* its ScrollTrigger on unmount.
 *     Forgetting that cleanup is how scroll sites end up with orphaned
 *     triggers that fire against detached nodes.
 *
 * Reduced-motion visitors skip the tween entirely and get the final state.
 */
export function useScrollReveal({
  y = 34,
  blur = 6,
  stagger = 0.09,
  duration = 1.05,
  start = 'top 82%',
  delay = 0,
  selector = '[data-reveal]',
} = {}) {
  const scope = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const element = scope.current
    if (!element) return undefined

    registerGsap()
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray(selector, element)
      if (!targets.length) return

      gsap.from(targets, {
        autoAlpha: 0,
        y,
        filter: `blur(${blur}px)`,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        clearProps: 'filter',
        scrollTrigger: {
          trigger: element,
          start,
          once: true,
          toggleActions: 'play none none none',
        },
      })
    }, element)

    return () => ctx.revert()
  }, [reduced, y, blur, stagger, duration, start, delay, selector])

  return scope
}

export default useScrollReveal
