import { useMemo } from 'react'
import { useMediaQuery } from './useMediaQuery'

/**
 * Classifies the device so the 3D layer can scale itself down honestly.
 *
 * `tier` drives real decisions:
 *   high   → full particle counts, dpr up to 2, mouse parallax on
 *   medium → reduced particles, dpr capped at 1.5, gentler parallax
 *   low    → minimal particles, dpr 1, camera essentially static
 *
 * Touch is detected with `pointer: coarse` rather than screen width — a narrow
 * desktop window is not a phone and should not lose its mouse interaction.
 */
export function useDeviceTier() {
  const isTouch = useMediaQuery('(pointer: coarse)')
  const isSmallScreen = useMediaQuery('(max-width: 767px)')
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  return useMemo(() => {
    /*
     * Read the two capability signals as `null` when they are unavailable,
     * rather than substituting a default.
     *
     * `navigator.deviceMemory` is Chromium-only — Safari and Firefox return
     * `undefined`. Defaulting it to 4 (the old behaviour) meant `memory <= 4`
     * was true on every non-Chromium browser, so every Safari and Firefox
     * visitor was classified as a weak device: 300 particles instead of 800,
     * dpr capped at 1.5, and — worst of all — no mouse parallax at all. It
     * also mis-fired on Chromium itself when the memory hint is withheld.
     *
     * A missing signal must mean "unknown", not "bad". `hardwareConcurrency`
     * is supported everywhere and still catches genuinely low-core machines,
     * and phones are already handled by the `isTouch && isSmallScreen` branch
     * below, so nothing that actually needs downgrading slips through.
     */
    const hasNavigator = typeof navigator !== 'undefined'
    const cores = hasNavigator && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : null
    const memory =
      hasNavigator && typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null

    const isWeak = (cores !== null && cores <= 4) || (memory !== null && memory <= 4)

    let tier = 'high'
    if (isTouch && isSmallScreen) tier = isWeak ? 'low' : 'medium'
    else if (isTouch || isSmallScreen || isWeak) tier = 'medium'

    return {
      tier,
      isTouch,
      isSmallScreen,
      isWeak,
      isMobile: isTouch && isSmallScreen,
      isReduced,

      /** Particle budget — desktop 800 / tablet 300 / mobile 100. */
      particleCount: tier === 'high' ? 800 : tier === 'medium' ? 300 : 100,

      /** Never let a 3x phone screen rasterise 9x the pixels for a 1px gold line. */
      dpr: tier === 'high' ? [1, 2] : tier === 'medium' ? [1, 1.5] : 1,

      /** Mouse-driven camera drift is pointless (and jittery) on touch. */
      enablePointerParallax: tier === 'high' && !isReduced,

      /** Scroll-pinned sections cost the most; only pin where there is room. */
      enablePin: !isSmallScreen && !isReduced,
    }
  }, [isTouch, isSmallScreen, isReduced])
}

export default useDeviceTier
