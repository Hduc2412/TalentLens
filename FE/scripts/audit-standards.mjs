#!/usr/bin/env node
/**
 * Architecture and code-standards audit for the TalentLens frontend.
 *
 * Complements the automated gate (prettier / tsc / eslint / vitest / vite):
 * those tools cannot express the project's structural rules, so they live here.
 * Exits non-zero when any rule is violated.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SRC = 'src'
const FEATURES = join(SRC, 'features')

const LIMITS = {
  component: 250,
  logicTarget: 120,
  logicMax: 200,
}

const CJK = /[　-ヿ㐀-䶿一-鿿＀-￯]/
const VIETNAMESE = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i
const TEXT_ATTRIBUTES = /\s(aria-label|placeholder|title|alt)="([^"]+)"/g
const ARBITRARY_UTILITY = /(?:^|[\s'"`])[a-z0-9:_-]+-\[[^\]]+\]/
// Single quotes, double quotes and template literals all carry class strings.
const STRING_LITERAL = /'[^']*'|"[^"]*"|`[^`]*`/g

const findings = []
const notes = []

const report = (rule, file, detail) => findings.push({ rule, file, detail })

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const isTest = (file) => /\.test\.[tj]sx?$/.test(file)

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const codeLines = (source) =>
  source
    .split('\n')
    .filter((line) => line.trim() && !/^\s*(\/\/|\/\*|\*)/.test(line)).length

/** Data-shaped modules are exempt from the tight logic budget, not the hard cap. */
const isDataModule = (file) =>
  /[\\/](data|types|locales|mocks)[\\/]/.test(file) || /\.constants\.ts$/.test(file)

const files = walk(SRC).map((file) => file.split(sep).join('/'))
const sourceFiles = files.filter((file) => /\.(ts|tsx)$/.test(file) && !isTest(file))

// ── Rule 1: file size budgets ────────────────────────────────────────────────
for (const file of sourceFiles) {
  const lines = codeLines(readFileSync(file, 'utf8'))
  if (file.endsWith('.tsx')) {
    if (lines > LIMITS.component) {
      report('size', file, `${lines} code lines > ${LIMITS.component} (component)`)
    }
    continue
  }
  if (lines > LIMITS.logicMax) {
    report('size', file, `${lines} code lines > ${LIMITS.logicMax} (hard cap)`)
  } else if (lines > LIMITS.logicTarget && !isDataModule(file)) {
    notes.push(`${file}: ${lines} code lines > ${LIMITS.logicTarget} target (under the 200 cap)`)
  }
}

// ── Rule 2: named exports only ───────────────────────────────────────────────
for (const file of sourceFiles) {
  if (file.endsWith('src/i18n/i18n.ts')) continue
  if (/^\s*export\s+default\b/m.test(stripComments(readFileSync(file, 'utf8')))) {
    report('export-default', file, 'export default is reserved for i18n.ts')
  }
}

