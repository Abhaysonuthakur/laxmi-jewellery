/**
 * Group-level opacity for R3F.
 *
 * R3F has no `opacity` on a `<group>` — three.js materials own opacity, and a
 * group is just a transform node. So a dissolve has to be pushed onto every
 * mesh underneath it.
 *
 * The naive version of that is a full `traverse()` on every frame, which is
 * wasteful twice over:
 *
 *   1. It walks the tree 60 times a second even when nothing is fading.
 *   2. Setting `material.transparent = true` moves the mesh onto the alpha-
 *      sorted render path, and leaving it there costs sorting work forever
 *      after the fade has finished.
 *
 * So this function tracks whether the group is currently faded in
 * `group.userData`, and does nothing at all when the answer is "no, and it
 * wasn't before either". When a fade completes, every material is restored to
 * `transparent = false` exactly once.
 *
 * It also drives `group.visible`, so a fully transparent piece is skipped by
 * the renderer entirely rather than drawn as nothing.
 */
const FADED_KEY = '__laxmiFaded'

export function setGroupOpacity(group, opacity) {
  if (!group) return

  // Defensive: a NaN here would set every material's opacity to NaN and the
  // piece would vanish with no error anywhere.
  const value = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1

  const isFaded = value < 0.999
  const wasFaded = group.userData[FADED_KEY] === true

  // Fully opaque, and already restored on a previous frame — nothing to do.
  if (!isFaded && !wasFaded) return

  group.traverse((object) => {
    if (!object.isMesh || !object.material) return

    // Materials can be shared between meshes; setting the same values twice is
    // harmless, but a material array (multi-material mesh) has to be handled.
    const materials = Array.isArray(object.material) ? object.material : [object.material]

    for (const material of materials) {
      if (isFaded) {
        material.transparent = true
        material.opacity = value
        // Below roughly half opacity the piece is dissolving rather than
        // standing on anything, so it should stop occluding itself.
        material.depthWrite = value > 0.6
      } else {
        material.opacity = 1
        material.transparent = false
        material.depthWrite = true
      }
    }
  })

  group.userData[FADED_KEY] = isFaded
  group.visible = value > 0.002
}

export default setGroupOpacity
