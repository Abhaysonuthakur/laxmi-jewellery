import { Environment, Lightformer } from '@react-three/drei'

/**
 * Studio product lighting for metal.
 *
 * Gold is 90% reflection — it has almost no diffuse response, so a scene lit
 * only by point lights renders as flat yellow plastic. What actually sells
 * metal is the *environment*: big, soft, bright shapes that the surface can
 * mirror. That is what this rig builds.
 *
 * The environment is generated locally from `<Lightformer>` geometry rather
 * than loaded from a hosted HDR file, which means:
 *   - no third-party CDN dependency at runtime,
 *   - no 1-3 MB HDR download before the hero renders,
 *   - and it bakes once (`frames={1}`) instead of every frame.
 *
 * Layout mirrors a real jewellery shoot: one large soft key above and slightly
 * forward, a broad fill from the left, a narrow rim behind to catch the
 * silhouette, and a low bounce card beneath.
 */
export function JewelleryLighting({ intensity = 1 }) {
  return (
    <>
      {/* Ambient base — keeps the shadow side readable without lifting blacks */}
      <ambientLight intensity={0.42 * intensity} color="#FFF7EA" />

      {/* Key — warm, high, front-right */}
      <directionalLight
        position={[4.2, 6.4, 4.5]}
        intensity={1.5 * intensity}
        color="#FFF3DE"
      />

      {/* Fill — cool-neutral, opposite side, weaker */}
      <directionalLight
        position={[-5, 1.6, 2.4]}
        intensity={0.42 * intensity}
        color="#F3EEFF"
      />

      {/* Rim — behind, to draw a bright edge along the metal */}
      <directionalLight position={[-1.4, 3, -5.5]} intensity={0.7 * intensity} color="#FFE7C4" />

      {/* Tight specular kicker for the small facet highlights */}
      <spotLight
        position={[0, 5.5, 2.6]}
        angle={0.55}
        penumbra={1}
        intensity={9 * intensity}
        distance={16}
        decay={2}
        color="#FFFFFF"
      />

      {/* Baked environment — the part that makes metal read as metal */}
      <Environment resolution={256} frames={1} background={false}>
        {/* Softbox directly above */}
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#FFFBF2"
          position={[0, 4.6, 0.6]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[9, 9, 1]}
        />
        {/* Key softbox, front-right */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#FFFFFF"
          position={[3.6, 1.4, 3.4]}
          rotation={[0, -Math.PI / 3.2, 0]}
          scale={[5, 6, 1]}
        />
        {/* Fill panel, left */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#FFEFD8"
          position={[-4.4, 0.6, 1.6]}
          rotation={[0, Math.PI / 2.6, 0]}
          scale={[4.5, 5.5, 1]}
        />
        {/* Rim strip, behind */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#FFF2DC"
          position={[0, 1.2, -4.8]}
          rotation={[0, Math.PI, 0]}
          scale={[7, 1.6, 1]}
        />
        {/* Warm bounce from the ivory floor — subtle, kills dead underlighting */}
        <Lightformer
          form="circle"
          intensity={1.1}
          color="#F6E7C8"
          position={[0, -2.6, 0.8]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6, 6, 1]}
        />
      </Environment>
    </>
  )
}

export default JewelleryLighting
