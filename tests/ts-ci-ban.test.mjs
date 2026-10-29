// Proves the "Ban v-html (FR-17)" step of .github/workflows/ts-ci.yml. The test reads
// the step script from the workflow, so it tests the code that callers run. A clean
// Vue file passes; the v-html fixture fails. ci.yml runs ts-ci.yml on a clean fixture.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, it } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const fixture = join(import.meta.dirname, 'fixtures', 'ci', 'vhtml')
const STEP = '- name: Ban v-html (FR-17)'

/** Returns the `run: |` block of the named step, without its indent. */
function stepScript(workflow, stepName) {
  const lines = workflow.split('\n')
  const start = lines.findIndex((line) => line.trim() === stepName)
  assert.notEqual(start, -1, `no step "${stepName}"`)
  const next = lines.findIndex((line, i) => i > start && /^\s+- name: /.test(line))
  const stepEnd = next === -1 ? lines.length : next
  const runAt = lines.findIndex((line, i) => i > start && i < stepEnd && /^\s+run: \|$/.test(line))
  assert.notEqual(runAt, -1, `step "${stepName}" has no "run: |" block`)
  const keyIndent = lines[runAt].search(/\S/)
  const body = []
  for (const line of lines.slice(runAt + 1)) {
    if (line.trim() !== '' && line.search(/\S/) <= keyIndent) break
    body.push(line)
  }
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.search(/\S/)))
  return body.map((l) => l.slice(indent)).join('\n')
}

const script = stepScript(readFileSync(join(root, '.github/workflows/ts-ci.yml'), 'utf8'), STEP)

/** Runs the ban step in a fresh git repo that tracks the given fixture dir. */
function runBan(dir) {
  const repo = mkdtempSync(join(tmpdir(), 'ts-ci-ban-'))
  try {
    cpSync(join(fixture, dir), repo, { recursive: true })
    execFileSync('git', ['init', '-q'], { cwd: repo })
    execFileSync('git', ['add', '-A'], { cwd: repo })
    return spawnSync('bash', ['--noprofile', '--norc', '-euo', 'pipefail', '-c', script], {
      cwd: repo,
      encoding: 'utf8'
    })
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
}

describe('ts-ci v-html ban', () => {
  it('ban step - Vue file with v-html - fails with the FR-17 error', () => {
    const res = runBan('bad')
    assert.equal(res.status, 1, res.stdout + res.stderr)
    assert.match(res.stdout, /::error::v-html is not allowed \(FR-17\)/)
    assert.match(res.stdout, /Page\.vue:2:/)
  })

  it('ban step - Vue file without v-html - passes', () => {
    const res = runBan('good')
    assert.equal(res.status, 0, res.stdout + res.stderr)
  })
})
