/**
 * Mithila-inspired ornamental band.
 *
 * This is the one place on the site where local identity appears, and it is
 * deliberately restrained: a single horizontal frieze, hairline strokes in
 * gold, low opacity, no fill, no colour. Mithila painting is dense and
 * saturated — reproducing that literally here would fight everything the
 * brand stands for. What we borrow instead is the *grammar*: repeating
 * concentric arcs, lotus petals, chevrons and a fish form, all reduced to
 * line.
 *
 * Strokes carry a dash offset so the frieze can draw itself on scroll
 * (Step 7 wires that to ScrollTrigger; the CSS keyframe is the static
 * fallback).
 */
export function MithilaPattern({ className = '', opacity = 0.5 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 160"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={{ opacity }}
    >
      <g
        stroke="var(--color-gold)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* Central lotus — the axis of the frieze */}
        <path d="M600 96c0-26 14-46 34-58-4 24-14 44-34 58Z" />
        <path d="M600 96c0-26-14-46-34-58 4 24 14 44 34 58Z" />
        <path d="M600 96c0-20 9-36 22-46-3 19-9 35-22 46Z" />
        <path d="M600 96c0-20-9-36-22-46 3 19 9 35 22 46Z" />
        <path d="M566 98h68" />

        {/* Concentric arc pair, repeated outward */}
        <path d="M540 92a60 60 0 0 1 120 0" />
        <path d="M516 92a84 84 0 0 1 168 0" />
        <path d="M492 92a108 108 0 0 1 216 0" />

        {/* Left chevron run */}
        <path d="M300 92l22-22 22 22-22 22-22-22Z" />
        <path d="M256 92l18-18 18 18-18 18-18-18Z" />
        <path d="M212 92l14-14 14 14-14 14-14-14Z" />

        {/* Right chevron run */}
        <path d="M900 92l-22-22-22 22 22 22 22-22Z" />
        <path d="M944 92l-18-18-18 18 18 18 18-18Z" />
        <path d="M988 92l-14-14-14 14 14 14 14-14Z" />

        {/* Fish forms — a recurring Mithila motif for fertility and fortune */}
        <path d="M96 84c22-16 46-16 68 0-22 16-46 16-68 0Z" />
        <path d="M164 84l20-14v28l-20-14Z" />
        <path d="M1104 84c-22-16-46-16-68 0 22 16 46 16 68 0Z" />
        <path d="M1036 84l-20-14v28l20-14Z" />

        {/* Ground and crown rails */}
        <path d="M0 132h1200" />
        <path d="M0 28h1200" strokeOpacity="0.55" />
        <path d="M0 20h1200" strokeOpacity="0.3" />

        {/* Fine vertical ticks — the woven texture of a painted wall */}
        {Array.from({ length: 24 }).map((_, index) => (
          <path key={index} d={`M${index * 50 + 25} 132v10`} strokeOpacity="0.45" />
        ))}
      </g>
    </svg>
  )
}

export default MithilaPattern
