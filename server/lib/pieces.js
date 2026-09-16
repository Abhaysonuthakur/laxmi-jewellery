/**
 * The catalogue of pieces a wishlist entry may refer to.
 *
 * Imported straight from the frontend's model registry rather than duplicated
 * here, because a second hard-coded list is a list that silently drifts out of
 * sync. `src/data/models.js` is plain ESM with no JSX and no Vite-only syntax,
 * so Node can load it directly.
 *
 * CONSTRAINT: that file must stay importable by bare Node. If it ever grows a
 * Vite-only import (`?raw`, an asset URL, an alias), this is the file that
 * breaks — and it will break on boot, loudly, which is the right failure.
 */
import { models } from '../../src/data/models.js'

/** ['necklace', 'ring', 'bangle', 'earrings'] */
export const PIECE_KEYS = Object.freeze(Object.keys(models))

const VALID = new Set(PIECE_KEYS)

/**
 * Validate a piece key.
 *
 * This matters more than it looks: without it, `piece` is an arbitrary
 * user-supplied string that lands in the database. The wishlist table has no
 * foreign key to the catalogue, so this function *is* the constraint.
 */
export function isPieceKey(value) {
  return typeof value === 'string' && VALID.has(value)
}

export default PIECE_KEYS
