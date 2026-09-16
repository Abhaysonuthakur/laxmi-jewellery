import { useEffect, useState } from 'react'

/**
 * The only <img> wrapper in the project.
 *
 * Photography has not been delivered yet, so this component has to survive a
 * missing file without ever showing a broken-image icon or collapsing the
 * layout. It renders three explicit states:
 *
 *   loading → ivory block with a slow gold sheen
 *   loaded  → the photograph
 *   error   → an elegant ivory plate with a gold hairline and a caption
 *
 * `ratio` is always set so the box reserves its space and the page never
 * reflows when the real image lands (protects CLS, and ScrollTrigger's maths).
 */
export function MediaFrame({
  src,
  alt = '',
  label,
  ratio = '4 / 5',
  className = '',
  imgClassName = '',
  children,
  priority = false,
}) {
  const [status, setStatus] = useState('loading')

  // A changed src (collection swap, later steps) must reset the state machine.
  useEffect(() => {
    setStatus('loading')
  }, [src])

  const hasSrc = Boolean(src)

  return (
    <div
      className={`relative overflow-hidden bg-ivory ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {hasSrc && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-silk ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}

      {/* Loading — a single slow gold sheen, not a spinner */}
      {hasSrc && status === 'loading' && (
        <span
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#F8F5EF_0%,#F2E9D8_50%,#F8F5EF_100%)]"
        >
          <span className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(201,162,77,0.18),transparent)]" />
        </span>
      )}

      {/* Error / not-yet-supplied */}
      {(!hasSrc || status === 'error') && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream"
        >
          <span className="absolute inset-3 border border-line" />
          <span className="absolute inset-[0.9rem] border border-[color-mix(in_srgb,var(--color-gold)_35%,transparent)]" />
          <span className="eyebrow relative text-[0.6rem] text-gold-deep">
            {label || 'IMAGE PENDING'}
          </span>
          <span className="relative px-8 text-center text-[0.7rem] font-light tracking-[0.16em] text-faint uppercase">
            Asset slot reserved
          </span>
        </span>
      )}

      {children}
    </div>
  )
}

export default MediaFrame
