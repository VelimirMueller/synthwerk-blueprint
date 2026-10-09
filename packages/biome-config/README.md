# @synthwerk/biome-config

Shared [Biome](https://biomejs.dev) 2.5 config for all `synthwerk-*` TypeScript and Vue repos.
Biome does lint **and** format (decision D-06). Do not use ESLint or Prettier.

## Use

1. Install the exact Biome version and the config:

   ```sh
   pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config
   ```

2. Write `biome.json` in the repo root:

   ```json
   { "extends": ["@synthwerk/biome-config"] }
   ```

   For a React package, use `"@synthwerk/biome-config/react"`.

3. Run `pnpm exec biome check --write .` locally. CI runs `pnpm exec biome ci .`.

## What it sets

- Formatter ON: 2 spaces, line width 100, single quotes, no semicolons, no trailing commas.
- Vue full support ON (`html.experimentalFullSupportEnabled`): Biome formats and lints `.vue` templates.
- Linter: `recommended`, plus the `vue` domain.
- Imports: `useImportType` is an error. `organizeImports` sorts imports.

## Ported ESLint rules

Source: `discovery/02-frontends.md` §1.4, §2.4, §3.4 (chat, images and landing frontends).

| ESLint rule | Biome setting |
|---|---|
| `indent: 2`, `@typescript-eslint/indent: 2` | `formatter.indentWidth: 2` |
| standard: no semicolons | `javascript.formatter.semicolons: "asNeeded"` |
| standard: single quotes | `javascript.formatter.quoteStyle: "single"` |
| `comma-dangle: never` | `javascript.formatter.trailingCommas: "none"` |
| `eol-last: always` | Formatter always writes a final newline |
| `no-multiple-empty-lines: {max: 1}` | Formatter collapses empty lines |
| `object-curly-spacing: always` | `javascript.formatter.bracketSpacing: true` |
| `@typescript-eslint/no-explicit-any: off` | `suspicious.noExplicitAny: "off"` |
| `vue/multi-word-component-names: off` | `style.useVueMultiWordComponentNames: "off"` |
| `vue/attribute-hyphenation: always` | `style.useVueHyphenatedAttributes: "error"` |
| `vue/order-in-components` | Replaced by `style.noVueOptionsApi: "error"` (forces `<script setup>`) |
| `vue/html-indent`, `vue/html-self-closing`, `vue/html-closing-bracket-newline`, `vue/html-closing-bracket-spacing`, `vue/singleline-html-element-content-newline`, `vue/multiline-html-element-content-newline` | Replaced by the Biome HTML formatter output |

## Rules not ported

Biome 2.5.15 has no equal rule or option for these:

| ESLint rule | Repo | Why not ported |
|---|---|---|
| `space-before-function-paren` | chat (standard) | No formatter option. Biome style applies. |
| `newline-before-return` | landing | No Biome rule. |
| `@typescript-eslint/no-unused-expressions` (allow short-circuit, ternary) | landing | No Biome rule with these options. |
| `vue/attributes-order` | images | No Biome rule. |
| `vue/no-v-html: off` | landing | Reversed: `v-html` is banned. The `ts-ci.yml` workflow fails on `v-html` (FR-17). |

## Known limits

- Biome does not check Vue template types. `vue-tsc` does this in `ts-ci.yml` (D-06).
- First run on old `.vue` files: run `biome check --write .` **two times**. Trial on the landing
  page (2026-10-09): 2 of 31 files changed again on the second pass (inline text next to
  `<span>`). The third pass changed nothing.
- Fallback if the `.vue` formatter breaks a template: switch off the HTML formatter for `*.vue`
  with an `overrides` entry. Lint stays on.

## Release

- Semver. A stricter rule is a minor release with a changelog entry.
- The Biome version is pinned exact. A Biome update is a separate release.
