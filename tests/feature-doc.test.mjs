// Tests for the feature-doc checker (actions/feature-doc/check.mjs).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  changedFromNameStatus,
  check,
  globToRegExp,
  lintFrontmatter,
  loadDocs,
  main,
  parseFrontmatter,
  steWarnings
} from '../actions/feature-doc/check.mjs'

const fixture = join(import.meta.dirname, 'fixtures', 'feature-doc')
const docs = loadDocs(fixture)
const DOC = 'docs/features/widget-session-token.md'
const SRC = 'internal/widgettoken/token.go'

describe('feature-doc check', () => {
  it('check - changed path matches doc not changed - fails', () => {
    const { errors } = check({ changed: [SRC], docs })
    assert.deepEqual(errors, [`${DOC}: not updated, but ${SRC} changed. Run /feature-doc.`])
  })

  it('check - matched doc changed too - passes', () => {
    assert.deepEqual(check({ changed: [SRC, DOC], docs }).errors, [])
  })

  it('check - only tests, CI and deps changed - passes', () => {
    const changed = ['tests/token_test.go', '.github/workflows/ci.yml', 'go.mod', 'README.md']
    assert.deepEqual(check({ changed, docs }).errors, [])
  })

  it('check - source path without doc - fails', () => {
    const { errors } = check({ changed: ['internal/billing/invoice.go'], docs })
    assert.deepEqual(errors, [
      'internal/billing/invoice.go: no feature doc covers this path. Run /feature-doc.'
    ])
  })

  it('check - label no-feature-doc with reason - passes', () => {
    const result = check({
      changed: [SRC],
      docs,
      labels: ['no-feature-doc'],
      body: 'What\n\nno-feature-doc: rename only, no behaviour change\n'
    })
    assert.deepEqual(result.errors, [])
    assert.equal(result.notices.length, 1)
  })

  it('check - label no-feature-doc without reason - fails', () => {
    const { errors } = check({ changed: [SRC], docs, labels: ['no-feature-doc'], body: '' })
    assert.equal(errors.length, 2)
    assert.match(errors[1], /needs a line "no-feature-doc: <reason>"/)
  })

  it('check - frontmatter without paths - fails', () => {
    const bad = {
      file: 'docs/features/x.md',
      text: '',
      meta: { title: 'X', slug: 'x', status: 'beta', updated: '2026-10-09' }
    }
    assert.deepEqual(check({ changed: [], docs: [bad] }).errors, [
      'docs/features/x.md: paths must list at least one glob'
    ])
  })

  it('check - changed doc with long sentence - warns only', () => {
    const long = `- ${'word '.repeat(21).trim()}.`
    const doc = { ...docs[0], text: `${docs[0].text}\n${long}\n` }
    const result = check({ changed: [SRC, DOC], docs: [doc] })
    assert.deepEqual(result.errors, [])
    assert.equal(result.warnings.length, 1)
    assert.match(result.warnings[0], /21 words/)
  })
})

