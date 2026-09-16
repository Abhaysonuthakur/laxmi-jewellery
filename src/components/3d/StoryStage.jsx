import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Model } from './Model'
import { setGroupOpacity } from './group-opacity'
import { usePointer } from '../../hooks/usePointer'
import { useDeviceTier } from '../../hooks/useDeviceTier'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { clamp, damp, sampleKeyframes } from '../../lib/anim'
import { CHANNELS, channel } from '../../lib/scroll-channels'

/**
 * The story section's scroll choreography — two pieces, one camera, one number.
 *
 * Like `HeroStage`, this component knows nothing about the page: it reads
 * `channel('story').progress`, which the DOM layer drives with GSAP
 * ScrollTrigger, and samples everything else from it.
 *
 * ---------------------------------------------------------------------------
 * THE HANDOFF IS THE POINT
 * ---------------------------------------------------------------------------
 * The story is the only beat on the site with two subjects, and the sequence is
 * built around passing between them:
 *
 *   0.00 - 0.14   the necklace arrives, centred, dropping into frame
 *   0.14 - 0.50   the necklace slides right and turns — the copy sits left
 *   0.50 - 0.66   the handoff: necklace leaves right, bangle enters from left
 *   0.66 - 1.00   the bangle settles left, turns to camera — copy sits right
 *
 * The copy changes sides with the piece rather than sitting in a fixed column,
 * which is what makes the section read as a sequence of shots instead of a
 * paragraph with a model beside it.
 *
 * ---------------------------------------------------------------------------
 * HORIZONTAL PLACEMENT IS A FRACTION, NOT A WORLD UNIT
 * ---------------------------------------------------------------------------
 * The obvious way to put the piece in the right-hand third is `position.x = 1.4`
 * and it is wrong, because how far 1.4 is *on screen* depends entirely on the
 * canvas aspect ratio and the camera distance — both of which change. On a
 * 1440x900 desktop canvas the visible half-width at the origin is roughly 2.4
 * world units; on a 390px-wide phone it is roughly 0.6. The same constant puts
 * the piece comfortably in frame on one and completely off the edge on the
 * other.
 *
 * So the offsets below are **fractions of the visible half-width**, derived
 * live from the camera's actual position and fov inside `useFrame`. `0.62`
 * means "62% of the way to the right edge" at every size and at every point in
 * the camera's push-in. This is the same idea as the hero's `horizontalTravel`,
 * done properly — and the clamp in `limitX` guarantees a piece is never pushed
 * off the edge, whatever shape the canvas is.
 *
 * ---------------------------------------------------------------------------
 * WHY THE CAMERA LOOKS AT THE ORIGIN AND THE PIECE MOVES
 * ---------------------------------------------------------------------------
 * Aiming the camera at the piece would keep it dead centre no matter where it
 * sat, which defeats the composition. The camera keeps its own path and always
 * looks at the origin; the piece is placed off-axis, so it lands off-centre on
 * screen exactly as intended.
 */

/** Camera keyframes — [x, y, z]. A push-in, an orbit, a breath, a second push. */
const CAMERA_PATH = [
  { at: 0.0, value: [0.0, 0.34, 6.6] }, // arrival, wide and slightly high
  { at: 0.16, value: [0.22, 0.12, 5.4] }, // begin the push
  { at: 0.44, value: [-0.34, -0.06, 4.2] }, // closest, orbited left — the inspection
  { at: 0.58, value: [0.0, 0.08, 5.9] }, // pull back — the breath before the handoff
  { at: 0.8, value: [0.36, 0.02, 4.6] }, // push in on the second piece
  { at: 1.0, value: [0.0, 0.14, 5.5] }, // settle, ready for the wash to ivory
]

/* ---- Primary piece (the necklace) ---------------------------------------- */

