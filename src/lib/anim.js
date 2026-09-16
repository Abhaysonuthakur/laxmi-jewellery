/**
 * Shared animation primitives.
 *
 * Everything here animates transform / opacity / filter / clip-path only.
 * Layout properties (width, height, top, left, margin) are never animated —
 * they force layout on every frame and are the usual cause of "why is this
 * site janky on my laptop".
 */

export const EASE = {
  silk: 'cubic-bezier(0.16, 1, 0.3, 1)',
  swift: 'cubic-bezier(0.7, 0, 0.84, 0)',
  elastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

export const GSAP_EASE = {
  silk: 'power3.out',
  cinematic: 'power4.inOut',
  soft: 'power2.out',
}

/** Shared spring presets — keeps motion language consistent across the site. */
export const SPRING = {
  snappy: { stiffness: 300, damping: 30 },
  smooth: { stiffness: 150, damping: 20 },
  heavy: { stiffness: 60, damping: 20 },
}

/**
 * Standard scroll-reveal: opacity + translateY + a short blur-to-sharp pass.
 * Applied with `gsap.from`, so the resting state in the DOM is always the
 * visible one — the page is readable even if JS fails to load.
 */
export function revealFrom(target, options = {}) {
  const {
    y = 34,
    blur = 6,
    duration = 1.05,
    delay = 0,
    stagger = 0.09,
    ease = GSAP_EASE.silk,
  } = options

  return {
    autoAlpha: 0,
    y,
    filter: `blur(${blur}px)`,
    duration,
    delay,
    stagger,
    ease,
  }
}

/** Cubic ease-out used for the per-frame lerp in 3D scenes. */
export function damp(current, target, lambda, delta) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta))
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Maps a 0→1 progress value onto a linear range. */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / (inMax - inMin || 1), 0, 1)
  return outMin + t * (outMax - outMin)
}

/** Hermite smoothstep — zero velocity at both ends, which reads as "engineered". */
function smoothstep(x) {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Samples a keyframe track at position `t` (0 → 1).
 *
 *   sampleKeyframes([{ at: 0, value: [0, 0, 6] }, { at: 1, value: [0, 0, 4] }], 0.5)
 *   // → [0, 0, 5]
 *
 * Values may be numbers or equal-length arrays of numbers, so the same helper
 * drives camera positions, scales and spin without three near-identical
 * functions.
 *
 * Interpolation is smoothstepped *between* keyframes rather than linear, and
 * each segment is eased independently. That matters for a camera path: linear
 * interpolation produces a visible direction change at every keyframe, which
 * reads as mechanical. Easing each segment gives the camera a settle-and-leave
 * quality instead.
 *
 * Returns a fresh array for array values, so callers can never accidentally
 * mutate a keyframe track.
 */
export function sampleKeyframes(frames, t) {
  const p = clamp(t, 0, 1)
  const first = frames[0]
  const last = frames[frames.length - 1]

  const interpolate = (a, b, k) =>
    Array.isArray(a) ? a.map((value, index) => value + (b[index] - value) * k) : a + (b - a) * k

  if (p <= first.at) return Array.isArray(first.value) ? first.value.slice() : first.value
  if (p >= last.at) return Array.isArray(last.value) ? last.value.slice() : last.value

  for (let index = 0; index < frames.length - 1; index += 1) {
    const a = frames[index]
    const b = frames[index + 1]

    if (p <= b.at) {
      const span = b.at - a.at || 1
      return interpolate(a.value, b.value, smoothstep((p - a.at) / span))
    }
  }

  return Array.isArray(last.value) ? last.value.slice() : last.value
}
