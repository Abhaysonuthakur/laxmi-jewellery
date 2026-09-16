/**
 * 3D model registry.
 *
 * Drop optimised .glb files into `public/models/` with these names and every
 * scene picks them up automatically — no component edits required.
 *
 * If a file is absent, `<Model>` swaps in a procedural gold stand-in so the
 * site renders beautifully instead of crashing or showing an empty canvas.
 *
 * Authoring notes for the modelling team:
 *   - Export Draco-compressed .glb, Y-up, real-world scale in metres.
 *   - Keep each asset under ~1.5 MB and under 60k triangles.
 *   - Centre the pivot on the piece; the camera frames the origin.
 */
export const models = {
  necklace: '/models/necklace.glb',
  ring: '/models/ring.glb',
  bangle: '/models/bangle.glb',
  earrings: '/models/earrings.glb',
}

export default models
