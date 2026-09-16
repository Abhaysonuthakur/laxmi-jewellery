import { useEffect, useRef } from 'react'

/**
 * Cursor tracking that never triggers a React render.
 *
 * Returns a ref holding normalised coordinates in the range -1 → 1:
 *   x: -1 = far left,  1 = far right
 *   y: -1 = far top,   1 = far bottom
 *
 * `useFrame` inside R3F reads `.current` every frame and lerps toward it, so
 * the animation lives entirely on the GPU side of the fence. Calling setState
 * on pointermove is the classic way to turn a 60fps scene into a 20fps one.
 */
export function usePointer({ enabled = true } = {}) {
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      pointer.current.x = 0
      pointer.current.y = 0
      return undefined
    }

    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    const onLeave = () => {
      pointer.current.x = 0
      pointer.current.y = 0
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  return pointer
}

export default usePointer
