import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Extremely restrained gold dust.
 *
 * Two deliberate choices that keep this from becoming a galaxy:
 *
 *  - NormalBlending, not AdditiveBlending. Additive only brightens, so on an
 *    ivory background it is literally invisible; and when it *is* visible it
 *    reads as a starfield. Normal blending with a slightly darker gold lets
 *    the motes sit *on* the light surface, the way dust does in a sunlit room.
 *
 *  - Slow. The whole cloud drifts at ~0.02 rad/s. Fast particles read as
 *    energy; this site is supposed to read as calm.
 *
 * Count is supplied by the device tier (800 / 300 / 100) and never exceeds the
 * motion budget.
 */
export function FloatingParticles({
  count = 300,
  radius = 7,
  height = 5,
  opacity = 0.42,
  size = 0.026,
  color = '#C9A24D',
  speed = 0.022,
}) {
  const groupRef = useRef(null)
  const pointsRef = useRef(null)

  const geometryArgs = useMemo(() => {
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i += 1) {
      // Square-root radial distribution keeps density even instead of
      // clumping everything at the centre of the disc.
      const r = Math.sqrt(Math.random()) * radius
      const theta = Math.random() * Math.PI * 2

      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * height
      positions[i * 3 + 2] = Math.sin(theta) * r
    }

    return positions
  }, [count, radius, height])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const t = state.clock.elapsedTime
    group.rotation.y += delta * speed

    // Barely-there breathing so the field never looks frozen.
    group.position.y = Math.sin(t * 0.28) * 0.075

    // Subtle counter-drift against the pointer — a half-step of parallax.
    const { x, y } = state.pointer
    group.rotation.x += (y * 0.05 - group.rotation.x) * Math.min(1, delta * 1.4)
    group.rotation.z += (x * 0.03 - group.rotation.z) * Math.min(1, delta * 1.4)
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geometryArgs, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={size}
          sizeAttenuation
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.NormalBlending}
          toneMapped={false}
        />
      </points>
    </group>
  )
}

export default FloatingParticles
