import { useCallback, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { SPRING } from '../../lib/anim'

/**
 * A button that leans toward the cursor, then settles back on exit.
 *
 * Built on motion values rather than state: the offset is written straight to
 * the transform on every pointermove with no React render in between. The
 * spring adds weight so it reads as "expensive" rather than "sticky".
 *
 * Strength is deliberately low (0.28) — a magnetic effect you notice is a
 * magnetic effect that is too strong.
 */
export function MagneticButton({
  children,
  as = 'a',
  href,
  onClick,
  variant = 'outline',
  size = 'md',
  strength = 0.28,
  className = '',
  icon = true,
  ...rest
}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, SPRING.smooth)
  const y = useSpring(rawY, SPRING.smooth)

  const handleMove = useCallback(
    (event) => {
      if (reduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const offsetX = event.clientX - (rect.left + rect.width / 2)
      const offsetY = event.clientY - (rect.top + rect.height / 2)
      rawX.set(offsetX * strength)
      rawY.set(offsetY * strength)
    },
    [rawX, rawY, reduced, strength],
  )

  const handleLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  const variants = {
    solid:
      'bg-ink text-cream border border-ink hover:bg-[#2c2823] hover:border-[#2c2823]',
    outline:
      'bg-transparent text-ink border border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)] hover:border-gold-deep hover:bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)]',
    gold: 'bg-gold text-ink border border-gold hover:bg-gold-light hover:border-gold-light',
    ghost: 'bg-transparent text-ink border border-transparent hover:text-gold-deep',
  }

  const sizes = {
    sm: 'text-[0.62rem] tracking-[0.26em] px-5 py-3',
    md: 'text-[0.68rem] tracking-[0.28em] px-7 py-4',
    lg: 'text-[0.72rem] tracking-[0.3em] px-9 py-5',
  }

  const Component = motion[as] || motion.a

  return (
    <Component
      ref={ref}
      href={as === 'a' ? href : undefined}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x, y }}
      whileTap={reduced ? undefined : { scale: 0.975 }}
      className={`group relative inline-flex items-center justify-center gap-3 overflow-hidden font-normal uppercase transition-colors duration-500 ease-silk ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {/* Hover shine sweep — a single gold pass, never a loop */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.42),transparent)] transition-transform duration-[900ms] ease-silk group-hover:translate-x-full"
      />
      <span className="relative">{children}</span>
      {icon && (
        <span
          aria-hidden="true"
          className="relative transition-transform duration-500 ease-silk group-hover:translate-x-1"
        >
          <svg width="16" height="6" viewBox="0 0 16 6" fill="none" aria-hidden="true">
            <path
              d="M0 3h13.4M10.6 0.4 13.6 3l-3 2.6"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </Component>
  )
}

export default MagneticButton
