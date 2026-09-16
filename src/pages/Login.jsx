import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, FormError, SubmitButton } from '../components/auth/Field'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  /** Only ever a path we generated, so an attacker cannot redirect off-site. */
  const rawNext = params.get('next') || '/account'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account'

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    setFieldErrors({})

    try {
      await login({ email, password })
      navigate(next, { replace: true })
    } catch (error) {
      setFieldErrors(error.fields ?? {})
      // Wrong credentials is a request-level failure with no field to attach to.
      if (!error.fields) setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      intro="Your saved pieces, on every device you use."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
            Create an account
          </Link>
        </>
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
          error={fieldErrors.email}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          autoFocus
        />

        <Field
          name="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        <div className="-mt-1 text-right">
          <Link
            to="/forgot-password"
            className="text-[0.78rem] text-muted transition-colors duration-300 hover:text-gold-deep"
          >
            Forgot your password?
          </Link>
        </div>

        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
