/**
 * Staff routes.
 *
 * Read-only for now, and deliberately so. There is no "delete user" or "change
 * role" endpoint because there is no UI for one and an unused destructive
 * endpoint is pure liability. When the showroom actually needs one, it gets
 * built with the audit trail it will need anyway.
 *
 * Note what the user list contains: no password hashes, no session tokens, no
 * reset tokens. An admin can see that an account exists and what it is called,
 * which is what they need, and nothing that would let them become that account.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { listUsers, userCounts } from '../lib/users.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminRouter = Router()

const selectWishlistCounts = db.prepare(`
  SELECT u.id AS user_id, COUNT(w.piece) AS n
  FROM users u
  LEFT JOIN wishlist_items w ON w.user_id = u.id
  GROUP BY u.id
`)

const selectActiveSessions = db.prepare(`
  SELECT user_id, COUNT(*) AS n
  FROM sessions
  WHERE expires_at > ?
  GROUP BY user_id
`)

adminRouter.use(requireAdmin)

adminRouter.get('/users', (_req, res) => {
  const now = new Date().toISOString()

  const wishlist = new Map(selectWishlistCounts.all().map((r) => [r.user_id, r.n]))
  const sessions = new Map(selectActiveSessions.all(now).map((r) => [r.user_id, r.n]))

  const users = listUsers().map((user) => ({
    ...user,
    wishlistCount: wishlist.get(user.id) ?? 0,
    activeSessions: sessions.get(user.id) ?? 0,
  }))

  return res.json({ users, counts: userCounts() })
})

export default adminRouter
