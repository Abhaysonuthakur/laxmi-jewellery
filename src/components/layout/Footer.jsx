import { BRAND, CONTACT, FOOTER_LINKS, SECTION_IDS } from '../../data/site'
import GoldLine from '../ui/GoldLine'

const SOCIAL_ICONS = {
  Instagram: (
    <>
      <rect x="1.6" y="1.6" width="12.8" height="12.8" rx="4" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1" />
      <circle cx="11.9" cy="4.2" r="0.75" fill="currentColor" />
    </>
  ),
  Facebook: (
    <path
      d="M10.4 5.2h1.7V2.6h-2.1c-1.9 0-3.1 1.2-3.1 3.2v1.3H4.6v2.6h2.3v5.7h2.7V9.7h2.1l.4-2.6H9.6V6.2c0-.7.3-1 .8-1Z"
      fill="currentColor"
    />
  ),
  TikTok: (
    <path
      d="M10.9 2.6c.3 1.6 1.3 2.6 2.9 2.8v2.2c-1.1.1-2.1-.3-3-.9v3.9a3.9 3.9 0 1 1-3.9-3.9c.2 0 .4 0 .6.1v2.3a1.7 1.7 0 1 0 1.2 1.6V2.6h2.2Z"
      fill="currentColor"
    />
  ),
}

export function Footer() {
  const year = new Date().getFullYear()
  const socials = CONTACT.social.filter((item) => item.href)

  return (
    <footer id={SECTION_IDS.contact} className="relative bg-ivory pt-24 pb-10">
      <GoldLine />

      <div className="shell pt-16">
        <div className="grid gap-14 md:grid-cols-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <p className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.05] font-light text-ink">
              {BRAND.nameParts[0]}
              <br />
              {BRAND.nameParts[1]}
            </p>
            <p className="eyebrow mt-5 text-[0.55rem] text-gold-deep">{BRAND.location}</p>
            <p className="measure mt-6 text-[0.85rem] leading-relaxed text-muted">
              {BRAND.tagline}. Crafted for the moments that become memories.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="eyebrow mb-6 text-[0.55rem] text-ink">Quick Links</h2>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center text-[0.82rem] text-muted transition-colors duration-400 hover:text-ink"
                  >
                    <span className="mr-0 h-px w-0 bg-gold transition-all duration-500 ease-silk group-hover:mr-3 group-hover:w-5" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact — honest placeholders until the client supplies details */}
          <div className="md:col-span-4">
            <h2 className="eyebrow mb-6 text-[0.55rem] text-ink">Visit</h2>
            <ul className="flex flex-col gap-3 text-[0.82rem] text-muted">
              <li>{CONTACT.addressLine || 'Street address — to be supplied'}</li>
              <li>
                {CONTACT.phone ? (
                  <a href={`tel:${CONTACT.phone}`} className="hover:text-ink">
                    {CONTACT.phone}
                  </a>
                ) : (
                  'Phone — to be supplied'
                )}
              </li>
              <li>
                {CONTACT.email ? (
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-ink">
                    {CONTACT.email}
                  </a>
                ) : (
                  'Email — to be supplied'
                )}
              </li>
              <li>{CONTACT.hours || 'Opening hours — to be supplied'}</li>
            </ul>

            {socials.length > 0 && (
              <ul className="mt-8 flex gap-4">
                {socials.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      aria-label={item.label}
                      className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors duration-400 hover:border-gold hover:text-gold-deep"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        {SOCIAL_ICONS[item.label]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <GoldLine className="mt-16" tone="line" />

        <div className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-[0.7rem] tracking-[0.08em] text-faint">
            © {year} {BRAND.nameParts.join(' ')}, {BRAND.city}. All rights reserved.
          </p>
          <p className="text-[0.7rem] tracking-[0.08em] text-faint">
            Privacy Policy · Terms &amp; Conditions
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
