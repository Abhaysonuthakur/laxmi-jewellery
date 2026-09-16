/**
 * Authentication state.
 *
 * One provider owns the current user, and everything else reads it. There is no
 * copy of the user in any component's local state — two copies of "am I logged
 * in" is the classic source of a navbar that disagrees with the page under it.
 *
 * The session itself lives in an httpOnly cookie, so JavaScript cannot read it
 * and this provider never sees a token. It only ever knows what `GET /me`
 * returns. That is the whole point: an XSS bug cannot steal a session it cannot
 * read.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  /** 'checking' until the first /me resolves, so guards don't flash a login page. */
  const [status, setStatus] = useState('checking')

  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  /**
   * Ask the server who we are.
   *
   * A 401 here is the ordinary "not signed in" answer, not an error — treating
   * it as one would put an error banner on every anonymous visit.
   */
  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api.me()
      if (mounted.current) setUser(me)
      return me
    } catch (error) {
      if (mounted.current) setUser(null)
      if (error.status !== 401 && error.status !== 0) {
        console.warn('[auth] session check failed:', error.message)
      }
      return null
    } finally {
      if (mounted.current) setStatus('ready')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (credentials) => {
    const { user: me } = await api.login(credentials)
    setUser(me)
    setStatus('ready')
    return me
  }, [])

  const register = useCallback(async (details) => {
    const { user: me } = await api.register(details)
    setUser(me)
    setStatus('ready')
    return me
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      // Clear locally even if the request failed. The server-side row is what
      // actually matters, and leaving a stale user in memory after the user
      // asked to sign out is the worse failure.
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (details) => {
    const { user: me } = await api.updateProfile(details)
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isLoading: status === 'checking',
      login,
      register,
      logout,
      updateProfile,
      refresh,
      setUser,
    }),
    [user, status, login, register, logout, updateProfile, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>')
  return context
}

export default AuthProvider
