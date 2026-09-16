/**
 * Site-wide content constants.
 *
 * IMPORTANT — business-data policy:
 * Every value marked `PLACEHOLDER` is intentionally empty. Do NOT invent a
 * phone number, street address, opening hours, price, gold purity,
 * certification, award or social handle. Supply the real values before launch;
 * components render an "available on request" state while they are empty.
 */

export const BRAND = {
  name: 'LAXMI JEWELLERY',
  nameParts: ['LAXMI', 'JEWELLERY'],
  location: 'MATIHANI, NEPAL',
  city: 'Matihani, Nepal',
  tagline: 'Where Tradition Meets Timeless Gold',
}

export const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Collections', href: '#collections' },
  { label: 'Bridal', href: '#bridal' },
  { label: 'Heritage', href: '#heritage' },
  { label: 'Showroom', href: '#showroom' },
]

export const FOOTER_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Collections', href: '#collections' },
  { label: 'Bridal', href: '#bridal' },
  { label: 'Heritage', href: '#heritage' },
  { label: 'Showroom', href: '#showroom' },
  { label: 'Contact', href: '#contact' },
]

/** Collection categories. Order drives both the grid and the horizontal rail. */
export const COLLECTIONS = [
  { id: 'necklaces', title: 'NECKLACES', caption: 'Grace in every detail', imageKey: 'necklace' },
  { id: 'earrings', title: 'EARRINGS', caption: 'Small details, big beauty', imageKey: 'earrings' },
  { id: 'bangles', title: 'BANGLES', caption: 'Tradition on your wrist', imageKey: 'bangles' },
  { id: 'rings', title: 'RINGS', caption: 'A circle of forever', imageKey: 'ring' },
]

/** Section ids — single source of truth for anchors and ScrollTrigger refs. */
export const SECTION_IDS = {
  home: 'home',
  story: 'story',
  statement: 'statement',
  collections: 'collections',
  rail: 'rail',
  bridal: 'bridal',
  ring: 'ring',
  heritage: 'heritage',
  showroom: 'showroom',
  contact: 'contact',
}

/** Not yet supplied by the client — rendered as an honest placeholder. */
export const CONTACT = {
  phone: '', // PLACEHOLDER
  whatsapp: '', // PLACEHOLDER
  email: '', // PLACEHOLDER
  addressLine: '', // PLACEHOLDER — street address
  hours: '', // PLACEHOLDER
  mapUrl: '', // PLACEHOLDER — Google Maps / OpenStreetMap link
  social: [
    { label: 'Instagram', href: '' }, // PLACEHOLDER
    { label: 'Facebook', href: '' }, // PLACEHOLDER
    { label: 'TikTok', href: '' }, // PLACEHOLDER
  ],
}