/**
 * Fractions of the visible half-width.
 *
 * The necklace never travels *through* centre. It enters already in the
 * right-hand third and drifts inward as the camera pushes, which keeps it clear
 * of the left-hand copy column for its entire life — a piece that slid across
 * the middle would pass straight through the paragraph that describes it.
 */
const PRIMARY_X = [
  { at: 0.0, value: 0.72 },
  { at: 0.24, value: 0.6 },
  { at: 0.5, value: 0.66 },
  { at: 0.62, value: 1.15 }, // gone
  { at: 1.0, value: 1.15 },
]

const PRIMARY_Y = [
  { at: 0.0, value: 0.46 }, // held high while the title card owns the frame
  { at: 0.12, value: 0.44 }, // starts to drop as the card leaves
  { at: 0.28, value: 0.0 }, // settled
  { at: 0.5, value: 0.02 },
  { at: 0.62, value: 0.3 },
  { at: 1.0, value: 0.3 },
]

const PRIMARY_Z = [
  { at: 0.0, value: 0.3 },
  { at: 0.3, value: 0.0 },
  { at: 0.62, value: 0.55 },
  { at: 1.0, value: 0.55 },
]

/** Absolute yaw, radians. Roughly 125 degrees across its visible window. */
const PRIMARY_SPIN = [
  { at: 0.0, value: -0.35 },
  { at: 0.3, value: 0.55 },
  { at: 0.5, value: 1.35 },
  { at: 0.62, value: 1.85 },
  { at: 1.0, value: 1.85 },
]

const PRIMARY_SCALE = [
  { at: 0.0, value: 0.86 },
  { at: 0.16, value: 1.0 },
  { at: 0.44, value: 1.12 },
  { at: 0.62, value: 1.06 },
  { at: 1.0, value: 1.06 },
]

/**
 * The piece holds off the frame until the opening title card has cleared.
 *
 * The card is centred and so is the necklace's resting place, so a fade-in
 * starting at 0 would cross-fade two centred subjects and read as a mistake.
 * Holding the piece invisible to 0.12 — exactly when the card finishes leaving
 * — turns the collision into a handover: the card departs, then the subject
 * arrives.
 */
const PRIMARY_FADE = [
  { at: 0.0, value: 0 },
  { at: 0.12, value: 0 },
  { at: 0.24, value: 1 },
  { at: 0.5, value: 1 },
  { at: 0.62, value: 0 },
  { at: 1.0, value: 0 },
]

/* ---- Secondary piece (the bangle) ---------------------------------------- */

const SECONDARY_X = [
  { at: 0.0, value: -1.15 },
  { at: 0.52, value: -1.15 },
  { at: 0.66, value: -0.62 },
  { at: 0.86, value: -0.6 },
  { at: 1.0, value: -0.58 },
]

const SECONDARY_Y = [
  { at: 0.0, value: 0.3 },
  { at: 0.52, value: 0.3 },
  { at: 0.7, value: 0.0 },
  { at: 1.0, value: 0.02 },
]

const SECONDARY_Z = [
  { at: 0.0, value: 0.5 },
  { at: 0.52, value: 0.5 },
  { at: 0.7, value: 0.0 },
  { at: 1.0, value: 0.05 },
]

/** Starts well past edge-on so it turns *into* face-on as it arrives. */
const SECONDARY_SPIN = [
  { at: 0.0, value: -1.6 },
  { at: 0.52, value: -1.2 },
  { at: 0.78, value: 0.35 },
  { at: 1.0, value: 0.62 },
]

/**
 * The bangle's torus is 2.3 world units across against the necklace's 1.8, so
 * at parity of scale the second shot would read as a different, much closer
 * camera rather than a continuation of the same one. These values bring it to
 * roughly 2.0 units — still the bigger, heavier piece, but the same shot.
 */
const SECONDARY_SCALE = [
  { at: 0.0, value: 0.78 },
  { at: 0.52, value: 0.78 },
  { at: 0.72, value: 0.86 },
  { at: 1.0, value: 0.9 },
]

