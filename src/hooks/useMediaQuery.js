import { useEffect, useState } from 'react'

/**
 * SSR-safe media query hook.
 * Kept for the handful of places where a JS branch genuinely differs from a
 * CSS one (WebGL quality tiers, GSAP pin on/off) — everything else should use
 * Tailwind breakpoints, not this.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const mql = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)

    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export default useMediaQuery
