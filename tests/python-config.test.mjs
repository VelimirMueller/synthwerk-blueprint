// Proves that configs/python/ruff.toml and mypy.toml pass clean code and
// report seeded issues. Tool versions match the blueprint spec (§3.5).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { describe, it } from 'node:test'

const root = resolve(import.meta.dirname, '..')
const ruffToml = join(root, 'configs', 'python', 'ruff.toml')
const mypyToml = join(root, 'configs', 'python', 'mypy.toml')
const fixture = join(import.meta.dirname, 'fixtures', 'python')

function uvx(args) {
  const res = spawnSync('uvx', args, { cwd: root, encoding: 'utf8' })
  assert.equal(res.error, undefined, 'uvx must be on PATH')
  return res
}
const ruff = (...args) => uvx(['ruff@0.16.10', ...args, '--config', ruffToml])
const mypy = (file) => uvx(['--from', 'mypy==2.4.0', 'mypy', '--config-file', mypyToml, file])

describe('python config', () => {
  it('ruff check - clean module - passes', () => {
    const res = ruff('check', join(fixture, 'good'))
    assert.equal(res.status, 0, res.stdout)
  })

  it('ruff format - clean module - is formatted', () => {
    const res = ruff('format', '--check', join(fixture, 'good'))
    assert.equal(res.status, 0, res.stdout)
  })

  it('ruff check - seeded issues - reports expected codes', () => {
    const res = ruff('check', '--output-format', 'json', join(fixture, 'bad'))
    assert.equal(res.status, 1)
    const codes = new Set(JSON.parse(res.stdout).map((d) => d.code))
    // S101 (assert) is absent on purpose: the fixture sits under tests/**,
    // where the config allows assert.
    for (const code of ['F401', 'UP006', 'UP035', 'B006', 'S307']) {
      assert.ok(codes.has(code), `missing ${code}; found ${[...codes].join(', ')}`)
    }
    assert.ok(!codes.has('S101'))
  })

  it('ruff format - unformatted module - fails', () => {
    assert.equal(ruff('format', '--check', join(fixture, 'bad')).status, 1)
  })

  it('mypy strict - typed module - passes', () => {
    const res = mypy(join(fixture, 'good', 'pricing.py'))
    assert.equal(res.status, 0, res.stdout)
  })

  it('mypy strict - untyped functions - reports no-untyped-def', () => {
    const res = mypy(join(fixture, 'bad', 'pricing.py'))
    assert.equal(res.status, 1)
    assert.match(res.stdout, /\[no-untyped-def\]/)
  })
})
