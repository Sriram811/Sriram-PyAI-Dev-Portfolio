// Fails the build when a file the site refers to is missing, mis-cased, empty or not what it claims to be.
// Before: a git-ignored or mis-named asset built fine and then 404'd silently on Vercel.
//
//   node scripts/verify-assets.mjs          source check: every referenced /assets/... file exists in universe/public
//   node scripts/verify-assets.mjs --dist   output check: the built dist/ really contains them, and the built HTML's links resolve
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const root = process.cwd()
const distMode = process.argv.includes('--dist')
const errors = []
const warnings = []

// Exact-case existence: macOS/Windows ignore case, Vercel (Linux) does not.
function existsExact(base, rel) {
  let dir = base
  for (const part of rel.split('/').filter(Boolean)) {
    if (!existsSync(dir) || !statSync(dir).isDirectory() || !readdirSync(dir).includes(part)) return false
    dir = join(dir, part)
  }
  return true
}
function kind(buf) {
  if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'pdf'
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return 'unknown'
}

// Every absolute /assets/... path the site refers to: the Universe data file plus the workstation's resume constant.
const refs = new Map()
const scan = (file) => {
  const p = join(root, file)
  if (!existsSync(p)) return errors.push(`${file} not found`)
  for (const m of readFileSync(p, 'utf8').matchAll(/["'`](\/assets\/[^"'`\s]+\.(?:png|jpe?g|webp|svg|gif|pdf))["'`]/gi)) refs.set(m[1], file)
}
scan('universe/src/data/portfolioData.js')
scan('src/config.js')
if (refs.size === 0) errors.push('no /assets/ references found, is the data file path wrong?')

const base = distMode ? join(root, 'dist') : join(root, 'universe', 'public')
for (const [ref, from] of refs) {
  if (!existsExact(base, ref)) {
    errors.push(`MISSING  ${ref}   (referenced in ${from})\n         expected at ${distMode ? 'dist' : 'universe/public'}${ref}${distMode ? '' : '\n         note: the repo-root public/assets folder is git-ignored and is NOT deployed; put files in universe/public/assets'}`)
    continue
  }
  const file = join(base, ref)
  const size = statSync(file).size
  if (size < 500) errors.push(`TOO SMALL ${ref} is only ${size} bytes`)
  const k = kind(readFileSync(file).subarray(0, 16))
  const ext = extname(ref).slice(1).toLowerCase().replace('jpg', 'jpeg')
  if (ext === 'pdf' && k !== 'pdf') errors.push(`NOT A PDF ${ref} (content looks like: ${k})`)
  else if (['png', 'jpeg', 'webp'].includes(ext) && !['png', 'jpeg', 'webp'].includes(k)) errors.push(`NOT AN IMAGE ${ref} (content looks like: ${k})`)
  else if (['png', 'jpeg', 'webp'].includes(ext) && k !== ext) warnings.push(`${ref} is really a ${k.toUpperCase()} file with a .${ext} extension (browsers still display it)`)
}

if (distMode) {
  // The built HTML must point at files that exist (catches wrong base paths for the workstation and the Universe).
  for (const html of ['dist/index.html', 'dist/universe/index.html']) {
    const p = join(root, html)
    if (!existsSync(p)) {
      errors.push(`MISSING ${html}: ${html.includes('universe') ? 'the Universe was not built into public/universe' : 'the workstation build produced no index.html'}`)
      continue
    }
    const urls = [...readFileSync(p, 'utf8').matchAll(/(?:src|href)="(\/[^"#?]+)"/g)].map((m) => m[1])
    for (const u of urls) if (!existsExact(join(root, 'dist'), u)) errors.push(`BROKEN LINK in ${html}: ${u}`)
    if (html.includes('universe') && !urls.some((u) => u.startsWith('/universe/assets/'))) errors.push(`${html} has no /universe/assets/ links: the Universe was not built with --base=/universe/`)
  }
}

warnings.forEach((w) => console.warn(`  warning: ${w}`))
if (errors.length) {
  console.error(`\nAsset verification FAILED (${distMode ? 'dist' : 'source'}):\n`)
  errors.forEach((e) => console.error('  - ' + e))
  console.error('')
  process.exit(1)
}
console.log(`Asset verification passed (${distMode ? 'dist' : 'source'}): ${refs.size} referenced file(s) present${distMode ? ', built HTML links resolve' : ''}.`)
