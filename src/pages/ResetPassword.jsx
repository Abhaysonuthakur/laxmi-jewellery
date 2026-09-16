import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import { Field, FormError, SubmitButton } from '../components/auth/Field'
import { api } from '../lib/api'

const MIN_PASSWORD = 8

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  /*
   * A missing token is checked before the form is ever shown. Rendering a
   * password form that is guaranteed to fail on submit is worse than saying so
   * immediately.
   */
  if (!token) {
    return (
      <AuthLayout
        eyebrow="Password help"
        title="That link is incomplete"
        intro="This page needs the full link from your reset email. It may have been truncated by your mail client."
        footer={
          <Link to="/forgot-password" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
            Request a new link
          </Link>
        }
      >
        <FormError>No reset token was found in the address.</FormError>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout
        eyebrow="All set"
        title="Password changed"
        intro="You can now sign in with your new password. Any other devices that were signed in have been signed out."
        footer={
          <Link to="/login" className="text-gold-deep underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink">
            Go to sign in
          </Link>
        }
      >
        <FormError>Not you? Request another reset link and change it again.</FormError>
      </AuthLayout>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})

    if (password !== confirm) {
      setFieldErrors({ confirm: 'Those passwords do not match.' })
      return
    }

    setBusy(true)

    try {
      await api.resetPassword({ token, password })
      setDone(true)
    } catch (error) {
      setFieldErrors(error.fields ?? {})
      if (!error.fields) setFormError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Choose a new password"
      intro="Pick something you have not used here before."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormError>{formError}</FormError>

        <Field
          name="password"
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          required
          autoFocus
          hint={`At least ${MIN_PASSWORD} characters.`}
        />

        <Field
          name="confirm"
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={fieldErrors.confirm}
          autoComplete="new-password"
          required
        />

        <SubmitButton busy={busy} busyLabel="Saving…">
          Change password
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
