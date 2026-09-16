import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, FormError, SubmitButton } from '../components/auth/Field'
import { useAuth } from '../auth/AuthProvider'

const MIN_PASSWORD = 8

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})

    /*
     * The confirmation is checked here and only here — the server has no
     * business knowing about a second password field. This is a typo guard, not
     * a security control, which is why it is the one rule not enforced by the API.
     */
    if (password !== confirm) {
      setFieldErrors({ confirm: 'Those passwords do not match.' })
      return
    }

    setBusy(true)

    try {
      await register({ email, password, displayName })
      navigate('/account', { replace: true })
    } catch (error) {
      setFieldErrors(error.fields ?? {})
      if (!error.fields) setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Join us"
      title="Create your account"
      intro="Save the pieces you love and come back to them whenever you like."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError>{formError}</FormError>

        <Field
          name="displayName"
          label="Name"
          value={displayName}
          onChange={setDisplayName}
          error={fieldErrors.displayName}
          autoComplete="name"
          placeholder="How should we address you?"
          hint="Optional."
        />

        <Field
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
        />

        <Field
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
          hint={`At least ${MIN_PASSWORD} characters.`}
        />

        <Field
          name="confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={fieldErrors.confirm}
          autoComplete="new-password"
          required
        />

        <SubmitButton busy={busy} busyLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
