import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function getInitial() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(QUERY).matches
}

/**
 * Live-tracks the OS "reduce motion" setting so the experience can downgrade
 * itself the moment the visitor flips the switch — no reload required.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(getInitial)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const mql = window.matchMedia(QUERY)
    const onChange = (event) => setReduced(event.matches)

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default usePrefersReducedMotion
