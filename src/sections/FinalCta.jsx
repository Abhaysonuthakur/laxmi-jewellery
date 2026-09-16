import Scene3D from '../components/3d/Scene3D'
import MagneticButton from '../components/ui/MagneticButton'
import GoldLine from '../components/ui/GoldLine'
import { BRAND, SECTION_IDS } from '../data/site'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * Final cinematic moment.
 *
 * The page ends the way it began: one piece of gold, a lot of ivory, one line
 * of type. Deliberately the quietest section on the site — a loud finale after
 * eight sections of motion reads as desperation.
 *
 * SCOPE NOTE (Step 1): layout, copy and the live 3D piece are complete.
 * Step 8 adds the exit choreography — the piece drifting upward as the
 * viewport bottom is reached, and the ivory washing out into the footer.
 */
export function FinalCta() {
  const scope = useScrollReveal({ y: 36, blur: 7, stagger: 0.11 })

  return (
    <section
      ref={scope}
      aria-labelledby="final-title"
      className="relative isolate overflow-hidden bg-ivory pt-28 pb-24 md:pt-40 md:pb-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_42%,#FFFCF4_0%,transparent_72%)]"
      />

      <div className="shell relative flex flex-col items-center text-center">
        <GoldLine className="max-w-[5rem]" />

        <h2
          id="final-title"
          data-reveal
          className="mt-12 max-w-[20ch] font-display text-[clamp(2rem,7.4vw,6rem)] leading-[0.98] font-light tracking-[-0.02em] text-ink"
        >
          FIND SOMETHING
          <br />
          THAT FEELS
          <br />
          LIKE YOU.
        </h2>

        <div className="mt-14 w-full">
          <Scene3D
            className="mx-auto h-[62vw] max-h-[26rem] w-full max-w-[34rem] md:h-[30rem] lg:h-[34rem] lg:max-h-none"
            piece="ring"
            lightingIntensity={1.1}
            cameraPosition={[0, 0.1, 5.2]}
            fov={30}
          />
        </div>

        <div data-reveal className="mt-12 flex flex-col items-center gap-7">
          <p className="font-display text-[clamp(1.3rem,4vw,2.2rem)] tracking-[0.2em] text-ink">
            {BRAND.nameParts[0]} {BRAND.nameParts[1]}
          </p>
          <p className="eyebrow text-[0.58rem] text-gold-deep">{BRAND.location}</p>

          <MagneticButton
            href={`#${SECTION_IDS.collections}`}
            variant="solid"
            size="lg"
            className="mt-3"
          >
            Explore Collection
          </MagneticButton>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
