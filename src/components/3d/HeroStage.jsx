import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Model } from './Model'
import { setGroupOpacity } from './group-opacity'
import { usePointer } from '../../hooks/usePointer'
import { useDeviceTier } from '../../hooks/useDeviceTier'
import { damp, sampleKeyframes } from '../../lib/anim'
import { CHANNELS, channel } from '../../lib/scroll-channels'

/**
 * The hero's scroll-driven camera and piece choreography.
 *
 * Everything here is sampled from one number — `channel('hero').progress` —
 * which the DOM layer writes via GSAP ScrollTrigger. This component knows
 * nothing about the page, the copy, or how tall the section is.
 *
 * ---------------------------------------------------------------------------
 * CAMERA PATH
 * ---------------------------------------------------------------------------
 * Straight from the brief, and kept in its units:
 *
 *   0.00 → [ 0,  0.0, 6.0]
 *   0.25 → [ 1,  0.2, 5.0]
 *   0.50 → [-1,  0.5, 4.5]
 *   0.75 → [ 0, -0.5, 5.0]
 *   1.00 → [ 0,  0.0, 6.0]
 *
 * The camera orbits the origin and returns to where it started, so the
 * sequence is a closed loop rather than a drift — which is what lets the piece
 * stay the subject instead of sliding out of frame.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERYTHING IS DAMPED
 * ---------------------------------------------------------------------------
 * ScrollTrigger's `scrub` already smooths the incoming number, but a single
 * scroll wheel notch still arrives as a step. Damping toward the sampled
 * target each frame with a frame-rate-independent lerp removes that step, and
 * — more importantly — keeps the motion correct when the frame rate collapses.
 * A naive `x += (target - x) * 0.1` moves twice as far per second at 120Hz as
 * at 60Hz; `damp()` does not.
 *
 * ---------------------------------------------------------------------------
 * THE POINTER IS STILL LIVE
 * ---------------------------------------------------------------------------
 * Mouse response from Step 1 is retained but re-weighted: it is now a small
 * offset on top of the scroll path rather than the main event. Combining them
 * additively is what makes the piece feel hand-held while the camera is
 * already moving.
 */

/** Camera keyframes — the brief's path, verbatim. */
const CAMERA_PATH = [
  { at: 0.0, value: [0, 0.0, 6.0] },
  { at: 0.25, value: [1, 0.2, 5.0] },
  { at: 0.5, value: [-1, 0.5, 4.5] },
  { at: 0.75, value: [0, -0.5, 5.0] },
  { at: 1.0, value: [0, 0.0, 6.0] },
]

/**
 * The piece starts right of centre — it sits in the right-hand column on
 * desktop — then travels to the canvas centre by ~22% and stays there so the
 * camera orbit reads as an orbit rather than as two objects drifting past each
 * other. From 55% it lifts and grows, exiting the top of frame.
 */
const PIECE_POSITION = [
  { at: 0.0, value: [0.34, -0.06, 0.0] },
  { at: 0.22, value: [0.0, 0.02, 0.15] },
  { at: 0.55, value: [0.0, 0.16, 0.35] },
  { at: 0.8, value: [0.0, 0.62, 0.65] },
  { at: 1.0, value: [0.0, 1.35, 1.0] },
]

/** Additive yaw on top of the idle spin — about 170 degrees across the scroll. */
const PIECE_SPIN = [
  { at: 0.0, value: -0.22 },
  { at: 0.3, value: 0.35 },
  { at: 0.65, value: 1.55 },
  { at: 1.0, value: 2.75 },
]

const PIECE_SCALE = [
  { at: 0.0, value: 1.0 },
  { at: 0.3, value: 1.09 },
  { at: 0.62, value: 1.18 },
  { at: 0.85, value: 1.3 },
  { at: 1.0, value: 1.44 },
]

/** Holds solid until the lift is underway, then dissolves into the wash. */
const PIECE_FADE = [
  { at: 0.0, value: 1 },
  { at: 0.72, value: 1 },
  { at: 0.88, value: 0.72 },
  { at: 1.0, value: 0 },
]

