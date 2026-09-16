import { useEffect, useState } from 'react'
import { AuthBackdrop, AuthHeader } from '../components/auth/AuthLayout'
import { FormError } from '../components/auth/Field'
import { api } from '../lib/api'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function Stat({ label, value }) {
  return (
    <div className="border border-line bg-cream px-5 py-4" style={{ borderRadius: 'var(--radius-facet)' }}>
      <p className="text-[0.58rem] tracking-[0.24em] text-faint uppercase">{label}</p>
      <p className="font-display mt-2 text-[1.9rem] leading-none text-ink">{value}</p>
    </div>
  )
}

/**
 * Staff dashboard.
 *
 * Read-only, and intentionally so: the API exposes no mutation endpoint here, so
 * there is nothing for this page to offer beyond looking. Anything that can
 * delete an account should be built with an audit trail, and that is a decision
 * for the showroom rather than a side effect of adding a login form.
 */
export default function Admin() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .adminUsers()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-dvh bg-ivory">
      <AuthBackdrop />
      <AuthHeader />

      <main className="relative z-10 pb-28">
        <div className="shell">
          <div className="pt-6 md:pt-10">
            <p className="eyebrow text-[0.6rem] text-gold-deep">Staff</p>
            <h1 className="font-display mt-4 text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] font-light text-ink">
              Registered accounts
            </h1>
            <p className="mt-4 max-w-[56ch] text-[0.86rem] leading-relaxed text-muted">
              Everyone who has created an account on the site. Read-only — no password, session or reset token is
              exposed here, by design.
            </p>
          </div>

          {error && (
            <div className="mt-9 max-w-[36rem]">
              <FormError>{error}</FormError>
            </div>
          )}

          {loading && !data && !error && <p className="mt-12 text-[0.84rem] text-faint">Loading…</p>}

          {data && (
            <>
              <div className="mt-10 grid grid-cols-2 gap-4 sm:max-w-[26rem]">
                <Stat label="Accounts" value={data.counts?.users ?? 0} />
                <Stat label="Admins" value={data.counts?.admins ?? 0} />
              </div>

              <div className="mt-10 overflow-x-auto border border-line bg-cream" style={{ borderRadius: 'var(--radius-facet)' }}>
                <table className="w-full min-w-[42rem] border-collapse text-left">
                  <caption className="sr-only">Registered accounts</caption>
                  <thead>
                    <tr className="border-b border-line">
                      {['Email', 'Name', 'Role', 'Saved', 'Sessions', 'Joined'].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-5 py-4 text-[0.56rem] tracking-[0.24em] text-faint uppercase"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-4 text-[0.84rem] text-ink">{user.email}</td>
                        <td className="px-5 py-4 text-[0.84rem] text-muted">{user.displayName || '—'}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block border px-2.5 py-1 text-[0.54rem] tracking-[0.2em] uppercase ${
                              user.role === 'admin'
                                ? 'border-[color-mix(in_srgb,var(--color-gold)_55%,transparent)] text-gold-deep'
                                : 'border-line text-muted'
                            }`}
                            style={{ borderRadius: 'var(--radius-facet)' }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[0.84rem] text-muted tabular-nums">{user.wishlistCount}</td>
                        <td className="px-5 py-4 text-[0.84rem] text-muted tabular-nums">{user.activeSessions}</td>
                        <td className="px-5 py-4 text-[0.84rem] text-faint">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
