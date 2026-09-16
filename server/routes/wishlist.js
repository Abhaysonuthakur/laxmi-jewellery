/**
 * Wishlist routes.
 *
 * Every route here is scoped to `req.user.id`, taken from the session — never
 * from the request body or a query parameter. A wishlist endpoint that accepts
 * a user id from the client is an endpoint that lets anyone read and edit
 * anyone else's list, and it is the single easiest mistake to make in this file.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { PIECE_KEYS, isPieceKey } from '../lib/pieces.js'
import { requireAuth } from '../middleware/auth.js'

export const wishlistRouter = Router()

const selectItems = db.prepare(`
  SELECT piece, created_at
  FROM wishlist_items
  WHERE user_id = ?
  ORDER BY created_at ASC, piece ASC
`)

/**
 * `ON CONFLICT DO NOTHING` makes adding a piece twice a no-op in the database
 * rather than something the route has to check first — which also removes the
 * race between checking and inserting.
 */
const insertItem = db.prepare(`
  INSERT INTO wishlist_items (user_id, piece)
  VALUES (?, ?)
  ON CONFLICT(user_id, piece) DO NOTHING
`)

const deleteItem = db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND piece = ?')

function listFor(userId) {
  return selectItems.all(userId).map((row) => ({ piece: row.piece, addedAt: row.created_at }))
}

wishlistRouter.use(requireAuth)

wishlistRouter.get('/', (req, res) => {
  res.json({ items: listFor(req.user.id), catalogue: PIECE_KEYS })
})

wishlistRouter.post('/', (req, res) => {
  const piece = req.body?.piece

  // The wishlist table has no foreign key to the catalogue, so this check is
  // the only thing standing between the database and arbitrary client strings.
  if (!isPieceKey(piece)) {
    return res.status(400).json({
      error: 'unknown_piece',
      message: `"${String(piece).slice(0, 40)}" is not a piece in the catalogue.`,
      catalogue: PIECE_KEYS,
    })
  }

  insertItem.run(req.user.id, piece)

  return res.status(201).json({ items: listFor(req.user.id) })
})

wishlistRouter.delete('/:piece', (req, res) => {
  const { piece } = req.params

  if (!isPieceKey(piece)) {
    return res.status(400).json({ error: 'unknown_piece', message: 'Not a piece in the catalogue.' })
  }

  deleteItem.run(req.user.id, piece)

  return res.json({ items: listFor(req.user.id) })
})

export default wishlistRouter
