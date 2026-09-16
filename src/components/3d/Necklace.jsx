import { Model } from './Model'

/**
 * Necklace — the hero piece.
 * Thin wrapper so sections never import the generic <Model> directly and the
 * per-piece art direction (grade, scale, tilt) lives in exactly one place.
 */
export function Necklace({ grade = 'polished', ...props }) {
  return <Model type="necklace" grade={grade} {...props} />
}

export default Necklace
