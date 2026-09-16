import { Component, Suspense, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { models } from '../../data/models'
import { GoldMaterial } from './GoldMaterial'

/* ---------------------------------------------------------------------------
   Asset existence probe
   ---------------------------------------------------------------------------
   The .glb files are not authored yet. Rather than let GLTFLoader fire a
   request that 404s (or worse, gets the SPA fallback HTML and throws a parse
   error deep inside three), we ask the server once whether the file is really
   there. Result is cached per URL for the session.

   A response only counts as a model if it is 2xx AND is not HTML — this is
   what protects us when a host rewrites unknown paths to index.html.
--------------------------------------------------------------------------- */
const probeCache = new Map()

function useAssetExists(url) {
  const [state, setState] = useState(() => (probeCache.has(url) ? probeCache.get(url) : 'checking'))

  useEffect(() => {
    if (!url) {
      setState('missing')
      return undefined
    }

    if (probeCache.has(url)) {
      setState(probeCache.get(url))
      return undefined
    }

    const controller = new AbortController()

    fetch(url, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        const type = response.headers.get('content-type') || ''
        const ok = response.ok && !type.includes('text/html')
        probeCache.set(url, ok ? 'present' : 'missing')
        setState(ok ? 'present' : 'missing')
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        probeCache.set(url, 'missing')
        setState('missing')
      })

    return () => controller.abort()
  }, [url])

  return state
}

/* ---------------------------------------------------------------------------
   Error boundary — last line of defence
   ---------------------------------------------------------------------------
   If a file exists but is corrupt, GLTFLoader rejects during render and React
   throws. Without this the whole page unmounts to a blank ivory screen.
--------------------------------------------------------------------------- */
class ModelBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // Kept as a warning rather than an error: a missing model is an expected
    // state during development, not an incident.
    console.warn('[LAXMI] 3D model failed to load, using procedural stand-in.', error?.message)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

/* ---------------------------------------------------------------------------
   Procedural gold stand-ins
   ---------------------------------------------------------------------------
   These are deliberately simple, low-poly and honestly fake. They exist so the
   page reads as a jewellery site before the real assets land — not to imitate
   a finished product render.

   Triangle budget stays under ~12k for the whole set.
--------------------------------------------------------------------------- */

function GemMaterial({ color = '#F7F2EA' }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.12}
      roughness={0.04}
      clearcoat={1}
      clearcoatRoughness={0.02}
      envMapIntensity={2.4}
    />
  )
}

/**
 * A necklace has to be authored in the XY plane and then rotated, not built
 * lying flat.
 *
 * `torusGeometry` draws its ring around the Z axis — i.e. facing the camera.
 * The first version rotated it by PI/2 on X, which laid it flat in the XZ
 * plane; viewed head-on from +Z that projects to a horizontal gold bar. It
 * looked like a mistake because it was one.
 *
 * So: build the arc facing the camera, then rotate the whole assembly around Z
 * to drop the arc to the bottom of the circle, where a necklace actually
 * hangs. The pendant is parented outside that rotation so it stays upright.
 */
function NecklaceForm({ grade = 'polished' }) {
  const ARC = Math.PI * 1.06
  const RADIUS = 1.0
  const links = 24

  return (
    /**
     * The assembly is offset upward so its visual centre sits on the origin.
     * A hanging necklace is bottom-heavy: the arc runs from y = -1.0 to +0.09
     * and the pendant reaches -1.35, so the centroid is at about -0.63. Left
     * uncorrected the piece renders low in frame and clips off the bottom of
     * short viewports. Real .glb assets are authored with a centred pivot, so
     * the stand-in has to match that contract.
     */
    <group position={[0, 0.63, 0]} scale={0.9}>
      <group rotation={[0, 0, Math.PI * 0.97]}>
        {/* Chain */}
        <mesh>
          <torusGeometry args={[RADIUS, 0.045, 14, 128, ARC]} />
          <GoldMaterial grade={grade} />
        </mesh>

        {/* Graduated beads — heaviest at the front of the drape */}
        {Array.from({ length: links }).map((_, index) => {
          const t = links === 1 ? 0 : index / (links - 1)
          const angle = t * ARC
          const size = 0.038 + Math.sin(t * Math.PI) * 0.034
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0]}
            >
              <sphereGeometry args={[size, 12, 12]} />
              <GoldMaterial grade={grade} roughness={0.2} />
            </mesh>
          )
        })}
      </group>

      {/* Pendant — hangs from the lowest point of the arc, always upright */}
      <group position={[0, -RADIUS - 0.02, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.26, 6]} />
          <GoldMaterial grade={grade} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <octahedronGeometry args={[0.075, 0]} />
          <GemMaterial />
        </mesh>
      </group>
    </group>
  )
}

