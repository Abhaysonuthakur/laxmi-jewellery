import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

/**
 * A 1px gold line on the right edge of the viewport.
 *
 * Driven by a motion value straight to the transform — no React state, no
 * re-render per frame. The spring softens Lenis' already-smooth position so the
 * line glides rather than twitches.
 *
 * Desktop only. On a phone it would sit under the thumb and earn nothing.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })
  const scaleY = useTransform(smooth, [0, 1], [0, 1])
  const percent = useTransform(smooth, (value) => `${Math.round(value * 100)}`)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      <span className="text-[0.5rem] tracking-[0.3em] text-faint tabular-nums">
        <motion.span>{percent}</motion.span>
      </span>

      <span className="relative block h-[34vh] w-px bg-[color-mix(in_srgb,var(--color-gold)_20%,transparent)]">
        <motion.span
          style={{ scaleY }}
          className="absolute inset-x-0 top-0 block h-full origin-top bg-[linear-gradient(180deg,var(--color-gold),var(--color-gold-light))]"
        />
      </span>

      <span className="eyebrow text-[0.45rem] text-faint">SCROLL</span>
    </div>
  )
}

export default ScrollProgress
