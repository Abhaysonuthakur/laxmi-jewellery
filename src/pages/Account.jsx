import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { AuthBackdrop, AuthHeader } from '../components/auth/AuthLayout'
import { Field, FormError, FormSuccess, SubmitButton } from '../components/auth/Field'
import MediaFrame from '../components/ui/MediaFrame'
import { PIECES } from '../data/pieces'
import { images, imageAlt } from '../data/images'
import { useAuth } from '../auth/AuthProvider'
import { useWishlist } from '../auth/WishlistProvider'
import { EASE } from '../lib/anim'

function Section({ eyebrow, title, description, children }) {
  const reduced = useReducedMotion()

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE.silk }}
      className="border-t border-line pt-9"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <div>
          <p className="eyebrow text-[0.58rem] text-gold-deep">{eyebrow}</p>
          <h2 className="font-display mt-3 text-[clamp(1.4rem,3.4vw,2rem)] leading-tight font-light text-ink">
            {title}
          </h2>
        </div>
        {description && <p className="max-w-[34ch] text-[0.82rem] leading-snug text-muted">{description}</p>}
      </div>

      <div className="mt-7">{children}</div>
    </motion.section>
  )
}

/**
 * One catalogue piece with a save toggle.
 *
 * The button reports `aria-pressed`, so a screen reader announces the state
 * rather than just the word "Save" whether or not it is saved. The label also
 * changes, because the visual state is a filled heart — invisible to anyone not
 * looking at it.
 */
