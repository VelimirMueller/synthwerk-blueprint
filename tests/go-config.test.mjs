// Proves that configs/go/.golangci.yml is valid v2 config, passes clean code
// and reports seeded issues with the expected linters.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { describe, it } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const config = join(root, 'configs', 'go', '.golangci.yml')
const fixture = join(import.meta.dirname, 'fixtures', 'go')

function lint(pkg) {
  const res = spawnSync(
    'golangci-lint',
    ['run', '--config', config, '--output.json.path=stdout', '--output.text.path=stderr', pkg],
    { cwd: fixture, encoding: 'utf8' }
  )
  assert.equal(res.error, undefined, 'golangci-lint must be on PATH')
  // The JSON report is the first line; the summary follows.
  const report = JSON.parse(res.stdout.split('\n')[0])
  return { status: res.status, issues: report.Issues ?? [] }
}

describe('golangci config', () => {
  it('config verify - blueprint config - passes', () => {
    const res = spawnSync('golangci-lint', ['config', 'verify', '--config', config], {
      encoding: 'utf8'
    })
    assert.equal(res.status, 0, res.stderr)
  })

  it('run - clean package - reports no issues', () => {
    const { status, issues } = lint('./good/...')
    assert.deepEqual(issues, [])
    assert.equal(status, 0)
  })

  it('run - seeded issues - reports expected linters', () => {
    const { status, issues } = lint('./bad/...')
    assert.notEqual(status, 0)
    assert.deepEqual([...new Set(issues.map((i) => i.FromLinter))].sort(), [
      'errorlint',
      'gosec',
      'misspell',
      'noctx'
    ])
  })
})
