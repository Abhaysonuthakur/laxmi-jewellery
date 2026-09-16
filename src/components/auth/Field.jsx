/**
 * Form primitives.
 *
 * The accessibility wiring is the reason these exist rather than raw <input>s.
 * Every field needs a stable id, a <label for>, `aria-invalid` when it is wrong,
 * and `aria-describedby` pointing at the message — and forgetting any one of
 * those in one of five forms is how a site ends up unusable with a screen
 * reader. Written once here, they cannot be forgotten.
 */
import { useId } from 'react'

export function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required = false,
  placeholder,
  name,
  disabled = false,
  inputMode,
  minLength,
  maxLength,
  autoFocus = false,
}) {
  const reactId = useId()
  const id = `field-${name ?? reactId}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[0.62rem] tracking-[0.24em] text-muted uppercase">
        {label}
        {required && (
          <span className="ml-1 text-gold-deep" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        inputMode={inputMode}
        minLength={minLength}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`w-full border bg-ivory/60 px-4 py-3 text-[0.95rem] text-ink transition-colors duration-300 outline-none placeholder:text-faint disabled:opacity-60 ${
          error
            ? 'border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)]'
            : 'border-line focus:border-gold'
        }`}
        style={{ borderRadius: 'var(--radius-facet)' }}
      />

      {hint && !error && (
        <p id={hintId} className="text-[0.76rem] leading-snug text-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-[0.78rem] leading-snug text-accent">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Submit button.
 *
 * `busy` disables it and swaps the label. Leaving a submit button live during
 * an in-flight request is how you get two accounts from one impatient
 * double-click.
 */
export function SubmitButton({ children, busy = false, busyLabel = 'Please wait…', disabled = false }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-busy={busy}
      className="group relative w-full overflow-hidden border border-gold bg-gold px-6 py-3.5 text-[0.68rem] tracking-[0.28em] text-cream uppercase transition-colors duration-500 ease-silk hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-70"
      style={{ borderRadius: 'var(--radius-facet)' }}
    >
      <span className="relative z-10">{busy ? busyLabel : children}</span>
    </button>
  )
}

/**
 * Form-level error banner.
 *
 * Used for failures that belong to the request rather than to one field — wrong
 * credentials, a rate limit, the server being unreachable. `role="alert"` makes
 * it announce itself, which matters because the user's eyes are on the button
 * they just pressed.
 */
export function FormError({ children }) {
  if (!children) return null

  return (
    <div
      role="alert"
      className="border border-[color-mix(in_srgb,var(--color-accent)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_7%,transparent)] px-4 py-3 text-[0.84rem] leading-snug text-accent"
      style={{ borderRadius: 'var(--radius-facet)' }}
    >
      {children}
    </div>
  )
}

export function FormSuccess({ children }) {
  if (!children) return null

  return (
    <div
      role="status"
      className="border border-[color-mix(in_srgb,var(--color-gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_8%,transparent)] px-4 py-3 text-[0.84rem] leading-snug text-gold-deep"
      style={{ borderRadius: 'var(--radius-facet)' }}
    >
      {children}
    </div>
  )
}

export default Field
