# Image drop-zone

Every photograph on the site resolves through **one** file:
`src/data/images.js`. Nothing hardcodes a path.

## Files to supply

| Filename | Used by | Suggested ratio | Notes |
|---|---|---|---|
| `hero-jewellery.webp` | Hero | 4:5 | optional — the hero uses live 3D |
| `bridal.webp` | Bridal | 16:9 | editorial, real client photography only |
| `showroom.webp` | Showroom | 21:9 | wide interior shot |
| `heritage.webp` | Heritage | 4:3 | Mithila detail / craft context |
| `craft.webp` | reserved | 4:3 | goldsmith at the bench |
| `necklace.webp` | Collection + rail | 4:5 | one piece, plain background |
| `earrings.webp` | Collection + rail | 4:5 | " |
| `bangles.webp` | Collection + rail | 4:5 | " |
| `ring.webp` | Collection + rail | 4:5 | " |
| `final-jewellery.webp` | reserved | 4:5 | closing frame |

## While they are missing

`src/components/ui/MediaFrame.jsx` renders a reserved ivory plate with a gold
hairline and the slot name. No broken-image icons, and — importantly — the
`aspect-ratio` is always set, so dropping the real files in causes **zero
layout shift** and does not disturb any ScrollTrigger measurements.

## Rules

- **WebP only.** Fall back to JPEG only if a source image cannot be converted.
- Target **≤ 250 KB** for full-bleed images, **≤ 120 KB** for cards.
- Longest edge: 2400 px for full-bleed, 1200 px for cards. No more.
- Never reference a remote URL. All photography ships from this folder so the
  site has no third-party runtime dependency and no privacy surface.

## No invented photography

Do not substitute stock or AI-generated imagery for the bridal and showroom
shots. Those two sections make implicit claims about a real place and real
customers; placeholder photography there is a brand risk, not a time-saver.
