import { Link } from 'react-router-dom'
import { AuthBackdrop, AuthHeader } from '../components/auth/AuthLayout'

export default function NotFound() {
  return (
    <div className="relative min-h-dvh bg-ivory">
      <AuthBackdrop />
      <AuthHeader />

      <main className="relative z-10 grid place-items-center pb-28">
        <div className="shell">
          <div className="mx-auto max-w-[34rem] pt-16 text-center md:pt-28">
            <p className="eyebrow text-[0.6rem] text-gold-deep">404</p>

            <h1 className="font-display mt-5 text-[clamp(2rem,6.5vw,3.75rem)] leading-[1.02] font-light text-ink">
              This page is not here
            </h1>

            <p className="mx-auto mt-5 max-w-[42ch] text-[0.9rem] leading-relaxed text-muted">
              The address may have been mistyped, or the link that brought you here may be out of date.
            </p>

            <div className="gold-rule mt-9 mb-9 opacity-60" />

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="border border-gold bg-gold px-6 py-3.5 text-[0.64rem] tracking-[0.26em] text-cream uppercase transition-colors duration-500 hover:bg-gold-deep"
                style={{ borderRadius: 'var(--radius-facet)' }}
              >
                Back to the collection
              </Link>

              <Link
                to="/account"
                className="border border-line px-6 py-3.5 text-[0.64rem] tracking-[0.26em] text-muted uppercase transition-colors duration-500 hover:border-gold hover:text-ink"
                style={{ borderRadius: 'var(--radius-facet)' }}
              >
                Your account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
