import { useEffect } from 'react'
import { gsap, registerGsap } from '../lib/gsap'
import { CHANNELS, channel } from '../lib/scroll-channels'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * The story section's scroll timeline.
 *
 * Same split as the hero, for the same reason: one tween publishes a number for
 * the 3D layer, and a separate timeline moves the DOM. The 3D work must never be
 * a list of CSS tweens on the canvas wrapper — that would slide a picture
 * around rather than move a camera.
 *
 * ---------------------------------------------------------------------------
 * POSITIONS ARE FRACTIONS OF THE SCROLL RANGE
 * ---------------------------------------------------------------------------
 * Every position below is expressed against a timeline pinned to a total
 * duration of exactly 1, so `0.44` means "44% of the way through this section's
 * scroll", independent of how tall the section happens to be. That makes the
 * section's height (`h-[300vh]`) a purely presentational decision — the
 * choreography does not have to be re-tuned if it changes.
 *
 * The pin is the `timeline.set({}, {}, 1)` at the end. Without it the total
 * duration is whatever the last-ending tween happens to be, and a missing
 * optional layer (say the wash) would silently rescale every other position.
 *
 * ---------------------------------------------------------------------------
 * THE BEAT SCHEDULE
 * ---------------------------------------------------------------------------
 *   0.00 - 0.14   opening heading, leaving
 *   0.16 - 0.28   "at the bench" in
 *   0.44 - 0.52   "at the bench" out
 *   0.60 - 0.72   "gold remembers" in, and it stays
 *
 * The gaps are deliberate. Copy and the piece handoff are never in flight at
 * the same moment: 0.44-0.52 empties the left column, 0.50-0.66 moves the
 * pieces, and the next block arrives at 0.60 already clear of it. Two things
 * moving at once reads as noise; a sequence of one-thing-at-a-time reads as
 * direction.
 *
 * ---------------------------------------------------------------------------
 * REDUCED MOTION
 * ---------------------------------------------------------------------------
 * This hook is only ever mounted by the pinned render path, which the section
 * does not choose when the visitor prefers reduced motion. It still guards
 * itself, because a hook that only works when its caller remembers to check is
 * a hook waiting to be misused.
 */
export function useStoryScroll({ sectionRef, depthRef, washRef, enabled = true }) {
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
        // Slightly heavier than the hero's 0.65: this section is a series of
        // held shots, and a looser catch-up lets each one settle before the
        // next begins.
        scrub: 0.8,
      }

      /* ---- 1. Drive the 3D layer ------------------------------------- */
      gsap.to(channel(CHANNELS.story), {
        progress: 1,
        ease: 'none',
        scrollTrigger: { ...scrollTrigger },
      })

      /* ---- 2. Drive the DOM ------------------------------------------ */
      const beats = gsap.utils.toArray('[data-story-beat]', section)
      const timeline = gsap.timeline({ scrollTrigger: { ...scrollTrigger } })

      const exit = { autoAlpha: 0, y: -38, filter: 'blur(8px)', ease: 'none' }
      const enterFrom = { autoAlpha: 0, y: 44, filter: 'blur(10px)' }
      const enterTo = { autoAlpha: 1, y: 0, filter: 'blur(0px)', ease: 'none' }

      // Beat 0 — the opening heading. Present at rest, so it only ever leaves.
      if (beats[0]) {
        timeline.to(beats[0], { ...exit, duration: 0.1 }, 0.02)
      }

      // Beat 1 — the bench. In, hold, out.
      if (beats[1]) {
        timeline.fromTo(beats[1], enterFrom, { ...enterTo, duration: 0.12 }, 0.16)
        timeline.to(beats[1], { ...exit, duration: 0.08 }, 0.44)
      }

      // Beat 2 — the second piece. In, and stays for the wash.
      if (beats[2]) {
        timeline.fromTo(beats[2], enterFrom, { ...enterTo, duration: 0.12 }, 0.6)
      }

      /*
       * The light dims for the inspection and comes back up for the handoff.
       * This is what makes the middle of the section feel like a different
       * room rather than more of the same page.
       */
      if (depthRef?.current) {
        timeline.fromTo(depthRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'none' }, 0.18)
        timeline.to(depthRef.current, { autoAlpha: 0, duration: 0.16, ease: 'none' }, 0.64)
      }

      /*
       * Ivory wash over the tail. The next section (BrandStatement) is ivory, so
       * the boundary between two sections disappears — the same handoff the
       * hero uses into this section's champagne.
       */
      if (washRef?.current) {
        timeline.fromTo(washRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: 'none' }, 0.86)
      }

      // Pin the duration to 1. See the note above — this is what makes every
      // position in this timeline a fraction of the scroll range.
      timeline.set({}, {}, 1)
    }, section)

    return () => context.revert()
  }, [reducedMotion, enabled, sectionRef, depthRef, washRef])
}

export default useStoryScroll
