/**
 * The piece catalogue, as the UI needs it.
 *
 * The authoritative list of valid piece keys lives in `models.js` — that is what
 * the API validates wishlist entries against. This file only adds the
 * presentation layer on top (title, caption, image), and derives those from
 * `COLLECTIONS` rather than restating them, so the account page cannot drift
 * from the collection grid.
 *
 * The explicit map below exists because the two registries name things
 * differently: a model is singular (`bangle`), a collection is plural
 * (`bangles`). Rather than paper over that with a string operation that would
 * break on the next irregular noun, the correspondence is written down — and
 * checked at module load, so a mismatch fails immediately in development
 * instead of silently rendering an empty card.
 */
import { models } from './models'
import { COLLECTIONS } from './site'

const COLLECTION_FOR_PIECE = {
  necklace: 'necklaces',
  earrings: 'earrings',
  bangle: 'bangles',
  ring: 'rings',
}

export const PIECE_KEYS = Object.keys(models)

export const PIECES = PIECE_KEYS.map((key) => {
  const collectionId = COLLECTION_FOR_PIECE[key]
  const collection = COLLECTIONS.find((entry) => entry.id === collectionId)

  if (!collection) {
    throw new Error(
      `pieces.js: piece "${key}" maps to collection "${collectionId}", which does not exist in COLLECTIONS.`,
    )
  }

  return {
    key,
    title: collection.title,
    caption: collection.caption,
    imageKey: collection.imageKey,
  }
})

const BY_KEY = new Map(PIECES.map((piece) => [piece.key, piece]))

export function getPiece(key) {
  return BY_KEY.get(key) ?? null
}

/** Title for a key, falling back to the raw key so an unknown value still renders. */
export function pieceTitle(key) {
  return BY_KEY.get(key)?.title ?? key
}

export default PIECES
