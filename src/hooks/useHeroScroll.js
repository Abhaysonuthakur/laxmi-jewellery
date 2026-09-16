import { useEffect } from 'react'
import { gsap, registerGsap } from '../lib/gsap'
import { CHANNELS, channel } from '../lib/scroll-channels'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * The hero's scroll timeline.
 *
 * Two things happen off one ScrollTrigger, and they are deliberately separate:
 *
 *   1. A tween on the `hero` scroll channel. This is the only thing the 3D
 *      layer sees — a single number from 0 to 1. The camera path, the piece's
 *      rotation, scale, lift and fade are all sampled from it inside
 *      `useFrame`.
 *
 *   2. A DOM timeline. The copy exits, the scroll cue goes, and a champagne
 *      wash fades in over the tail so the hero hands off to the story section
 *      (which is already champagne) with no visible seam.
 *
 * Why the two are not one timeline: the 3D work must not be a list of CSS
 * property tweens on a wrapper element. If the canvas were just transformed by
 * GSAP, the camera would not move — you would be sliding a picture around.
 * Publishing a number and letting the 3D layer interpret it is what makes the
 * camera actually orbit the piece.
 *
 * Scroll range: `top top` → `bottom bottom` on a section that is ~2 viewports
 * tall with a 1-viewport sticky stage. That gives exactly one viewport height
 * of scroll for the whole sequence — long enough to read, short enough that a
 * visitor does not feel trapped.
 *
 * Reduced motion: the effect returns early and nothing is created. The DOM's
 * resting state is already the "progress 0" state, so the hero is fully
 * readable and completely static.
 *
 * ---------------------------------------------------------------------------
 * WHY THE COPY IS TARGETED BY DATA ATTRIBUTE, NOT BY REF
 * ---------------------------------------------------------------------------
 * The first version of this hook took a `copyRefs` array. That is a trap: the
 * caller writes `const copyRefs = [a, b]` inline, which is a brand-new array
 * on every render, so the dependency array below never compares equal and the
 * effect tears down and rebuilds the ScrollTrigger on every single render —
 * silently, and expensively.
 *
 * Selecting `[data-hero-exit]` inside the section instead means the effect's
 * dependencies are all refs and primitives, which are genuinely stable. It
 * also matches how `useScrollReveal` finds its `[data-reveal]` targets, so
 * there is one convention for "the DOM marks what it wants animated".
 */
export function useHeroScroll({ sectionRef, washRef, cueRef, enabled = true }) {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    registerGsap()

    if (reducedMotion || !enabled) return undefined

    const context = gsap.context(() => {
      const scrollTrigger = {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        // A short catch-up so the motion has weight. `true` would be rigidly
        // locked to the wheel and read as cheap.
        scrub: 0.65,
      }

      /* ---- 1. Drive the 3D layer ------------------------------------- */
      gsap.to(channel(CHANNELS.hero), {
        progress: 1,
        ease: 'none',
        scrollTrigger: { ...scrollTrigger },
      })

      /* ---- 2. Drive the DOM ------------------------------------------ */
      const copy = section.querySelectorAll('[data-hero-exit]')

      const timeline = gsap.timeline({ scrollTrigger: { ...scrollTrigger } })

      // The scroll cue is the first thing to go — it has done its job by the
      // time the visitor has moved at all.
      if (cueRef?.current) {
        timeline.to(cueRef.current, { autoAlpha: 0, duration: 0.08, ease: 'none' }, 0)
      }

      // Copy exits early, leaving the piece alone on screen for the orbit.
      // `autoAlpha` rather than `opacity` so the CTA also stops being
      // focusable once it is invisible — a keyboard user must not be able to
      // tab into a button they cannot see.
      if (copy.length) {
        timeline.to(
          copy,
          {
            autoAlpha: 0,
            y: -54,
            filter: 'blur(9px)',
            duration: 0.34,
            stagger: 0.035,
            ease: 'none',
          },
          0,
        )
      }

      // Champagne wash over the tail. The story section that follows is the
      // same colour, so the section boundary disappears.
      if (washRef?.current) {
        timeline.fromTo(
          washRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.5, ease: 'none' },
          0.5,
        )
      }
    }, section)

    return () => context.revert()
  }, [reducedMotion, enabled, sectionRef, washRef, cueRef])
}

export default useHeroScroll
