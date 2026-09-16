/**
 * Scroll progress channels — the bridge between the DOM and WebGL layers.
 *
 * The problem this solves: GSAP ScrollTrigger needs real DOM elements to
 * measure, but the camera and the jewellery live inside the R3F canvas, which
 * is in a separate lazy chunk. Neither layer should import the other.
 *
 * So the DOM layer writes a plain number into a shared object and the 3D layer
 * reads it inside `useFrame`. That is the whole contract.
 *
 * Why a mutable object and not React state:
 *
 *   `useFrame` runs 60 times a second. If scroll progress lived in `useState`,
 *   every frame would schedule a React render of the entire section tree —
 *   the single most common way to turn a smooth 3D site into a janky one.
 *   A mutable singleton costs nothing to read and nothing to write.
 *
 * GSAP can tween these directly, which is what makes the wiring so short:
 *
 *   gsap.to(channel(CHANNELS.hero), {
 *     progress: 1,
 *     ease: 'none',
 *     scrollTrigger: { trigger, start: 'top top', end: 'bottom bottom', scrub: 0.65 },
 *   })
 *
 * `scrub` is what makes it scroll-linked rather than time-based: GSAP drives
 * `progress` from the scroll position, with a short catch-up so the motion
 * feels weighted instead of rigidly pinned to the wheel.
 */

const registry = new Map()

/** Channel names, so a typo is a missing export rather than a silent no-op. */
export const CHANNELS = {
  hero: 'hero',
  story: 'story',
  ring: 'ring',
  final: 'final',
}

/**
 * Returns the mutable channel object for `name`, creating it on first use.
 * The same object identity is returned every time, which is what lets both
 * layers hold a reference for the lifetime of the page.
 */
export function channel(name) {
  let entry = registry.get(name)

  if (!entry) {
    entry = { progress: 0 }
    registry.set(name, entry)
  }

  return entry
}

/** Used by tests and by the dev tools panel. */
export function readProgress(name) {
  return channel(name).progress
}

/** Resets every channel to its resting state. */
export function resetChannels() {
  registry.forEach((entry) => {
    entry.progress = 0
  })
}
