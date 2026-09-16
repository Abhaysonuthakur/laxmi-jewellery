import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Model } from './Model'
import { usePointer } from '../../hooks/usePointer'
import { useDeviceTier } from '../../hooks/useDeviceTier'
import { damp } from '../../lib/anim'

/**
 * A piece the cursor can move.
 *
 * Restraint is the whole point — the brief asks for "expensive and elegant",
 * and expensive means the object barely responds:
 *
 *   pointer x  →  ±0.26 rad yaw    (about 15°)
 *   pointer y  →  ±0.13 rad pitch  (about 7°)
 *
 * Every frame damps toward the target with a frame-rate-independent lerp, so
 * the motion glides and never snaps. A constant 0.06 rad/s idle rotation keeps
 * the piece alive when the cursor is still.
 *
 * Lighting is deliberately NOT included here — the scene runtime owns the rig,
 * so a piece can be dropped into any scene without doubling the light setup.
 */
export function InteractivePiece({ piece = 'necklace', grade, contactShadow = false }) {
  const groupRef = useRef(null)
  const pointer = usePointer()
  const { enablePointerParallax, tier } = useDeviceTier()

  const parallax = enablePointerParallax ? 1 : tier === 'medium' ? 0.45 : 0

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    // Cap delta so returning to a backgrounded tab does not teleport the piece.
    const dt = Math.min(delta, 0.05)

    group.rotation.y = damp(group.rotation.y, pointer.current.x * 0.26 * parallax, 2.4, dt)
    group.rotation.x = damp(group.rotation.x, pointer.current.y * 0.13 * parallax, 2.4, dt)

    group.rotation.y += dt * 0.06
    group.position.y = Math.sin(performance.now() * 0.00042) * 0.045
  })

  return (
    <>
      <group ref={groupRef}>
        <Model type={piece} grade={grade} />
      </group>

      {/* Without a grounding shadow the piece reads as a sticker on the page */}
      {contactShadow && (
        <ContactShadows
          position={[0, -1.62, 0]}
          opacity={0.26}
          scale={7}
          blur={2.8}
          far={4}
          resolution={tier === 'high' ? 512 : 256}
          color="#6B5B3E"
        />
      )}
    </>
  )
}

export default InteractivePiece
