import { useScrollReveal } from '../hooks/useScrollReveal'
import GoldLine from '../components/ui/GoldLine'

/**
 * Brand statement.
 *
 * The headline is split into word spans at build time rather than relying on
 * GSAP's paid SplitText plugin — same staggered, mask-clipped reveal, no
 * licence, and the words remain real text nodes so screen readers and search
 * engines read one clean sentence instead of a pile of divs.
 *
 * Each line is its own mask wrapper, so lines rise independently the way the
 * brief asks.
 */
const LINES = [
  { words: ['JEWELLERY'], lead: true },
  { words: ['IS', 'MORE', 'THAN'] },
  { words: ['AN', 'ORNAMENT.'] },
]

export function BrandStatement() {
  const scope = useScrollReveal({ y: 0, blur: 0, stagger: 0.1, start: 'top 78%' })

  return (
    <section
      ref={scope}
      aria-label="Brand statement"
      className="relative isolate overflow-hidden bg-ivory py-32 md:py-48"
    >
      {/* A single very soft warm pool — the only decoration this section needs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_50%,#FFFCF5_0%,transparent_70%)]"
      />

      <div className="shell relative">
        <GoldLine className="max-w-[6rem]" />

        <h2 className="mt-12 font-display text-[clamp(2.2rem,8.2vw,7rem)] leading-[0.98] font-light tracking-[-0.02em] text-ink">
          {LINES.map((line, lineIndex) => (
            <span key={lineIndex} className="block overflow-hidden py-[0.06em]">
              <span className="flex flex-wrap gap-x-[0.28em]">
                {line.words.map((word, wordIndex) => (
                  <span
                    key={`${lineIndex}-${wordIndex}`}
                    data-reveal
                    className={`inline-block ${
                      line.lead ? 'text-ink' : 'text-ink/80'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h2>

        <p
          data-reveal
          className="mt-12 font-display text-[clamp(1.05rem,2.6vw,1.6rem)] leading-relaxed font-light text-muted italic"
        >
          It becomes part of your story.
        </p>
      </div>
    </section>
  )
}

export default BrandStatement
