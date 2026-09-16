/**
 * The signed-in user's saved pieces.
 *
 * A provider rather than a hook because two distant components need the same
 * list: the navbar shows a count, the account page shows the items. Two
 * independent copies would drift the moment one of them mutated, and the
 * symptom — a heart that says 2 while the page lists 1 — is exactly the kind of
 * bug that takes an hour to find.
 *
 * The server is the source of truth. Every mutation returns the full updated
 * list, and that response is what gets stored, so the client never has to
 * reconstruct server state by guessing at the effect of its own write.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthProvider'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  /** piece key -> true, for O(1) "is this saved?" checks while rendering. */
  const savedKeys = useMemo(() => new Set(items.map((item) => item.piece)), [items])

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      setStatus('idle')
      return
    }

    setStatus('loading')
    try {
      const data = await api.getWishlist()
      setItems(data.items ?? [])
      setError(null)
    } catch (err) {
      setError(err)
      // A 401 here means the session ended between /me and this call. Clearing
      // the list is right; showing a stale one is not.
      if (err.status === 401) setItems([])
    } finally {
      setStatus('ready')
    }
  }, [isAuthenticated])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(async (piece) => {
    const data = await api.addToWishlist({ piece })
    setItems(data.items ?? [])
    return data.items ?? []
  }, [])

  const remove = useCallback(async (piece) => {
    const data = await api.removeFromWishlist({ piece })
    setItems(data.items ?? [])
    return data.items ?? []
  }, [])

  const toggle = useCallback(
    async (piece) => {
      if (savedKeys.has(piece)) return remove(piece)
      return add(piece)
    },
    [savedKeys, add, remove],
  )

  const value = useMemo(
    () => ({
      items,
      savedKeys,
      count: items.length,
      status,
      error,
      isLoading: status === 'loading',
      isSaved: (piece) => savedKeys.has(piece),
      add,
      remove,
      toggle,
      reload: load,
    }),
    [items, savedKeys, status, error, add, remove, toggle, load],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside a <WishlistProvider>')
  return context
}

export default WishlistProvider
