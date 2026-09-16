import MediaFrame from '../components/ui/MediaFrame'
import MithilaPattern from '../components/ui/MithilaPattern'
import MagneticButton from '../components/ui/MagneticButton'
import { SECTION_IDS } from '../data/site'
import { images, imageAlt } from '../data/images'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * Mithila heritage.
 *
 * The brief is explicit: introduce the local identity without making the site
 * look old-fashioned, and do not paper the whole page in Mithila artwork. So
 * the pattern appears exactly once — as a single frieze band — and the rest of
 * the section is plain ivory with a photograph.
 *
 * SCOPE NOTE (Step 1): layout, copy and the frieze are in place. Step 7 adds
 * the scroll-driven stroke draw and the slow parallax drift on the pattern.
 */
export function Heritage() {
  const scope = useScrollReveal({ y: 38, blur: 7, stagger: 0.1 })

  return (
    <section
      id={SECTION_IDS.heritage}
      ref={scope}
      aria-labelledby="heritage-title"
      className="relative isolate overflow-hidden bg-ivory py-28 md:py-40"
    >
      <div className="shell relative grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p data-reveal className="eyebrow text-gold-deep">
            07 — Heritage
          </p>
          <h2
            id="heritage-title"
            data-reveal
            className="display-lg mt-6 whitespace-pre-line text-ink"
          >
            {'INSPIRED BY\nHERITAGE'}
          </h2>
          <p
            data-reveal
            className="mt-7 font-display text-[clamp(1.1rem,2.6vw,1.5rem)] leading-relaxed font-light text-ink/85"
          >
            Tradition inspires every detail.
          </p>
          <p data-reveal className="measure mt-6 text-[0.9rem] leading-relaxed text-muted">
            Matihani sits in the Mithila region, where painted line work has
            been passed down for generations. We take from it the discipline
            rather than the decoration: repetition, symmetry, and a line that
            is drawn once and drawn correctly.
          </p>
          <div data-reveal className="mt-9">
            <MagneticButton href={`#${SECTION_IDS.story}`} variant="outline" size="md">
              Learn More
            </MagneticButton>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div data-reveal>
            <MediaFrame
              src={images.heritage}
              alt={imageAlt.heritage}
              label="HERITAGE"
              ratio="4 / 3"
            />
          </div>
        </div>
      </div>

      {/* The single Mithila frieze on the whole site */}
      <div aria-hidden="true" className="relative mt-20 h-[7rem] md:mt-28 md:h-[9rem]">
        <MithilaPattern className="absolute inset-0 h-full w-full" opacity={0.55} />
        <span className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,var(--color-ivory),transparent_28%,transparent_72%,var(--color-ivory))]" />
      </div>
    </section>
  )
}

export default Heritage