describe('feature-doc helpers', () => {
  it('globToRegExp - double star - matches nested paths only under the prefix', () => {
    const re = globToRegExp('internal/app/**')
    assert.ok(re.test('internal/app/a/b.go'))
    assert.ok(!re.test('internal/apps/b.go'))
    assert.ok(globToRegExp('**/*.vue').test('app/pages/index.vue'))
    assert.ok(globToRegExp('**/*.vue').test('index.vue'))
  })

  it('parseFrontmatter - flow array, block list, comment - parses values', () => {
    const meta = parseFrontmatter(
      '---\nstatus: beta # note\npaths:\n  - "a/**"\n  - b/*\napi: ["x"]\n---\n'
    )
    assert.deepEqual(meta, { status: 'beta', paths: ['a/**', 'b/*'], api: ['x'] })
  })

  it('parseFrontmatter - unquoted flow array, open quote - keeps raw strings', () => {
    const meta = parseFrontmatter('---\npaths: [internal/**]\ntitle: "Open\n---\n')
    assert.deepEqual(meta, { paths: '[internal/**]', title: '"Open' })
    assert.deepEqual(
      lintFrontmatter('docs/features/x.md', {
        ...meta,
        slug: 'x',
        status: 'beta',
        updated: '2026-10-09'
      }),
      ['docs/features/x.md: paths must list at least one glob']
    )
  })

  it('steWarnings - code, tables and headings - are skipped', () => {
    const text = `# ${'w '.repeat(30)}\n| ${'w '.repeat(30)} |\n\`\`\`\n${'w '.repeat(30)}\n\`\`\`\n`
    assert.deepEqual(steWarnings('f.md', text), [])
  })

  it('changedFromNameStatus - D and R100 skipped, R<100 counts new path', () => {
    const out = [
      'A\tsrc/new.ts',
      'D\tsrc/gone.ts',
      'R100\tsrc/old-name.ts\tsrc/new-name.ts',
      'R075\tsrc/edited-old.ts\tsrc/edited-new.ts',
      'M\tREADME.md'
    ].join('\n')
    assert.deepEqual(changedFromNameStatus(out), ['src/new.ts', 'src/edited-new.ts', 'README.md'])
  })

  it('changedFromNameStatus - empty diff - returns empty list', () => {
    assert.deepEqual(changedFromNameStatus(''), [])
  })

  it('loadDocs - template file - is skipped', () => {
    assert.deepEqual(
      docs.map((d) => d.file),
      [DOC]
    )
  })
})

describe('feature-doc cli', () => {
  // Fixture repo on branch main with `base-ref` at the fixture state.
  function initRepo() {
    const repo = mkdtempSync(join(tmpdir(), 'feature-doc-'))
    // Isolate from the developer's git config (signing, tag rules, hooks).
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
    const git = (...args) => execFileSync('git', args, { cwd: repo, env, stdio: 'pipe' })
    const commit = (...args) =>
      git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', ...args)
    cpSync(fixture, repo, { recursive: true })
    git('init', '-q', '-b', 'main')
    commit('--allow-empty', '-m', 'base')
    git('add', '-A')
    commit('-m', 'add')
    git('branch', 'base-ref')
    return { repo, git, commit }
  }

  function runMain(repo, base = 'base-ref') {
    const log = console.log
    console.log = () => {}
    try {
      return main(['--root', repo, '--base', base], {})
    } finally {
      console.log = log
    }
  }

  it('main - git repo with stale doc - exits 1', () => {
    const { repo, commit } = initRepo()
    try {
      writeFileSync(join(repo, SRC), 'package widgettoken\n\nconst TTL = 60\n')
      commit('-am', 'change')
      assert.equal(runMain(repo), 1)
      assert.equal(runMain(repo, 'HEAD'), 0)
      assert.equal(runMain(repo, 'no-such-ref'), 2)
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })

  it('main - deletion-only source change - passes without a doc change', () => {
    const { repo, git, commit } = initRepo()
    try {
      git('rm', '-q', SRC)
      commit('-m', 'delete source file')
      assert.equal(runMain(repo), 0)
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })

  it('main - pure rename under a source glob - passes without a doc change', () => {
    const { repo, git, commit } = initRepo()
    try {
      git('mv', SRC, 'internal/widgettoken/token_v2.go')
      commit('-m', 'pure rename')
      assert.equal(runMain(repo), 0)
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })

  it('main - rename with content change - still needs the doc', () => {
    const { repo, git, commit } = initRepo()
    try {
      git('mv', SRC, 'internal/widgettoken/token_v2.go')
      writeFileSync(
        join(repo, 'internal', 'widgettoken', 'token_v2.go'),
        'package widgettoken\n\nconst TTL = 60\n'
      )
      commit('-am', 'rename with edit')
      assert.equal(runMain(repo), 1)
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})
