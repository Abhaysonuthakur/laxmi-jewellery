import { Suspense, lazy, useEffect, useRef, useState } from 'react'

/**
 * The only 3D component the sections import.
 *
 * Two things happen here, and both matter more than they look:
 *
 * 1. LAZY — three.js, R3F and drei total roughly 1 MB uncompressed. Importing
 *    them from a section would put that on the critical path and delay first
 *    paint for every visitor, including the ones who never scroll to a 3D
 *    moment. `React.lazy` moves the whole stack into an async chunk that
 *    downloads after the shell is interactive.
 *
 * 2. DEFERRED MOUNT — the chunk is only requested once the placeholder comes
 *    within 320 px of the viewport. A visitor who lands and bounces never pays
 *    for WebGL at all. Combined with JewelleryScene's IntersectionObserver
 *    (which pauses the render loop when a canvas scrolls away), the site only
 *    ever renders the canvases actually on screen.
 *
 * The wrapper reserves its space via `className` from the moment it mounts, so
 * the async arrival of the canvas causes no layout shift — and therefore no
 * ScrollTrigger re-measurement.
 */
const SceneRuntime = lazy(() => import('./SceneRuntime'))

export function Scene3D({
  className = '',
  defer = true,
  rootMargin = '320px',
  fallback = null,
  ...runtimeProps
}) {
  const hostRef = useRef(null)
  const [active, setActive] = useState(!defer)

  useEffect(() => {
    const element = hostRef.current
    if (!element) return undefined

    if (!defer || typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [defer, rootMargin])

  return (
    <div ref={hostRef} className={`relative ${className}`}>
      {active && (
        <Suspense fallback={fallback}>
          <SceneRuntime {...runtimeProps} />
        </Suspense>
      )}
    </div>
  )
}

export default Scene3D
