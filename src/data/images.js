/**
 * Centralised image registry.
 *
 * Every <img> / background-image in the project resolves through this file.
 * Swap the real photography in by dropping files into `public/images/` and
 * pointing the key at them — nothing else in the codebase changes.
 *
 * Until a file exists, `MediaFrame` renders an elegant ivory placeholder
 * instead of a broken-image icon. The site never breaks on missing assets.
 */
export const images = {
  // --- Section hero / editorial -------------------------------------------
  hero: '/images/hero-jewellery.webp',
  bridal: '/images/bridal.webp',
  showroom: '/images/showroom.webp',
  heritage: '/images/heritage.webp',
  craft: '/images/craft.webp',

  // --- Collection categories ----------------------------------------------
  necklace: '/images/necklace.webp',
  earrings: '/images/earrings.webp',
  bangles: '/images/bangles.webp',
  ring: '/images/ring.webp',

  // --- Final cinematic ----------------------------------------------------
  final: '/images/final-jewellery.webp',
}

/** Human-readable alt text, kept beside the paths so a11y copy is never forgotten. */
export const imageAlt = {
  hero: 'Handcrafted gold necklace photographed in warm studio light',
  bridal: 'Nepali bridal portrait wearing traditional gold jewellery',
  showroom: 'Interior of the LAXMI JEWELLERY showroom in Matihani, Nepal',
  heritage: 'Mithila-inspired ornamental pattern detail',
  craft: 'Goldsmith shaping a piece of gold jewellery by hand',
  necklace: 'Gold necklace from the LAXMI JEWELLERY collection',
  earrings: 'Gold earrings from the LAXMI JEWELLERY collection',
  bangles: 'Gold bangles from the LAXMI JEWELLERY collection',
  ring: 'Gold ring from the LAXMI JEWELLERY collection',
  final: 'Gold ring resting on ivory silk',
}

export default images