function PieceCard({ piece, saved, pending, onToggle }) {
  return (
    <div className="group flex flex-col border border-line bg-cream transition-colors duration-500 hover:border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)]">
      <MediaFrame
        src={images[piece.imageKey]}
        alt={imageAlt[piece.imageKey]}
        label={piece.title}
        ratio="4 / 5"
        imgClassName="group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div>
          <h3 className="font-display text-[1.15rem] leading-none font-normal text-ink">{piece.title}</h3>
          <p className="mt-2 text-[0.78rem] leading-snug text-muted">{piece.caption}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-pressed={saved}
          className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-[0.6rem] tracking-[0.24em] uppercase transition-colors duration-400 disabled:opacity-60 ${
            saved
              ? 'border-gold bg-gold text-cream hover:bg-gold-deep'
              : 'border-line text-muted hover:border-gold hover:text-ink'
          }`}
          style={{ borderRadius: 'var(--radius-facet)' }}
        >
          <svg width="14" height="13" viewBox="0 0 17 16" fill="none" aria-hidden="true">
            <path
              d="M8.5 14.2 2.4 8.35A3.55 3.55 0 0 1 8.5 4.1a3.55 3.55 0 0 1 6.1 4.25L8.5 14.2Z"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
              fill={saved ? 'currentColor' : 'none'}
            />
          </svg>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'

  // The server stores UTC ISO strings; showing them in the visitor's own
  // timezone is the only interpretation that is not misleading.
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}

export default function Account() {
  const { user, logout, updateProfile, isAdmin } = useAuth()
  const wishlist = useWishlist()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [pendingPiece, setPendingPiece] = useState(null)
  const [listError, setListError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  if (!user) return null

  async function handleProfileSave(event) {
    event.preventDefault()
    setSavingName(true)
    setNameError('')
    setNameSaved(false)

    try {
      await updateProfile({ displayName })
      setNameSaved(true)
      window.setTimeout(() => setNameSaved(false), 4000)
    } catch (error) {
      setNameError(error.fields?.displayName ?? error.message)
    } finally {
      setSavingName(false)
    }
  }

  async function handleToggle(piece) {
    setPendingPiece(piece)
    setListError('')

    try {
      await wishlist.toggle(piece)
    } catch (error) {
      setListError(error.message)
    } finally {
      setPendingPiece(null)
    }
  }

  const greeting = user.displayName?.trim() ? user.displayName.trim() : user.email

  return (
    <div className="relative min-h-dvh bg-ivory">
      <AuthBackdrop />
      <AuthHeader />

      <main className="relative z-10 pb-28">
        <div className="shell">
          <div className="pt-6 md:pt-10">
            <p className="eyebrow text-[0.6rem] text-gold-deep">Your account</p>

            <h1 className="font-display mt-4 text-[clamp(2rem,6vw,3.5rem)] leading-[1.02] font-light text-ink">
              {greeting}
            </h1>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.84rem] text-muted">
              <span>{user.email}</span>
              <span aria-hidden="true" className="text-faint">
                ·
              </span>
              <span>Member since {formatDate(user.createdAt)}</span>
              {isAdmin && (
                <>
                  <span aria-hidden="true" className="text-faint">
                    ·
                  </span>
                  <span className="text-gold-deep">Staff account</span>
                </>
              )}
            </p>

            {isAdmin && (
              <div className="mt-6">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-[0.6rem] tracking-[0.24em] text-muted uppercase transition-colors duration-400 hover:border-gold hover:text-ink"
                  style={{ borderRadius: 'var(--radius-facet)' }}
                >
                  Open staff dashboard
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-14 flex flex-col gap-12">
            <Section
              eyebrow="Saved pieces"
              title={wishlist.count === 1 ? '1 piece saved' : `${wishlist.count} pieces saved`}
              description="Saved to your account, so they follow you to any device you sign in from."
            >
              {listError && (
                <div className="mb-5">
                  <FormError>{listError}</FormError>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {PIECES.map((piece) => (
                  <PieceCard
                    key={piece.key}
                    piece={piece}
                    saved={wishlist.isSaved(piece.key)}
                    pending={pendingPiece === piece.key}
                    onToggle={() => handleToggle(piece.key)}
                  />
                ))}
              </div>

              {/*
               * Honest framing rather than a fake shop: the catalogue currently
               * holds four piece families, and nothing here implies a price,
               * stock or availability that the client has not supplied.
               */}
              <p className="mt-5 text-[0.78rem] leading-snug text-faint">
                This is a showroom, not a shop — nothing here is for sale online. To see any piece in person, or to ask
                about a commission, please get in touch through the{' '}
                <Link to="/#contact" className="underline decoration-gold/40 underline-offset-4 hover:text-gold-deep">
                  contact section
                </Link>
                .
              </p>
            </Section>

            <Section eyebrow="Details" title="Your name" description="Used to greet you here. Optional, and changeable at any time.">
              <form onSubmit={handleProfileSave} noValidate className="flex max-w-[30rem] flex-col gap-5">
                <FormError>{nameError}</FormError>
                {nameSaved && <FormSuccess>Saved.</FormSuccess>}

                <Field
                  name="displayName"
                  label="Name"
                  value={displayName}
                  onChange={setDisplayName}
                  autoComplete="name"
                  placeholder="How should we address you?"
                />

                <div className="max-w-[13rem]">
                  <SubmitButton busy={savingName} busyLabel="Saving…">
                    Save changes
                  </SubmitButton>
                </div>
              </form>
            </Section>

            <Section eyebrow="Email" title={user.email} description="Your sign-in address. It cannot be changed here — contact us if it needs updating.">
              <div className="gold-rule opacity-50" />
            </Section>

            <Section eyebrow="Session" title="Sign out" description="Ends this session on this device. You can sign back in at any time.">
              <button
                type="button"
                onClick={async () => {
                  setSigningOut(true)
                  await logout()
                }}
                disabled={signingOut}
                className="border border-line px-5 py-3 text-[0.62rem] tracking-[0.24em] text-muted uppercase transition-colors duration-400 hover:border-accent hover:text-accent disabled:opacity-60"
                style={{ borderRadius: 'var(--radius-facet)' }}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </Section>
          </div>
        </div>
      </main>
    </div>
  )
}
