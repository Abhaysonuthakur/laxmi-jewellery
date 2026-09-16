import { useRef } from 'react'
import { motion } from 'framer-motion'
import Scene3D from '../components/3d/Scene3D'
import MagneticButton from '../components/ui/MagneticButton'
import { BRAND, SECTION_IDS } from '../data/site'
import { useDeviceTier } from '../hooks/useDeviceTier'
import { useHeroScroll } from '../hooks/useHeroScroll'
import { EASE } from '../lib/anim'

/**
 * Hero.
 *
 * ---------------------------------------------------------------------------
 * STRUCTURE — a sticky stage inside a tall section
 * ---------------------------------------------------------------------------
 * The section is ~2 viewports tall. Inside it, a single stage is `sticky
 * top-0 h-[100dvh]`. So the visitor scrolls roughly one viewport height while
 * the composition stays fixed on screen and the *contents* of the stage
 * change: the copy exits, the camera orbits, the piece lifts and dissolves,
 * and the ivory washes to champagne.
 *
 * The alternative — a 100vh section — gives you only ~900px of scroll for the
 * whole sequence. Everything has to happen at once and it reads as a jump
 * rather than a shot. Two viewports is the smallest amount of scroll that
 * makes a camera move legible.
 *
 * `overflow-hidden` sits on the sticky stage itself, never on an ancestor.
 * Overflow on an *ancestor* of a sticky element turns that ancestor into a
 * scroll container and silently kills the sticking.
 *
 * ---------------------------------------------------------------------------
 * DOM ORDER vs VISUAL ORDER
 * ---------------------------------------------------------------------------
 * The DOM order is: heading → 3D stage → tagline + CTA.
 *
 * On mobile that is the visual order too, which matches the brief's mobile
 * hero (logo, heading, jewellery, CTA). On desktop the two copy blocks are
 * placed back into a single left-hand column with explicit grid placement,
 * and the stage spans both rows on the right.
 *
 * Doing it this way means one DOM order serves both layouts, so there is no
 * duplicated markup and no `display: contents` trickery — and screen readers
 * get a sensible reading order either way.
 *
 * ---------------------------------------------------------------------------
 * ENTRANCE
 * ---------------------------------------------------------------------------
 * Each element owns its own `initial` / `animate` pair. See the note in Step 1:
 * a parent orchestrator with `variants` + `staggerChildren` fails silently
 * when its own target variant is an empty object.
 */
const RISE_FROM = { opacity: 0, y: 26 }
const RISE_TO = { opacity: 1, y: 0 }

/** Stagger by index: 100ms lead-in, 75ms between lines. */
const riseAt = (index) => ({
  duration: 1,
  ease: EASE.silk,
  delay: 0.1 + index * 0.075,
})

