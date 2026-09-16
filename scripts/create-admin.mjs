/**
 * Create or promote a staff account.
 *
 *   npm run create-admin -- --email you@example.com --password 'a long passphrase'
 *   npm run create-admin -- --email you@example.com --promote
 *
 * There is deliberately no seeded default admin. A repo that ships an admin
 * account ships a known credential, and known credentials on a public URL are
 * found within hours by scanners that do nothing else all day.
 *
 * `--promote` flips the role on an existing account, which is the path you want
 * when the person already registered through the normal form.
 */
import { db } from '../server/db.js'
import { createUser, findByEmail, userCounts } from '../server/lib/users.js'
import { validateEmail, validatePassword } from '../server/lib/validate.js'

function parseArgs(argv) {
  const args = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const next = argv[i + 1]

    if (key === 'promote') {
      args.promote = true
    } else if (next && !next.startsWith('--')) {
      args[key] = next
      i += 1
    }
  }

  return args
}

const args = parseArgs(process.argv.slice(2))
const emailCheck = validateEmail(args.email)

if (!emailCheck.ok) {
  console.error(`\n  ${emailCheck.message}`)
  console.error(`  Usage: npm run create-admin -- --email you@example.com --password 'a long passphrase'\n`)
  process.exit(1)
}

const email = emailCheck.value
const existing = findByEmail(email)

if (existing) {
  if (args.promote) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id)
    console.log(`\n  Promoted ${email} to admin (id ${existing.id}).`)
  } else {
    console.log(`\n  ${email} already exists (id ${existing.id}, role ${existing.role}).`)
    console.log(`  Pass --promote to make it an admin.\n`)
    process.exit(0)
  }
} else {
  const passwordCheck = validatePassword(args.password)
  if (!passwordCheck.ok) {
    console.error(`\n  ${passwordCheck.message}`)
    console.error(`  Usage: npm run create-admin -- --email you@example.com --password 'a long passphrase'\n`)
    process.exit(1)
  }

  const result = createUser({ email, password: args.password, displayName: args.displayName || 'Showroom Admin', role: 'admin' })

  if (!result.ok) {
    console.error(`\n  Could not create that account: ${result.reason}\n`)
    process.exit(1)
  }

  console.log(`\n  Created admin ${email} (id ${result.user.id}).`)
}

const counts = userCounts()
console.log(`  Users: ${counts.users} (admins: ${counts.admins})\n`)

db.close()
