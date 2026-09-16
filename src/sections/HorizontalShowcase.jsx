import MediaFrame from '../components/ui/MediaFrame'
import { COLLECTIONS, SECTION_IDS } from '../data/site'
import { images, imageAlt } from '../data/images'
import { useScrollReveal } from '../hooks/useScrollReveal'

/**
 * Horizontal showcase.
 *
 * SCOPE NOTE (Step 1): this is an honest native-scroll rail — overflow-x with
 * scroll snapping, so it works on touch, with a keyboard, and with a
 * trackpad's horizontal gesture, today.
 *
 * Step 4 converts it to the pinned GSAP ScrollTrigger hijack: vertical scroll
 * drives horizontal travel, `pin: true`, `scrub: true`, and the native
 * overflow is removed. Doing it in that order matters — the accessible
 * version stays in git history as the fallback for reduced-motion visitors,
 * who should *never* get a pinned hijack.
 */
export function HorizontalShowcase() {
  const scope = useScrollReveal({ y: 34, blur: 6, stagger: 0.08 })

  return (
    <section
      ref={scope}
      aria-labelledby="rail-title"
      className="relative isolate overflow-hidden bg-cream py-24 md:py-32"
    >
      <div className="shell">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p data-reveal className="eyebrow text-gold-deep">
              04 — In Motion
            </p>
            <h2 id="rail-title" data-reveal className="display-md mt-5 text-ink">
              The collection, side by side.
            </h2>
          </div>
          <p
            data-reveal
            className="hidden max-w-[18rem] text-[0.8rem] leading-relaxed text-muted md:block"
          >
            Drag or scroll sideways to move through the four families.
          </p>
        </div>
      </div>

      {/* Rail — native overflow for now, GSAP pin in Step 4 */}
      <div
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[clamp(1.25rem,4vw,3rem)] pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Collection rail"
        tabIndex={0}
      >
        {COLLECTIONS.map((item, index) => (
          <article
            key={item.id}
            className="w-[78vw] shrink-0 snap-center sm:w-[52vw] md:w-[38vw] lg:w-[26rem]"
          >
            <MediaFrame
              src={images[item.imageKey]}
              alt={imageAlt[item.imageKey]}
              label={item.title}
              ratio="3 / 4"
            />
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <h3 className="font-display text-[1.05rem] tracking-[0.18em] text-ink">
                {item.title}
              </h3>
              <span className="text-[0.55rem] tracking-[0.24em] text-gold-deep">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="mt-2 text-[0.75rem] text-muted">{item.caption}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HorizontalShowcase
