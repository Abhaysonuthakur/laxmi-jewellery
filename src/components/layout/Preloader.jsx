import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BRAND } from '../../data/site'
import { EASE } from '../../lib/anim'

/**
 * Preloader — 1.8 seconds, then it gets out of the way.
 *
 * The sequence is a jewellery-box opening, not a progress bar:
 *
 *   0.00s  wordmark rises in, three lines staggered
 *   0.35s  a single gold hairline draws across the centre
 *   1.05s  wordmark lifts and dissolves
 *   1.25s  the ivory screen splits along that hairline and peels apart,
 *          revealing the hero already mid-entrance behind it
 *   2.10s  overlay unmounts
 *
 * `onReveal` fires at the split — not at the end — so the hero animation is
 * already running as the curtain opens. Waiting until the overlay is gone
 * makes the two sequences read as separate events.
 *
 * There is no fake percentage. A 1.8s brand moment is honest; a progress bar
 * that reaches 90% and waits is not.
 */
export function Preloader({ onReveal, onDone }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState(reduced ? 'done' : 'hold')

  useEffect(() => {
    if (reduced) {
      onReveal?.()
      onDone?.()
      return undefined
    }

    const toSplit = window.setTimeout(() => {
      setPhase('split')
      onReveal?.()
    }, 1250)

    const toDone = window.setTimeout(() => {
      setPhase('done')
      onDone?.()
    }, 2150)

    return () => {
      window.clearTimeout(toSplit)
      window.clearTimeout(toDone)
    }
  }, [reduced, onReveal, onDone])

  if (phase === 'done') return null

  const splitting = phase === 'split'

  const wordmark = {
    hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.85, delay: 0.08 + index * 0.09, ease: EASE.silk },
    }),
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading LAXMI JEWELLERY"
      className="pointer-events-none fixed inset-0 z-[100]"
    >
      <span className="sr-only">Loading LAXMI JEWELLERY, Matihani, Nepal</span>

      {/* Two halves of the ivory screen. They part along the gold hairline. */}
      <motion.div
        aria-hidden="true"
        initial={{ y: 0 }}
        animate={{ y: splitting ? '-100%' : 0 }}
        transition={{ duration: 0.95, ease: EASE.silk }}
        className="absolute inset-x-0 top-0 h-[50.5%] bg-ivory"
      />
      <motion.div
        aria-hidden="true"
        initial={{ y: 0 }}
        animate={{ y: splitting ? '100%' : 0 }}
        transition={{ duration: 0.95, ease: EASE.silk }}
        className="absolute inset-x-0 bottom-0 h-[50.5%] bg-ivory"
      />

      {/* The champagne underlayer — gives the split a moment of depth */}
      <motion.div
        aria-hidden="true"
        initial={{ y: 0 }}
        animate={{ y: splitting ? '-100%' : 0 }}
        transition={{ duration: 1.05, ease: EASE.silk, delay: 0.07 }}
        className="absolute inset-x-0 top-0 h-1/2 bg-champagne"
      />
      <motion.div
        aria-hidden="true"
        initial={{ y: 0 }}
        animate={{ y: splitting ? '100%' : 0 }}
        transition={{ duration: 1.05, ease: EASE.silk, delay: 0.07 }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-champagne"
      />

      {/* Wordmark */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: splitting ? 0 : 1 }}
        transition={{ duration: 0.4, ease: EASE.swift }}
      >
        <motion.h1
          custom={0}
          variants={wordmark}
          initial="hidden"
          animate="visible"
          className="font-display text-[clamp(2.6rem,11vw,5.4rem)] leading-none font-light tracking-[0.14em] text-ink"
        >
          {BRAND.nameParts[0]}
        </motion.h1>

        {/* The hairline that the screen later splits along */}
        <motion.span
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.36, ease: EASE.silk }}
          className="my-5 block h-px w-[min(22rem,68vw)] origin-center bg-[linear-gradient(90deg,transparent,var(--color-gold)_18%,var(--color-gold)_82%,transparent)]"
        />

        <motion.p
          custom={1}
          variants={wordmark}
          initial="hidden"
          animate="visible"
          className="font-display text-[clamp(0.9rem,3.4vw,1.5rem)] leading-none font-light tracking-[0.5em] text-ink/80"
        >
          {BRAND.nameParts[1]}
        </motion.p>

        <motion.p
          custom={2}
          variants={wordmark}
          initial="hidden"
          animate="visible"
          className="eyebrow mt-7 text-[0.58rem] text-gold-deep"
        >
          {BRAND.location}
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Preloader
