// Proves that @synthwerk/biome-config resolves by package name, passes clean
// code and reports the expected rule ids on bad code.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, describe, it } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const biome = join(root, 'node_modules', '.bin', 'biome')
let work

function runBiome(dir) {
  const res = spawnSync(biome, ['ci', '--reporter=json', '--colors=off', dir], {
    cwd: work,
    encoding: 'utf8'
  })
  assert.equal(res.error, undefined, 'run pnpm install first: node_modules/.bin/biome is missing')
  const json = res.stdout.slice(res.stdout.indexOf('{'))
  return { status: res.status, report: JSON.parse(json) }
}

describe('biome-config', () => {
  before(() => {
    work = mkdtempSync(join(tmpdir(), 'biome-config-'))
    cpSync(join(import.meta.dirname, 'fixtures', 'biome'), work, { recursive: true })
    mkdirSync(join(work, 'node_modules', '@synthwerk'), { recursive: true })
    symlinkSync(
      join(root, 'packages', 'biome-config'),
      join(work, 'node_modules', '@synthwerk', 'biome-config')
    )
    writeFileSync(join(work, 'biome.json'), '{ "extends": ["@synthwerk/biome-config"] }\n')
    // vcs.useIgnoreFile needs a git root.
    spawnSync('git', ['init', '-q'], { cwd: work })
  })

  after(() => rmSync(work, { recursive: true, force: true }))

  it('ci - clean ts and vue files - passes', () => {
    const { status, report } = runBiome('good')
    assert.equal(report.summary.errors, 0, JSON.stringify(report.diagnostics, null, 2))
    assert.equal(status, 0)
  })

  it('ci - seeded issues - fails with expected rule ids', () => {
    const { status, report } = runBiome('bad')
    const found = new Set(report.diagnostics.map((d) => `${d.location.path}:${d.category}`))
    assert.notEqual(status, 0)
    for (const expected of [
      'bad/greeting.ts:format',
      'bad/greeting.ts:lint/style/useImportType',
      'bad/greeting.ts:lint/suspicious/noDoubleEquals',
      'bad/UserCard.vue:lint/style/noVueOptionsApi',
      'bad/UserCard.vue:lint/style/useVueHyphenatedAttributes'
    ]) {
      assert.ok(found.has(expected), `missing ${expected}; found ${[...found].join(', ')}`)
    }
  })
})
