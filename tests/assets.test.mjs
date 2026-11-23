import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { assets } from '../universe/src/data/portfolioData.js'
import { RESUME_URL } from '../src/config.js'

const exact = (base, rel) => {
  let dir = base
  for (const part of rel.split('/').filter(Boolean)) {
    if (!existsSync(dir) || !readdirSync(dir).includes(part)) return false
    dir = join(dir, part)
  }
  return true
}
const flat = (o) => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : flat(v)))

test('every asset the Universe refers to exists in the tracked folder, with exact capitalisation', () => {
  for (const ref of flat(assets)) {
    assert.ok(ref.startsWith('/assets/'), `${ref} must be an absolute /assets/ path`)
    assert.ok(exact('universe/public', ref), `missing or mis-cased: universe/public${ref}`)
    assert.ok(statSync(join('universe/public', ref)).size > 500, `${ref} is empty`)
  }
})
test('the workstation resume button points at the same file as the Universe', () => {
  assert.equal(RESUME_URL, assets.resume)
})
test('the resume is a real PDF and the photos are real images', () => {
  assert.equal(readFileSync(join('universe/public', assets.resume)).subarray(0, 4).toString(), '%PDF')
  for (const ref of [assets.profile, ...Object.values(assets.sports)]) {
    const b = readFileSync(join('universe/public', ref))
    const ok = (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50)
    assert.ok(ok, `${ref} is not a JPEG/PNG`)
  }
})
test('no asset lives only in the git-ignored repo-root public/assets', () => {
  const ignored = readFileSync('.gitignore', 'utf8')
  assert.match(ignored, /^public\/assets$/m, 'root public/assets should stay ignored (it is generated)')
  for (const ref of flat(assets)) assert.ok(!ref.includes('  '), `${ref} contains a double space`)
})
