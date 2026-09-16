# 3D model drop-zone

Drop the real assets here with these **exact** filenames and every scene picks
them up automatically. No component edits required.

```
public/models/
  necklace.glb
  ring.glb
  bangle.glb
  earrings.glb
```

## What happens while they are missing

`src/components/3d/Model.jsx` sends a `HEAD` request for each file on first
use. If the file is absent — or the server answers with HTML — the scene
renders a **procedural gold stand-in** built from primitives. The page never
breaks, never shows an empty canvas, and never throws in the console.

Once a real `.glb` is present, the loader takes over with no code change.

## Authoring spec

| Constraint | Target | Why |
|---|---|---|
| Format | `.glb`, Draco-compressed | one request per asset, smallest payload |
| Up axis | Y-up | matches Three.js; no rotation fix-up needed |
| Scale | metres, real-world | a bangle is ~0.07 m, not 1 unit |
| Pivot | centred on the piece | the camera frames the origin |
| Triangles | ≤ 60k per asset | above this, mobile GPUs drop frames |
| File size | ≤ 1.5 MB each | 3D is the last thing we want on the critical path |
| Materials | PBR, `metalness = 1` | gold is a conductor; any diffuse term looks like plastic |

## Materials

The procedural stand-ins use the shared gold recipe in
`src/components/3d/GoldMaterial.jsx` — `metalness: 1`, low roughness, high
`envMapIntensity`. If your exported model ships its own materials, they are
used as-is. To force the site's gold onto imported geometry, pass
`overrideMaterials={false}`… or simply author the material to match:

```
color            #C9A24D
metalness        1.0
roughness        0.16   (polished)  /  0.34 (satin)  /  0.52 (antique)
envMapIntensity  1.55
```

## Lighting

There is no HDR file to match against. `JewelleryLighting.jsx` builds the
environment procedurally from `<Lightformer>` panels, so reflections come from
a local, baked, four-panel studio rig. Model against that, not against a
downloaded HDRI.
