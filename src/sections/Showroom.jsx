import MediaFrame from '../components/ui/MediaFrame'
import MagneticButton from '../components/ui/MagneticButton'
import { BRAND, CONTACT, SECTION_IDS } from '../data/site'
import { images, imageAlt } from '../data/images'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * Showroom.
 *
 * BUSINESS-DATA POLICY: the phone number, street address, opening hours and
 * map link have not been supplied. This component never invents them. When a
 * value is empty the corresponding control renders in a clearly-marked
 * "awaiting details" state instead of a dead link or a fabricated number —
 * so nothing ships to production looking finished when it is not.
 *
 * SCOPE NOTE (Step 1): layout and the contact states are complete. Step 7 adds
 * the scroll reveal where the photograph grows from a small rectangle to full
 * width.
 */
function ContactAction({ label, href, pendingLabel }) {
  if (!href) {
    return (
      <span
        className="inline-flex cursor-not-allowed items-center gap-3 border border-line px-7 py-4 text-[0.68rem] tracking-[0.28em] text-faint uppercase"
        title={`${label} — ${pendingLabel}`}
      >
        {label}
        <span className="text-[0.5rem] tracking-[0.2em] text-faint/80 normal-case">
          ({pendingLabel})
        </span>
      </span>
    )
  }

  return (
    <MagneticButton href={href} variant="outline" size="md" target="_blank" rel="noreferrer">
      {label}
    </MagneticButton>
  )
}

export function Showroom() {
  const scope = useScrollReveal({ y: 40, blur: 7, stagger: 0.1 })

  return (
    <section
      id={SECTION_IDS.showroom}
      ref={scope}
      aria-labelledby="showroom-title"
      className="relative isolate bg-cream py-28 md:py-36"
    >
      <div className="shell">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-reveal className="eyebrow text-gold-deep">
              08 — Showroom
            </p>
            <h2 id="showroom-title" data-reveal className="display-lg mt-6 text-ink">
              VISIT LAXMI JEWELLERY
            </h2>
            <p data-reveal className="eyebrow mt-5 text-[0.58rem] text-muted">
              {BRAND.location}
            </p>
          </div>

          <div data-reveal className="flex flex-wrap gap-4">
            <ContactAction
              label="Get Directions"
              href={CONTACT.mapUrl}
              pendingLabel="map link to be supplied"
            />
            <ContactAction
              label="Contact Us"
              href={CONTACT.phone ? `tel:${CONTACT.phone}` : ''}
              pendingLabel="number to be supplied"
            />
          </div>
        </div>

        <div data-reveal className="mt-14">
          <MediaFrame
            src={images.showroom}
            alt={imageAlt.showroom}
            label="SHOWROOM"
            ratio="21 / 9"
            className="w-full"
          />
        </div>

        {/* Practical details — each falls back to an honest placeholder */}
        <dl className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3">
          <div data-reveal>
            <dt className="eyebrow text-[0.55rem] text-gold-deep">Address</dt>
            <dd className="mt-3 text-[0.88rem] leading-relaxed text-muted">
              {CONTACT.addressLine || 'Street address to be supplied'}
              <br />
              {BRAND.city}
            </dd>
          </div>
          <div data-reveal>
            <dt className="eyebrow text-[0.55rem] text-gold-deep">Opening Hours</dt>
            <dd className="mt-3 text-[0.88rem] leading-relaxed text-muted">
              {CONTACT.hours || 'Opening hours to be supplied'}
            </dd>
          </div>
          <div data-reveal>
            <dt className="eyebrow text-[0.55rem] text-gold-deep">Telephone</dt>
            <dd className="mt-3 text-[0.88rem] leading-relaxed text-muted">
              {CONTACT.phone || 'Telephone number to be supplied'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default Showroom