export function Hero({ ready = true }) {
  const { particleCount } = useDeviceTier()

  const sectionRef = useRef(null)
  const washRef = useRef(null)
  const cueRef = useRef(null)

  // The two copy blocks are found by `[data-hero-exit]` inside the section —
  // see the note in useHeroScroll.js for why they are not passed as refs.
  useHeroScroll({ sectionRef, washRef, cueRef, enabled: ready })

  const rise = (index) => ({
    initial: RISE_FROM,
    animate: ready ? RISE_TO : RISE_FROM,
    transition: riseAt(index),
  })

  return (
    <section
      id={SECTION_IDS.home}
      ref={sectionRef}
      aria-label="LAXMI JEWELLERY"
      data-ready={String(ready)}
      className="relative isolate h-[190vh] bg-ivory md:h-[215vh]"
    >
      {/* The stage. Sticky, exactly one viewport tall. */}
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Warm light pool behind the piece — reads as sunlight, not a gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_72%_38%,#FFFBF1_0%,#F8F5EF_46%,#F4EFE4_100%)]"
        />

        {/* Champagne wash — GSAP fades this in over the tail of the scroll so
            the hero melts into the story section rather than ending.

            NOTE: `washRef` is attached here and nowhere else. React keeps only
            the last ref assignment, so a second `ref={washRef}` anywhere in
            this tree would silently retarget the GSAP tween. */}
        <div
          ref={washRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-champagne opacity-0"
        />

        <div className="shell relative grid h-full grid-cols-1 content-center gap-4 pt-16 pb-6 sm:gap-5 sm:pt-20 sm:pb-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:content-stretch lg:gap-0 lg:pt-0 lg:pb-0">
          {/* ---- Heading -------------------------------------------------
              The top padding clears the fixed navbar and shrinks on short
              viewports (`14vh`), because a fixed 96px would eat a third of a
              443px-tall window. The row is `auto`, not `1fr` + `self-end`:
              an auto row grows to fit its content, so the heading can never
              overflow *upward* into the navbar the way it did before.

              `pb` and the tagline's `pt` are the same fluid gap — together
              they are the 56px breath between the heading and the CTA at full
              height, and they compress on short windows so the CTA still
              fits. `display-hero` is calibrated against these values. */}
          <div
            data-hero-exit
            className="order-1 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:pr-6 lg:pb-[clamp(0.75rem,3vh,1.75rem)] lg:pt-[clamp(6rem,14vh,8rem)]"
          >
            <motion.p {...rise(0)} className="eyebrow text-gold-deep">
              Tradition · Beauty · Trust
            </motion.p>

            <motion.h1
              {...rise(1)}
              className="display-hero mt-5 text-ink sm:mt-6"
            >
              <span className="block">{BRAND.nameParts[0]}</span>
              <span className="block">{BRAND.nameParts[1]}</span>
            </motion.h1>

            <motion.p {...rise(2)} className="eyebrow mt-4 text-[0.6rem] text-muted sm:mt-5">
              {BRAND.location}
            </motion.p>
          </div>

          {/* ---- 3D stage ------------------------------------------------ */}
          <div className="order-2 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 lg:h-full">
            <Scene3D
              className="h-[40vw] max-h-[15rem] w-full sm:h-[52vw] sm:max-h-[20rem] lg:h-full lg:max-h-none"
              piece="necklace"
              mode="hero"
              contactShadow
              lightingIntensity={1}
              particles={Math.round(particleCount * 0.55)}
              particleRadius={6.5}
              particleHeight={4.4}
              cameraPosition={[0, 0, 6]}
              fov={32}
            />
          </div>

          {/* ---- Tagline + CTA ------------------------------------------- */}
          <div
            data-hero-exit
            className="order-3 lg:col-span-6 lg:col-start-1 lg:row-start-2 lg:self-start lg:pr-6 lg:pt-[clamp(0.75rem,3vh,1.75rem)]"
          >
            <motion.p
              {...rise(3)}
              className="max-w-[24rem] font-display text-[clamp(1.05rem,2.6vw,1.6rem)] leading-[1.35] font-light text-ink/85"
            >
              {BRAND.tagline}
            </motion.p>

            <motion.div {...rise(4)} className="mt-6 flex flex-wrap items-center gap-5 sm:mt-8 sm:gap-6">
              <MagneticButton href={`#${SECTION_IDS.collections}`} variant="solid" size="md">
                Explore Collection
              </MagneticButton>

              <a
                href={`#${SECTION_IDS.bridal}`}
                className="group inline-flex items-center gap-3 text-[0.68rem] tracking-[0.28em] text-muted uppercase transition-colors duration-400 hover:text-ink"
              >
                Bridal Edit
                <span className="h-px w-6 origin-left scale-x-100 bg-gold transition-transform duration-500 ease-silk group-hover:scale-x-150" />
              </a>
            </motion.div>
          </div>
        </div>

        {/* ---- Baseline strip ------------------------------------------
            Absolutely positioned against the bottom of the stage, so it does
            not participate in the grid and cannot push anything around. That
            also means it is the first thing to collide when the window is
            short: measured, it starts overlapping the CTA below ~630px of
            height. It is a decorative hint, so on a cramped window it is
            dropped rather than fought for. The height condition is a single
            combined media query rather than stacked variants so there is no
            ambiguity about how the two compose. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="shell pointer-events-none absolute inset-x-0 bottom-0 hidden pb-8 [@media(min-width:1024px)_and_(min-height:660px)]:block"
        >
          <div ref={cueRef} className="flex items-end justify-between border-t border-line pt-5">
            <span className="flex items-center gap-3 text-[0.55rem] tracking-[0.3em] text-faint uppercase">
              <span className="block h-8 w-px bg-[linear-gradient(180deg,var(--color-gold),transparent)]" />
              Scroll to explore
            </span>
            <span className="text-[0.55rem] tracking-[0.3em] text-faint uppercase">
              Traditional · Modern · Timeless
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