const SECONDARY_FADE = [
  { at: 0.0, value: 0 },
  { at: 0.52, value: 0 },
  { at: 0.66, value: 1 },
  { at: 1.0, value: 1 },
]

/* ---- Framing -------------------------------------------------------------
 *
 * Two constants and one clamp do all the responsive framing, so nothing below
 * has to be re-tuned per breakpoint.
 *
 * `CLOSEST_CAMERA_Z` is the tightest stop in CAMERA_PATH. It is the worst case
 * for cropping, so it is what the distance scale is derived from.
 *
 * `MIN_VISIBLE_WIDTH` is the narrowest frame, in world units, we are willing to
 * show at that stop. Both pieces are roughly two units across, so 2.6 leaves
 * real margin around them.
 *
 * A canvas's *shape* decides how much world space it shows, not its width. At
 * the same camera distance a 1440x900 laptop shows 4.1 world units of width at
 * the closest stop, while a 390x844 phone shows 1.2 — so a piece that sits
 * comfortably in frame on the laptop is cropped to the edges on the phone. The
 * scale below pushes the camera back by exactly the factor needed to restore
 * the floor and no further, which is why a phone ends up seeing the same
 * composition as a desktop rather than a zoomed-in fragment of it.
 *
 * This is why `spread` used to exist and no longer does. Squashing the offsets
 * on small screens was a guess at the symptom; the clamp below fixes the cause
 * and works at every size in between.
 */
const CLOSEST_CAMERA_Z = 4.2
const MIN_VISIBLE_WIDTH = 2.6

/**
 * Rest-pose half-extent of each piece, in world units, used to stop an offset
 * pushing a piece past the frame edge.
 *
 * Measured off the geometry in Model.jsx rather than eyeballed: the necklace
 * arc is a torus of radius 1.0 with a 0.045 tube at 0.9 scale (0.94), the
 * bangle a radius 1.0 with a 0.152 tube (1.15), the ring's stone reaches 1.08,
 * the earring drops span 0.62.
 *
 * These are upper bounds, not estimates. Yaw can only ever *narrow* the
 * projected silhouette of a flat torus, so the rest pose is the widest a piece
 * can ever appear — which is exactly the property a "never crop" clamp needs.
 */
const PIECE_HALF_WIDTH = {
  necklace: 0.95,
  ring: 1.1,
  bangle: 1.16,
  earrings: 0.62,
}

/** Breathing room between a piece's edge and the frame edge, in world units. */
const EDGE_MARGIN = 0.15

/**
 * How much of the frame height the pieces are lifted when the copy sits *below*
 * them rather than beside them.
 *
 * Below 1024px there is no honest way to put a half-frame-wide piece and a
 * column of text side by side, so the section stacks them: copy along the
 * bottom, piece above it. Without this lift the piece sits dead centre and the
 * lower third of it ends up behind the paragraph — the copy is legible over the
 * scrim, but a piece half-hidden behind text reads as a collision rather than a
 * composition. 0.13 of the frame height is what clears the tallest beat
 * ("at the bench", heading + two paragraphs) at 390px.
 *
 * MUST match the `lg:` breakpoint used for the copy in ScrollStory.jsx. The two
 * cannot share a constant — one is a CSS variant, the other a JS media query —
 * so they are written out in both places and this note is the link between
 * them.
 */
const COPY_BESIDE_QUERY = '(min-width: 1024px)'
const COPY_BELOW_LIFT = 0.13

