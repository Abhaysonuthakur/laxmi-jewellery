import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, FormError, FormSuccess, SubmitButton } from '../components/auth/Field'
import { api } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setFormError('')

    try {
      const data = await api.forgotPassword({ email })
      setSent(true)
      // Present only when no mail provider is configured, and only outside
      // production. See server/routes/auth.js.
      setDevResetUrl(data.devResetUrl ?? null)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Check your inbox"
        title="Reset link sent"
        intro="If an account exists for that address, a link to choose a new password is on its way."
        footer={
          <Link to="/login" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-5">
          <FormSuccess>
            The link expires in one hour and can only be used once.
          </FormSuccess>

          {devResetUrl && (
            <div className="border border-line bg-ivory/60 px-4 py-4" style={{ borderRadius: 'var(--radius-facet)' }}>
              <p className="text-[0.6rem] tracking-[0.22em] text-faint uppercase">Development only</p>
              <p className="mt-2 text-[0.8rem] leading-snug text-muted">
                No mail provider is configured, so the link is shown here and printed in the API console.
              </p>
              <a
                href={devResetUrl}
                className="mt-3 inline-block text-[0.8rem] break-all text-gold-deep underline decoration-gold/40 underline-offset-4 hover:text-ink"
              >
                {devResetUrl}
              </a>
            </div>
          )}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Forgot your password?"
      intro="Enter the email address on your account and we will send you a link to choose a new one."
      footer={
        <Link to="/login" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError>{formError}</FormError>

        <Field
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          autoFocus
        />

        <SubmitButton busy={busy} busyLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
