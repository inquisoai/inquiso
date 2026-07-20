#!/usr/bin/env node
// Enforces the ≤100-lines-per-file rule (docs/08-coding-standards.md).
// Fails CI if any tracked source file exceeds the limit.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const LIMIT = 100
const ROOTS = ['src', 'scripts', 'tests']
const EXTS = ['.ts', '.tsx', '.mjs', '.js', '.css']

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, acc)
    else if (EXTS.some((e) => path.endsWith(e))) acc.push(path)
  }
  return acc
}

const offenders = []
for (const root of ROOTS) {
  let files = []
  try {
    files = walk(root)
  } catch {
    continue
  }
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n').length
    if (lines > LIMIT) offenders.push(`${file}: ${lines} lines`)
  }
}

if (offenders.length > 0) {
  console.error(`Files exceeding ${LIMIT} lines:\n${offenders.join('\n')}`)
  process.exit(1)
}
console.log(`✓ all files within ${LIMIT} lines`)
