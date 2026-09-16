/**
 * Route guards.
 *
 * Both guards wait for `status !== 'checking'` before deciding. Without that,
 * the first render of a protected page happens while /me is still in flight, the
 * user is momentarily null, and a signed-in visitor gets bounced to the login
 * page on every refresh — the classic flash that makes people think a site
 * logged them out.
 *
 * `RequireAuth` also carries the intended destination through as `?next=`, so
 * signing in lands where the user was actually going.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function Checking() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ivory" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-gold)_45%,transparent)]">
          <span className="font-display text-[1.15rem] leading-none text-ink">L</span>
        </span>
        <span className="eyebrow text-[0.55rem] text-faint">One moment</span>
      </div>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Checking />
  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return children
}

export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) return <Checking />
  if (!isAuthenticated) return <Navigate to="/login?next=%2Fadmin" replace />
  if (!isAdmin) return <Navigate to="/account" replace />

  return children
}

/** For login/register: a signed-in visitor has no business seeing these. */
export function RedirectIfAuthenticated({ children, to = '/account' }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Checking />
  if (isAuthenticated) return <Navigate to={to} replace />

  return children
}

export default { RequireAuth, RequireAdmin, RedirectIfAuthenticated }
