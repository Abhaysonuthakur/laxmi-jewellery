import MediaFrame from '../components/ui/MediaFrame'
import MagneticButton from '../components/ui/MagneticButton'
import GoldLine from '../components/ui/GoldLine'
import { SECTION_IDS } from '../data/site'
import { images, imageAlt } from '../data/images'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * Bridal.
 *
 * The only section on the site that leaves the ivory palette — it shifts to a
 * soft blush wash, which is what makes it read as an *occasion* rather than
 * another product row. The background stays light; the warmth does the work.
 *
 * SCOPE NOTE (Step 1): layout, palette shift, copy and reveal are complete.
 * Step 5 adds the scroll-driven image reveal — the frame starts at
 * `clip-path: inset(10%)` with `scale: 1.15` and opens to full bleed as the
 * section enters, with the headline passing over the photograph.
 */
export function Bridal() {
  const scope = useScrollReveal({ y: 40, blur: 7, stagger: 0.11 })

  return (
    <section
      id={SECTION_IDS.bridal}
      ref={scope}
      aria-labelledby="bridal-title"
      className="relative isolate overflow-hidden bg-blush py-28 md:py-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_28%_18%,#FFFBF6_0%,transparent_68%)]"
      />

      <div className="shell relative">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p data-reveal className="eyebrow text-gold-deep">
              05 — Bridal
            </p>
            <h2
              id="bridal-title"
              data-reveal
              className="mt-6 font-display text-[clamp(2.4rem,9vw,6.5rem)] leading-[0.95] font-light tracking-[-0.02em] text-ink"
            >
              BRIDAL
              <br />
              COLLECTION
            </h2>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <p
              data-reveal
              className="font-display text-[clamp(1.2rem,3vw,1.75rem)] leading-[1.4] font-light text-ink/85"
            >
              For moments you&apos;ll remember forever.
            </p>
            <p data-reveal className="measure mt-6 text-[0.9rem] leading-relaxed text-muted">
              A bridal set is fitted, not chosen off a shelf. We work with the
              family across several sittings — adjusting weight, drape and
              balance until the jewellery sits correctly under the veil and
              still feels right at the end of a very long day.
            </p>
            <div data-reveal className="mt-9">
              <MagneticButton href={`#${SECTION_IDS.collections}`} variant="gold" size="md">
                Explore Bridal
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* Editorial image — clip-path reveal lands in Step 5 */}
        <div data-reveal className="mt-16 md:mt-20">
          <MediaFrame
            src={images.bridal}
            alt={imageAlt.bridal}
            label="BRIDAL"
            ratio="16 / 9"
            className="w-full"
          />
        </div>

        {/* Three quiet service notes — no invented claims, no numbers */}
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            {
              title: 'Fitted, not sold',
              body: 'Weight, drape and balance adjusted across several sittings before the set is finalised.',
            },
            {
              title: 'Family in the room',
              body: 'Decisions about a bridal set are family decisions. There is room for everyone.',
            },
            {
              title: 'Made to be worn',
              body: 'Finished so the piece sits comfortably for the length of the ceremony and beyond.',
            },
          ].map((note) => (
            <div key={note.title} data-reveal>
              <GoldLine className="max-w-[3.5rem]" />
              <h3 className="mt-5 font-display text-[1.1rem] tracking-[0.1em] text-ink">
                {note.title}
              </h3>
              <p className="mt-3 text-[0.82rem] leading-relaxed text-muted">{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Bridal
