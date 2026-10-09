#!/usr/bin/env node
// Feature-doc checker. A PR that changes feature source must update the
// feature doc that covers it (docs/features/<slug>.md, `paths:` globs).
//
// Usage: node check.mjs [--base <ref>] [--root <dir>]
// Env:   SYNTHWERK_FEATURE_DOC_BASE  base ref (default origin/main; --base wins)
//        FEATURE_DOC_LABELS          PR labels as a JSON array
//        FEATURE_DOC_BODY            PR body (opt-out reason)
//        FEATURE_DOC_SOURCE_GLOBS    comma list (default: src/**,internal/**,api/**,app/**)
// Exit:  0 pass, 1 check failed, 2 usage or git error.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DOCS_DIR = 'docs/features'
export const OPT_OUT_LABEL = 'no-feature-doc'
export const DEFAULT_SOURCE_GLOBS = ['src/**', 'internal/**', 'api/**', 'app/**']
const STATUSES = ['planned', 'beta', 'stable', 'deprecated']
const MAX_WORDS = 20

/** Converts a path glob (`**`, `*`, `?`) to an anchored RegExp. */
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*' && glob[i + 1] === '*') {
      // `**/` matches zero or more directories; a trailing `**` matches the rest.
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?'
        i += 2
      } else {
        re += '.*'
        i += 1
      }
    } else if (c === '*') {
      re += '[^/]*'
    } else if (c === '?') {
      re += '[^/]'
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${re}$`)
}

export const matchesAny = (path, globs) => globs.some((g) => globToRegExp(g).test(path))

function parseValue(raw) {
  const value = raw.trim()
  if (value.startsWith('[')) return JSON.parse(value)
  if (/^["']/.test(value)) return value.slice(1, value.indexOf(value[0], 1))
  return value.replace(/\s+#.*$/, '')
}

/** Parses the YAML subset used by feature docs: scalars, flow arrays, block lists. */
export function parseFrontmatter(text) {
  const lines = text.split('\n')
  if (lines[0].trim() !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null
  const data = {}
  let listKey = null
  for (const line of lines.slice(1, end)) {
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && listKey) {
      data[listKey].push(parseValue(item[1]))
      continue
    }
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!pair) continue
    const [, key, raw] = pair
    if (raw.trim() === '' || raw.trim().startsWith('#')) {
      data[key] = []
      listKey = key
    } else {
      data[key] = parseValue(raw)
      listKey = null
    }
  }
  return data
}

/** Returns schema errors for one feature doc. */
export function lintFrontmatter(file, meta) {
  if (!meta) return [`${file}: no frontmatter`]
  const errors = []
  const slug = basename(file, '.md')
  for (const key of ['title', 'slug', 'status', 'updated']) {
    if (typeof meta[key] !== 'string' || meta[key] === '') errors.push(`${file}: missing ${key}`)
  }
  if (meta.slug && meta.slug !== slug) errors.push(`${file}: slug must be "${slug}"`)
  if (meta.status && !STATUSES.includes(meta.status)) {
    errors.push(`${file}: status must be one of ${STATUSES.join(', ')}`)
  }
  if (meta.updated && !/^\d{4}-\d{2}-\d{2}$/.test(meta.updated)) {
    errors.push(`${file}: updated must be YYYY-MM-DD`)
  }
  if (!Array.isArray(meta.paths) || meta.paths.length === 0) {
    errors.push(`${file}: paths must list at least one glob`)
  }
  return errors
}

/** Warns on prose sentences longer than 20 words (ASD-STE100 rule, warn only). */
export function steWarnings(file, text) {
  const warnings = []
  let inFence = false
  let inFrontmatter = text.startsWith('---')
  text.split('\n').forEach((line, i) => {
    if (inFrontmatter) {
      if (i > 0 && line.trim() === '---') inFrontmatter = false
      return
    }
    if (line.trim().startsWith('```')) inFence = !inFence
    if (inFence || /^\s*(#|\||```)/.test(line)) return
    const prose = line
      .replace(/^\s*>\s?/, '')
      .replace(/^\s*(?:[-*]|\d+\.)\s+/, '')
      .replace(/`[^`]*`/g, 'x')
    for (const sentence of prose.split(/[.!?](?:\s|$)/)) {
      const words = sentence.split(/\s+/).filter(Boolean).length
      if (words > MAX_WORDS) {
        warnings.push(`${file}:${i + 1}: sentence has ${words} words (STE max ${MAX_WORDS})`)
      }
    }
  })
  return warnings
}

/** Loads every docs/features/*.md except files that start with "_". */
export function loadDocs(root) {
  const dir = join(root, DOCS_DIR)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
    .sort()
    .map((name) => {
      const file = `${DOCS_DIR}/${name}`
      const text = readFileSync(join(dir, name), 'utf8')
      return { file, text, meta: parseFrontmatter(text) }
    })
}

function optOutReason(body) {
  const match = (body ?? '').match(/^\s*no-feature-doc:[ \t]*(\S.*)$/im)
  return match ? match[1].trim() : ''
}

/**
 * Core rule set. Pure: no git, no file system.
 * @returns {{errors: string[], warnings: string[], notices: string[]}}
 */
export function check({
  changed,
  docs,
  labels = [],
  body = '',
  sourceGlobs = DEFAULT_SOURCE_GLOBS
}) {
  const errors = []
  const warnings = []
  const notices = []
  const changedSet = new Set(changed)

  for (const doc of docs) errors.push(...lintFrontmatter(doc.file, doc.meta))

  const stale = new Map()
  for (const path of changed.filter((p) => matchesAny(p, sourceGlobs))) {
    const covering = docs.filter(
      (d) => Array.isArray(d.meta?.paths) && matchesAny(path, d.meta.paths)
    )
    if (covering.length === 0) {
      errors.push(`${path}: no feature doc covers this path. Run /feature-doc.`)
    }
    for (const doc of covering.filter((d) => !changedSet.has(d.file))) {
      if (!stale.has(doc.file)) stale.set(doc.file, path)
    }
  }
  for (const [file, path] of stale) {
    errors.push(`${file}: not updated, but ${path} changed. Run /feature-doc.`)
  }

  for (const doc of docs.filter((d) => changedSet.has(d.file))) {
    warnings.push(...steWarnings(doc.file, doc.text))
  }

  if (errors.length > 0 && labels.includes(OPT_OUT_LABEL)) {
    const reason = optOutReason(body)
    if (reason) {
      notices.push(
        `Label ${OPT_OUT_LABEL} with reason "${reason}": ${errors.length} error(s) waived.`
      )
      return { errors: [], warnings, notices }
    }
    errors.push(`Label ${OPT_OUT_LABEL} needs a line "no-feature-doc: <reason>" in the PR body.`)
  }
  return { errors, warnings, notices }
}

function changedFiles(root, base) {
  const out = execFileSync('git', ['diff', '--name-only', '--no-renames', `${base}...HEAD`], {
    cwd: root,
    encoding: 'utf8'
  })
  return out.split('\n').filter(Boolean)
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--base', '--root'].includes(argv[i]) || argv[i + 1] === undefined) {
      throw new Error(`unknown or incomplete argument: ${argv[i]}`)
    }
    args[argv[i].slice(2)] = argv[i + 1]
  }
  return args
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const gha = env.GITHUB_ACTIONS === 'true'
  const say = (kind, msg) => console.log(gha ? `::${kind}::${msg}` : `${kind}: ${msg}`)
  let result
  try {
    const args = parseArgs(argv)
    const root = resolve(args.root ?? '.')
    const base = args.base ?? env.SYNTHWERK_FEATURE_DOC_BASE ?? 'origin/main'
    result = check({
      changed: changedFiles(root, base),
      docs: loadDocs(root),
      labels: JSON.parse(env.FEATURE_DOC_LABELS || '[]') ?? [],
      body: env.FEATURE_DOC_BODY ?? '',
      sourceGlobs: env.FEATURE_DOC_SOURCE_GLOBS
        ? env.FEATURE_DOC_SOURCE_GLOBS.split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : DEFAULT_SOURCE_GLOBS
    })
  } catch (err) {
    say('error', `feature-doc check could not run: ${err.message}`)
    return 2
  }
  for (const msg of result.notices) say('notice', msg)
  for (const msg of result.warnings) say('warning', msg)
  for (const msg of result.errors) say('error', msg)
  console.log(result.errors.length === 0 ? 'feature-doc check: pass' : 'feature-doc check: fail')
  return result.errors.length === 0 ? 0 : 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main()
}