function RingForm({ grade = 'polished' }) {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.72, 0.075, 20, 96]} />
        <GoldMaterial grade={grade} />
      </mesh>
      {/* Setting */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.16, 8]} />
        <GoldMaterial grade={grade} roughness={0.24} />
      </mesh>
      {/* Stone */}
      <mesh position={[0, 0.93, 0]}>
        <octahedronGeometry args={[0.15, 1]} />
        <GemMaterial />
      </mesh>
    </group>
  )
}

function BangleForm({ grade = 'satin' }) {
  // Tilted back ~65 degrees: the classic bangle product shot, showing the
  // opening and enough of the band to read the thickness.
  return (
    <group rotation={[-1.15, 0, 0.18]}>
      <mesh>
        <torusGeometry args={[1, 0.14, 24, 128]} />
        <GoldMaterial grade={grade} />
      </mesh>
      {/* Engraved band detail — sits proud of the main band */}
      <mesh>
        <torusGeometry args={[1, 0.152, 8, 128]} />
        <GoldMaterial grade="antique" roughness={0.62} />
      </mesh>
    </group>
  )
}

function EarringsForm({ grade = 'polished' }) {
  const drop = (side) => (
    <group position={[side * 0.42, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[0.14, 0.035, 14, 48]} />
        <GoldMaterial grade={grade} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <GoldMaterial grade={grade} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <coneGeometry args={[0.14, 0.34, 6]} />
        <GoldMaterial grade={grade} />
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <octahedronGeometry args={[0.07, 0]} />
        <GemMaterial />
      </mesh>
    </group>
  )

  return (
    <group>
      {drop(-1)}
      {drop(1)}
    </group>
  )
}

const FORMS = {
  necklace: NecklaceForm,
  ring: RingForm,
  bangle: BangleForm,
  earrings: EarringsForm,
}

export function ProceduralGold({ type = 'necklace', grade, ...props }) {
  const Form = FORMS[type] || NecklaceForm
  return (
    <group {...props}>
      <Form grade={grade} />
    </group>
  )
}

/* ---------------------------------------------------------------------------
   Loaded .glb
--------------------------------------------------------------------------- */
function GltfModel({ url, grade, overrideMaterials = true, ...props }) {
  const { scene } = useGLTF(url)

  // Make sure imported meshes participate in the lighting rig. Materials are
  // left alone by default — authored PBR maps beat anything we can guess at.
  if (overrideMaterials) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  return <primitive object={scene} {...props} />
}

/**
 * Public API.
 *
 *   <Model type="necklace" />
 *
 * Renders the real .glb when `public/models/necklace.glb` exists, and a
 * procedural gold stand-in when it does not. The caller never has to care.
 */
export function Model({ type = 'necklace', grade, fallbackProps, ...props }) {
  const url = models[type]
  const status = useAssetExists(url)

  const fallback = <ProceduralGold type={type} grade={grade} {...fallbackProps} />

  if (status !== 'present') return fallback

  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfModel url={url} grade={grade} {...props} />
      </Suspense>
    </ModelBoundary>
  )
}

export default Model
