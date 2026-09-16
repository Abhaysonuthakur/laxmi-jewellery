/**
 * A hairline that can be drawn, scaled and faded by any animation layer.
 *
 * `data-gold-line` is the hook GSAP targets, so a parent timeline can do:
 *   gsap.from(el.querySelectorAll('[data-gold-line]'), { scaleX: 0, stagger: 0.08 })
 * without this component needing to know anything about the animation.
 */
export function GoldLine({
  orientation = 'horizontal',
  className = '',
  tone = 'gold',
  width = 1,
}) {
  const tones = {
    gold: 'var(--color-gold)',
    line: 'var(--color-line)',
    ink: 'var(--color-ink)',
  }

  return (
    <span
      aria-hidden="true"
      data-gold-line
      className={`block shrink-0 origin-left ${
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px origin-top'
      } ${className}`}
      style={{
        background:
          orientation === 'horizontal'
            ? `linear-gradient(90deg, transparent, ${tones[tone]} 14%, ${tones[tone]} 86%, transparent)`
            : `linear-gradient(180deg, transparent, ${tones[tone]} 14%, ${tones[tone]} 86%, transparent)`,
        ...(orientation === 'horizontal' ? { height: `${width}px` } : { width: `${width}px` }),
      }}
    />
  )
}

export default GoldLine
