/**
 * Physically-based gold.
 *
 * The recipe that keeps it from looking like yellow plastic:
 *   metalness 1        — gold is a conductor; any diffuse term is wrong
 *   roughness 0.16-0.26 — low enough to mirror the softboxes, high enough
 *                         to avoid a chrome-ball look
 *   envMapIntensity     — the single most important dial. Too low and the
 *                         metal goes dark and muddy; too high and it blows out.
 *
 * Three surface grades, because a necklace, a bangle and a ring are not
 * finished the same way in a real workshop.
 */

export const GOLD_TONES = {
  /** Polished, high-karat display finish — hero pieces. */
  polished: {
    color: '#C9A24D',
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.55,
    reflectivity: 1,
  },
  /** Satin / brushed — everyday wear. */
  satin: {
    color: '#C39A46',
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: 1.25,
    reflectivity: 1,
  },
  /** Antique / matte — heritage and bridal work. */
  antique: {
    color: '#B08A3C',
    metalness: 1,
    roughness: 0.52,
    envMapIntensity: 1.0,
    reflectivity: 1,
  },
}

/** Props object for a <meshPhysicalMaterial>. Spread onto any mesh. */
export function goldProps(grade = 'polished', overrides = {}) {
  const tone = GOLD_TONES[grade] || GOLD_TONES.polished
  return {
    ...tone,
    ...overrides,
  }
}

/**
 * Drop-in gold material. Use as `<GoldMaterial grade="polished" />` inside a mesh.
 */
export function GoldMaterial({ grade = 'polished', ...overrides }) {
  return <meshPhysicalMaterial {...goldProps(grade, overrides)} />
}

export default GoldMaterial
