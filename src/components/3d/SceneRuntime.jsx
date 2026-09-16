import JewelleryScene from './JewelleryScene'
import { JewelleryLighting } from './JewelleryLighting'
import { InteractivePiece } from './InteractivePiece'
import { HeroStage } from './HeroStage'
import { StoryStage } from './StoryStage'
import { Model } from './Model'
import { FloatingParticles } from './FloatingParticles'

/**
 * The lazy boundary.
 *
 * Everything that touches three.js lives behind this module, so it lands in
 * its own async chunk instead of the initial payload. This file is only ever
 * reached through `React.lazy` in Scene3D.jsx.
 *
 * Declaring scenes by prop rather than by passing JSX children is the whole
 * trick: if a section rendered `<Necklace />` itself, that import would drag
 * three.js back into the main bundle and the split would silently stop
 * working. Props keep the boundary airtight.
 *
 *   <Scene3D piece="ring" particles={120} cameraPosition={[0, 0, 5.4]} />
 *
 * `mode` selects how the piece behaves:
 *
 *   static       — renders and idles. The default.
 *   interactive  — adds cursor-driven rotation on top of the idle motion.
 *   hero         — full scroll choreography: GSAP-driven camera path, piece
 *                  travel, rotation, scale and dissolve (Step 2).
 *   story        — the two-piece scroll story: one camera, a necklace that
 *                  hands off to a bangle, both driven by `channel('story')`
 *                  (Step 3). Takes an extra `secondPiece` prop.
 *
 * `interactive` is kept as a shorthand for `mode="interactive"` so existing
 * call sites did not have to change.
 *
 * `secondPiece` is declared here rather than defaulted inside StoryStage so the
 * scene's whole cast is visible in one place at the call site — and so an
 * invalid key is caught by the same guard as `piece`.
 */
const PIECES = new Set(['necklace', 'ring', 'bangle', 'earrings'])

export default function SceneRuntime({
  piece = 'necklace',
  secondPiece = 'bangle',
  grade,
  mode = 'static',
  interactive = false,
  lighting = true,
  lightingIntensity = 1,
  contactShadow = false,
  particles = 0,
  particleRadius = 6.5,
  particleHeight = 4.4,
  particleOpacity = 0.42,
  particleSize = 0.026,
  cameraPosition = [0, 0, 6],
  fov = 34,
  className = '',
}) {
  const resolvedPiece = PIECES.has(piece) ? piece : 'necklace'
  const resolvedSecondPiece = PIECES.has(secondPiece) ? secondPiece : 'bangle'
  const resolvedMode = interactive && mode === 'static' ? 'interactive' : mode

  return (
    <JewelleryScene className={className} cameraPosition={cameraPosition} fov={fov} fill>
      {lighting && <JewelleryLighting intensity={lightingIntensity} />}

      {resolvedMode === 'hero' ? (
        <HeroStage piece={resolvedPiece} grade={grade} contactShadow={contactShadow} />
      ) : resolvedMode === 'story' ? (
        // No `contactShadow` on purpose — see the note in StoryStage.jsx.
        <StoryStage
          piece={resolvedPiece}
          secondPiece={resolvedSecondPiece}
          grade={grade}
        />
      ) : resolvedMode === 'interactive' ? (
        <InteractivePiece
          piece={resolvedPiece}
          grade={grade}
          contactShadow={contactShadow}
        />
      ) : (
        <Model type={resolvedPiece} grade={grade} />
      )}

      {particles > 0 && (
        <FloatingParticles
          count={particles}
          radius={particleRadius}
          height={particleHeight}
          opacity={particleOpacity}
          size={particleSize}
        />
      )}
    </JewelleryScene>
  )
}