export function HeroStage({ piece = 'necklace', grade, contactShadow = true }) {
  const groupRef = useRef(null)
  const shadowRef = useRef(null)
  const idleTimeRef = useRef(0)
  const easedPointerRef = useRef({ x: 0, y: 0 })

  const { camera } = useThree()
  const pointer = usePointer()
  const { enablePointerParallax, isSmallScreen, tier } = useDeviceTier()

  // On a phone the canvas is only ~half the width of the desktop one, so the
  // same world-space travel would push the piece off the edge. Scale the
  // horizontal move to the room available.
  const horizontalTravel = isSmallScreen ? 0.34 : 1
  const parallax = enablePointerParallax ? 1 : tier === 'medium' ? 0.4 : 0

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return

    // Cap the step so returning to a backgrounded tab does not teleport the
    // camera and the piece across the scene in one frame.
    const dt = Math.min(delta, 0.05)
    const progress = channel(CHANNELS.hero).progress

    /* ---- Pointer, eased ---------------------------------------------
     * The pointer is the one input that arrives in steps: a fast mouse sweep
     * can move it the full -1 → 1 range between two frames. Applying that
     * straight to a rotation makes the piece snap ~21° in a single frame,
     * which reads as a glitch rather than as interaction. Every other value
     * in this scene is damped; the pointer must be too.
     */
    const eased = easedPointerRef.current
    eased.x = damp(eased.x, pointer.current.x, 3.2, dt)
    eased.y = damp(eased.y, pointer.current.y, 3.2, dt)

    /* ---- Camera ---------------------------------------------------- */
    const [camX, camY, camZ] = sampleKeyframes(CAMERA_PATH, progress)

    camera.position.x = damp(camera.position.x, camX + eased.x * 0.3 * parallax, 3, dt)
    camera.position.y = damp(camera.position.y, camY - eased.y * 0.18 * parallax, 3, dt)
    camera.position.z = damp(camera.position.z, camZ, 3, dt)
    camera.lookAt(0, 0, 0)

    /* ---- Piece ----------------------------------------------------- */
    const [pieceX, pieceY, pieceZ] = sampleKeyframes(PIECE_POSITION, progress)

    group.position.x = damp(group.position.x, pieceX * horizontalTravel, 4, dt)
    group.position.y = damp(group.position.y, pieceY, 4, dt)
    group.position.z = damp(group.position.z, pieceZ, 4, dt)

    /*
     * Idle life is a bounded sway, NOT an accumulating turntable.
     *
     * The obvious `idle += dt * speed` is wrong here, and wrong in a way that
     * is invisible in a screenshot: it makes the piece's pose depend on how
     * long the visitor has been on the page. `PIECE_SPIN` below is an authored
     * absolute track — -0.22 rad at the top of the section through to 2.75 rad
     * at the bottom — so adding unbounded drift on top means the *same* scroll
     * position shows a different angle on every visit, and after a couple of
     * minutes of reading the hero the piece has rotated past edge-on and is
     * presenting itself as a thin sliver.
     *
     * A slow sine keeps the piece alive while guaranteeing it never strays far
     * from the pose the choreography authors: ±0.085 rad, about ±5°, with a
     * ~15 second period. That is enough to catch the light without ever
     * fighting the scroll.
     */
    idleTimeRef.current += dt
    const sway = Math.sin(idleTimeRef.current * 0.42) * 0.085

    group.rotation.y = sway + sampleKeyframes(PIECE_SPIN, progress) + eased.x * 0.2 * parallax
    group.rotation.x = damp(group.rotation.x, eased.y * 0.1 * parallax, 2.4, dt)

    const scale = damp(group.scale.x, sampleKeyframes(PIECE_SCALE, progress), 4, dt)
    group.scale.setScalar(scale)

    /* ---- Fade ------------------------------------------------------
     * The dissolve is delegated to `setGroupOpacity`, which owns the
     * group→material traversal, the "restore the opaque render path once"
     * optimisation and the visibility toggle. The story stage fades two pieces
     * with the same helper, so the two cannot drift apart.
     */
    setGroupOpacity(group, sampleKeyframes(PIECE_FADE, progress))

    /* ---- Grounding shadow ------------------------------------------
     * The piece leaves the ground as it lifts, so the contact shadow has to
     * go before the illusion breaks.
     */
    if (shadowRef.current) {
      shadowRef.current.visible = progress < 0.62
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <Model type={piece} grade={grade} />
      </group>

      {contactShadow && (
        <group ref={shadowRef}>
          <ContactShadows
            position={[0, -1.62, 0]}
            opacity={0.26}
            scale={7}
            blur={2.8}
            far={4}
            resolution={tier === 'high' ? 512 : 256}
            color="#6B5B3E"
          />
        </group>
      )}
    </>
  )
}

export default HeroStage