// ── Rules 3 & 4: Tailwind arbitrary values and cn() wrapping ─────────────────
for (const file of sourceFiles.filter((name) => name.endsWith('.tsx'))) {
  const source = stripComments(readFileSync(file, 'utf8'))

  for (const literal of source.match(STRING_LITERAL) ?? []) {
    if (ARBITRARY_UTILITY.test(literal)) {
      report('tailwind-arbitrary', file, `arbitrary value in ${literal.trim()}`)
    }
  }

  for (const match of source.matchAll(/className=(\{?)/g)) {
    const rest = source.slice(match.index + match[0].length)
    if (match[1] !== '{') {
      report('cn-wrapper', file, 'className="..." must be wrapped in cn(...)')
    } else if (!rest.trimStart().startsWith('cn(')) {
      report('cn-wrapper', file, `className={${rest.slice(0, 24).trim()}…} is not wrapped in cn(...)`)
    }
  }
}

// ── Rule 5a: no hardcoded UI text ────────────────────────────────────────────
for (const file of sourceFiles.filter((name) => name.endsWith('.tsx'))) {
  const source = stripComments(readFileSync(file, 'utf8'))

  source.split('\n').forEach((line, index) => {
    if (CJK.test(line) || VIETNAMESE.test(line)) {
      report('i18n-hardcoded', `${file}:${index + 1}`, `literal display text: ${line.trim()}`)
    }
  })

  for (const [, attribute, value] of source.matchAll(TEXT_ATTRIBUTES)) {
    report('i18n-hardcoded', file, `${attribute}="${value}" should come from t(...)`)
  }
}

// ── Rule 5b: locale key parity ───────────────────────────────────────────────
const flatten = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, entry]) =>
    entry && typeof entry === 'object'
      ? flatten(entry, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const namespaces = readdirSync(join(SRC, 'locales', 'ja')).map((file) => file.replace('.json', ''))
let localeKeyTotal = 0

for (const namespace of namespaces) {
  const load = (language) =>
    new Set(
      flatten(JSON.parse(readFileSync(join(SRC, 'locales', language, `${namespace}.json`), 'utf8'))),
    )
  const ja = load('ja')
  const en = load('en')
  localeKeyTotal += ja.size

  const missingInEn = [...ja].filter((key) => !en.has(key))
  const missingInJa = [...en].filter((key) => !ja.has(key))
  if (missingInEn.length || missingInJa.length) {
    report(
      'i18n-parity',
      `locales/${namespace}.json`,
      `missing in en: [${missingInEn}] missing in ja: [${missingInJa}]`,
    )
  }
}

// ── Rule 6: feature module boundaries ────────────────────────────────────────
const featureNames = readdirSync(FEATURES).filter((entry) =>
  statSync(join(FEATURES, entry)).isDirectory(),
)

for (const feature of featureNames) {
  if (!files.includes(`${FEATURES.split(sep).join('/')}/${feature}/index.ts`)) {
    report('feature-barrel', `features/${feature}`, 'missing public barrel index.ts')
  }
}

for (const file of files.filter((name) => /\.(ts|tsx)$/.test(name))) {
  const source = stripComments(readFileSync(file, 'utf8'))
  const owner = file.startsWith('src/features/') ? file.split('/')[2] : null

  for (const [, target] of source.matchAll(/from '@\/features\/([^']+)'/g)) {
    if (target.includes('/')) {
      report('deep-import', file, `@/features/${target} bypasses the barrel`)
    }
  }

  for (const [, target] of source.matchAll(/from '(\.\.[^']*)'/g)) {
    const resolved = relative(SRC, join(file, '..', target)).split(sep).join('/')
    if (resolved.startsWith('features/')) {
      const targetFeature = resolved.split('/')[1]
      if (owner && targetFeature !== owner) {
        report('deep-import', file, `relative import into feature '${targetFeature}'`)
      }
    }
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
const RULES = [
  ['size', `file size (.tsx ≤ ${LIMITS.component}, .ts ≤ ${LIMITS.logicMax})`],
  ['export-default', 'named exports only (except i18n.ts)'],
  ['tailwind-arbitrary', 'zero Tailwind arbitrary values'],
  ['cn-wrapper', 'every className wrapped in cn(...)'],
  ['i18n-hardcoded', 'no hardcoded UI text in components'],
  ['i18n-parity', 'ja/en locale keys match'],
  ['feature-barrel', 'every feature exposes index.ts'],
  ['deep-import', 'no deep cross-feature imports'],
]

console.log(`Audited ${sourceFiles.length} source files, ${localeKeyTotal} locale keys.\n`)

for (const [rule, description] of RULES) {
  const hits = findings.filter((finding) => finding.rule === rule)
  console.log(`${hits.length === 0 ? 'PASS' : 'FAIL'}  ${description}`)
  for (const hit of hits) console.log(`        ${hit.file} — ${hit.detail}`)
}

if (notes.length) {
  console.log('\nNotes (within the hard cap, above the target):')
  for (const note of notes) console.log(`  · ${note}`)
}

console.log(`\n${findings.length === 0 ? 'AUDIT PASSED' : `AUDIT FAILED (${findings.length})`}`)
process.exit(findings.length === 0 ? 0 : 1)
