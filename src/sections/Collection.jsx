import MediaFrame from '../components/ui/MediaFrame'
import SectionHeading from '../components/ui/SectionHeading'
import { COLLECTIONS, SECTION_IDS } from '../data/site'
import { images, imageAlt } from '../data/images'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * The collection grid.
 *
 * Editorial, not e-commerce: no price, no "add to cart", no badge. Each card is
 * a portrait frame with the label sitting *outside* it, so the photograph is
 * never competing with UI.
 *
 * Hover is pure CSS — transform and opacity only, so it costs nothing on the
 * main thread:
 *   - the photograph scales 1.03 inside a fixed frame (never reflowing)
 *   - a single gold light sweep crosses the image once
 *   - the frame lifts, the label rises
 *
 * SCOPE NOTE (Step 1): the grid, hover language and reveal are complete.
 * Step 4 adds pointer-driven 3D tilt and the pinned horizontal rail.
 */
export function Collection() {
  const scope = useScrollReveal({ y: 44, blur: 8, stagger: 0.1 })

  return (
    <section
      id={SECTION_IDS.collections}
      ref={scope}
      aria-labelledby="collection-title"
      className="relative isolate bg-ivory py-28 md:py-36"
    >
      <div className="shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            index="03"
            eyebrow="The Collection"
            title={'THE\nCOLLECTION'}
            lead="Designed for every expression."
            className="md:max-w-[34rem]"
          />
          <p data-reveal className="max-w-[22rem] text-[0.82rem] leading-relaxed text-muted">
            Four families, one standard. Every piece is finished by hand in our
            Matihani workshop before it is placed in a case.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 md:mt-20 md:gap-x-7 lg:grid-cols-4">
          {COLLECTIONS.map((item, index) => (
            <li key={item.id} data-reveal className="group">
              <a href={`#${SECTION_IDS.collections}`} className="block">
                {/* Frame */}
                <div className="relative overflow-hidden bg-cream transition-transform duration-[900ms] ease-silk group-hover:-translate-y-2">
                  <MediaFrame
                    src={images[item.imageKey]}
                    alt={imageAlt[item.imageKey]}
                    label={item.title}
                    ratio="4 / 5"
                    imgClassName="group-hover:scale-[1.045] transition-transform duration-[1400ms] ease-silk"
                  />

                  {/* Single gold light sweep on hover — never a loop */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(228,200,120,0.55),transparent)] transition-transform duration-[1100ms] ease-silk group-hover:translate-x-[420%]"
                  />

                  {/* Hairline that draws in on hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-700 group-hover:border-[color-mix(in_srgb,var(--color-gold)_45%,transparent)]"
                  />
                </div>

                {/* Label — outside the frame, per the editorial rule */}
                <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-4 transition-colors duration-500 group-hover:border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)]">
                  <div>
                    <h3 className="font-display text-[clamp(0.95rem,2.4vw,1.25rem)] tracking-[0.16em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[0.7rem] leading-snug text-muted">
                      {item.caption}
                    </p>
                  </div>
                  <span className="text-[0.55rem] tracking-[0.24em] text-gold-deep uppercase">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <span className="mt-3 inline-flex items-center gap-2 text-[0.6rem] tracking-[0.26em] text-muted uppercase transition-colors duration-400 group-hover:text-ink">
                  Explore
                  <svg width="14" height="6" viewBox="0 0 16 6" fill="none" aria-hidden="true">
                    <path
                      d="M0 3h13.4M10.6 0.4 13.6 3l-3 2.6"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Collection
