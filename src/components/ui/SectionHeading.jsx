import GoldLine from './GoldLine'

/**
 * The editorial section opener used by every section.
 *
 * Renders the index number ("01"), the eyebrow, the display heading and an
 * optional lead line — the repeating rhythm that makes a long scroll feel
 * composed rather than assembled.
 *
 * `data-reveal` marks the three children as scroll-reveal targets; Step 3's
 * text timeline picks them up without this component knowing about GSAP.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'ink',
  className = '',
}) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <header className={`flex flex-col ${alignment} ${className}`}>
      <div
        data-reveal
        className={`flex items-center gap-4 ${align === 'center' ? 'justify-center' : ''}`}
      >
        {index && <span className="eyebrow text-gold-deep">{index}</span>}
        <span className="h-px w-8 bg-[color-mix(in_srgb,var(--color-gold)_60%,transparent)]" />
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      </div>

      {title && (
        <h2
          data-reveal
          className={`display-lg mt-6 whitespace-pre-line ${
            tone === 'ink' ? 'text-ink' : 'text-ink/85'
          }`}
        >
          {title}
        </h2>
      )}

      {lead && (
        <p data-reveal className="measure mt-6 text-[0.95rem] leading-relaxed text-muted">
          {lead}
        </p>
      )}

      <GoldLine className={`mt-8 max-w-[7rem] ${align === 'center' ? 'mx-auto' : ''}`} />
    </header>
  )
}

export default SectionHeading