export function StoryStage({ piece = 'necklace', secondPiece = 'bangle', grade }) {
  const primaryRef = useRef(null)
  const secondaryRef = useRef(null)
  const idleTimeRef = useRef(0)
  const easedPointerRef = useRef({ x: 0, y: 0 })
  const firstFrameRef = useRef(true)

  const pointer = usePointer()
  const { enablePointerParallax, tier } = useDeviceTier()
  const copyBeside = useMediaQuery(COPY_BESIDE_QUERY)

  const parallax = enablePointerParallax ? 1 : tier === 'medium' ? 0.4 : 0

  const primaryHalfWidth = PIECE_HALF_WIDTH[piece] ?? PIECE_HALF_WIDTH.necklace
  const secondaryHalfWidth = PIECE_HALF_WIDTH[secondPiece] ?? PIECE_HALF_WIDTH.bangle

  useFrame((state, delta) => {
    const primary = primaryRef.current
    const secondary = secondaryRef.current
    if (!primary || !secondary) return

    // Cap the step so returning to a backgrounded tab does not teleport the
    // camera and both pieces across the scene in one frame.
    const dt = Math.min(delta, 0.05)
    const progress = channel(CHANNELS.story).progress

    const camera = state.camera
    const aspect = state.size.width / state.size.height
    const fovRadians = (camera.fov * Math.PI) / 180

    /* ---- How far back the camera has to sit on this canvas -------------
     * See the framing note above. Derived from the canvas shape and the
     * camera's own fov, so a change to either is picked up for free.
     */
    const closestVisibleWidth =
      2 * Math.tan(fovRadians / 2) * CLOSEST_CAMERA_Z * aspect
    const distanceScale = clamp(MIN_VISIBLE_WIDTH / closestVisibleWidth, 1, 2.6)

    /* ---- Pointer, eased ---------------------------------------------
     * Damped like everything else: a fast mouse sweep can cross the full
     * -1 → 1 range between two frames, and applying that raw makes the piece
     * snap. See the note in HeroStage.
     */
    const eased = easedPointerRef.current
    eased.x = damp(eased.x, pointer.current.x, 3.0, dt)
    eased.y = damp(eased.y, pointer.current.y, 3.0, dt)

    /* ---- Camera ------------------------------------------------------ */
    const [camX, camY, camZ] = sampleKeyframes(CAMERA_PATH, progress)

    const targetX = camX + eased.x * 0.26 * parallax
    const targetY = camY - eased.y * 0.16 * parallax
    const targetZ = camZ * distanceScale

    if (firstFrameRef.current) {
      /*
       * Land on the authored pose instead of damping toward it.
       *
       * The resting distance depends on the canvas shape (`distanceScale`), and
       * the canvas shape is not known until the first frame — so the `camera`
       * prop on <Canvas> is only ever an approximation. Without this the
       * visitor sees the camera glide backward out of that approximation on
       * load, which reads as a mistake rather than as an entrance.
       */
      firstFrameRef.current = false
      camera.position.set(targetX, targetY, targetZ)
    } else {
      camera.position.x = damp(camera.position.x, targetX, 3, dt)
      camera.position.y = damp(camera.position.y, targetY, 3, dt)
      camera.position.z = damp(camera.position.z, targetZ, 3, dt)
    }

    camera.lookAt(0, 0, 0)

    /*
     * How much world space the frame spans *right now*, at the origin.
     *
     * Derived from the live camera rather than read from `state.viewport`.
     * R3F's `viewport` is recomputed on resize, not on a per-frame camera move,
     * so it would describe the camera's starting distance for the whole
     * sequence — and "62% of the way to the right edge" would silently stop
     * meaning 62% of the screen as soon as the push-in began.
     *
     * Using the real distance also means a fraction is a fraction of the
     * *screen*, at every camera stop and every canvas shape, which is the whole
     * point of expressing placement this way.
     */
    const viewDistance = camera.position.length()
    const halfWidth = (Math.tan(fovRadians / 2) * viewDistance * aspect)

    /**
     * The largest offset that still leaves a piece fully inside the frame.
     * Applied to the *magnitude*, so it works for pieces that travel left as
     * well as right without a second constant per direction.
     */
    const limitX = (pieceHalfExtent, scale) =>
      Math.max(0, halfWidth - pieceHalfExtent * scale - EDGE_MARGIN)

    // Lift the pieces clear of the copy when it is stacked underneath them.
    // Expressed as a fraction of the frame height so it holds at every camera
    // distance — the same reasoning as the horizontal offsets.
    const liftY = copyBeside ? 0 : Math.tan(fovRadians / 2) * viewDistance * 2 * COPY_BELOW_LIFT

    /*
     * One bounded sway shared by both pieces.
     *
     * A single elapsed-time clock rather than per-piece counters: the two
     * pieces are never on screen together except during the handoff, and a
     * shared phase means they hand over with the same drift instead of
     * appearing to belong to two different scenes.
     *
     * Bounded, never accumulating — an `idle += dt * speed` turntable would
     * make each piece's pose depend on how long the visitor had been reading,
     * which is exactly the bug that had to be fixed in the hero.
     */
    idleTimeRef.current += dt
    const idle = idleTimeRef.current
    const swayA = Math.sin(idle * 0.38) * 0.075
    const swayB = Math.sin(idle * 0.38 + 1.1) * 0.075

    /* ---- Primary piece ----------------------------------------------- */
    const pScale = damp(primary.scale.x, sampleKeyframes(PRIMARY_SCALE, progress), 3.6, dt)
    const pLimit = limitX(primaryHalfWidth, pScale)
    const pX = clamp(sampleKeyframes(PRIMARY_X, progress) * halfWidth, -pLimit, pLimit)
    const pY = sampleKeyframes(PRIMARY_Y, progress) + liftY
    const pZ = sampleKeyframes(PRIMARY_Z, progress)

    primary.position.x = damp(primary.position.x, pX, 3.6, dt)
    primary.position.y = damp(primary.position.y, pY, 3.6, dt)
    primary.position.z = damp(primary.position.z, pZ, 3.6, dt)

    primary.rotation.y = swayA + sampleKeyframes(PRIMARY_SPIN, progress) + eased.x * 0.18 * parallax
    primary.rotation.x = damp(primary.rotation.x, eased.y * 0.09 * parallax, 2.4, dt)

    primary.scale.setScalar(pScale)

    setGroupOpacity(primary, sampleKeyframes(PRIMARY_FADE, progress))

    /* ---- Secondary piece --------------------------------------------- */
    const sScale = damp(secondary.scale.x, sampleKeyframes(SECONDARY_SCALE, progress), 3.6, dt)
    const sLimit = limitX(secondaryHalfWidth, sScale)
    const sX = clamp(sampleKeyframes(SECONDARY_X, progress) * halfWidth, -sLimit, sLimit)
    const sY = sampleKeyframes(SECONDARY_Y, progress) + liftY
    const sZ = sampleKeyframes(SECONDARY_Z, progress)

    secondary.position.x = damp(secondary.position.x, sX, 3.6, dt)
    secondary.position.y = damp(secondary.position.y, sY, 3.6, dt)
    secondary.position.z = damp(secondary.position.z, sZ, 3.6, dt)

    secondary.rotation.y = swayB + sampleKeyframes(SECONDARY_SPIN, progress) + eased.x * 0.18 * parallax
    secondary.rotation.x = damp(secondary.rotation.x, eased.y * 0.09 * parallax, 2.4, dt)

    secondary.scale.setScalar(sScale)

    setGroupOpacity(secondary, sampleKeyframes(SECONDARY_FADE, progress))
  })

  /*
   * No contact shadows here, deliberately.
   *
   * The hero grounds its piece with one, which is right for a studio shot. The
   * story is a sequence of floating editorial moments, and `ContactShadows`
   * captures everything above it — so during the handoff it would draw two
   * shadows from two pieces at different depths and immediately look wrong.
   * The pieces are meant to read as suspended.
   */
  return (
    <>
      <group ref={primaryRef}>
        <Model type={piece} grade={grade} />
      </group>

      <group ref={secondaryRef}>
        <Model type={secondPiece} grade={grade} />
      </group>
    </>
  )
}

export default StoryStage
