import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CANONICAL_LABELS,
  canonicalNames,
  diffLabels,
} from '../lib/triage-labels.mjs'

test('canonical set has exactly 13 labels', () => {
  assert.equal(CANONICAL_LABELS.length, 13)
  assert.equal(canonicalNames().length, 13)
})

test('canonical names are unique', () => {
  const names = canonicalNames()
  assert.equal(new Set(names).size, names.length)
})

test('canonical set includes the 4 triage:* status labels', () => {
  const names = new Set(canonicalNames())
  for (const expected of [
    'triage:loop-queued',
    'triage:needs-user',
    'triage:closed',
    'triage:reviewed',
  ]) {
    assert.ok(names.has(expected), `missing ${expected}`)
  }
})

test('canonical set includes the 8 category labels', () => {
  const names = new Set(canonicalNames())
  for (const expected of [
    'bug',
    'enhancement',
    'content',
    'data',
    'docs',
    'seo',
    'a11y',
    'perf',
  ]) {
    assert.ok(names.has(expected), `missing ${expected}`)
  }
})

test('canonical set includes the spoiler P0 label', () => {
  assert.ok(canonicalNames().includes('spoiler'))
})

test('every label entry has name + description + color', () => {
  for (const l of CANONICAL_LABELS) {
    assert.equal(typeof l.name, 'string')
    assert.ok(l.name.length > 0)
    assert.equal(typeof l.description, 'string')
    assert.ok(l.description.length > 0)
    assert.match(l.color, /^[0-9a-f]{6}$/i)
  }
})

test('diffLabels reports missing canonical labels', () => {
  const actual = ['bug', 'spoiler']
  const { missing, extra } = diffLabels(actual)
  assert.ok(missing.includes('triage:loop-queued'))
  assert.ok(missing.includes('enhancement'))
  assert.deepEqual(extra, [])
})

test('diffLabels reports extras (non-canonical names on the repo)', () => {
  const actual = [...canonicalNames(), 'legacy:loop-queued', 'wontfix']
  const { missing, extra } = diffLabels(actual)
  assert.deepEqual(missing, [])
  assert.deepEqual(extra.sort(), ['legacy:loop-queued', 'wontfix'].sort())
})

test('diffLabels returns empty arrays when actual = canonical', () => {
  const { missing, extra } = diffLabels(canonicalNames())
  assert.deepEqual(missing, [])
  assert.deepEqual(extra, [])
})
