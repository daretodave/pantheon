import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const savedFake = process.env['OPENAI_FAKE']
const savedKey = process.env['OPENAI_API_KEY']

function restore() {
  if (savedFake !== undefined) process.env['OPENAI_FAKE'] = savedFake
  else delete process.env['OPENAI_FAKE']
  if (savedKey !== undefined) process.env['OPENAI_API_KEY'] = savedKey
  else delete process.env['OPENAI_API_KEY']
  vi.resetModules()
}

describe('moderateComment — fake stub (OPENAI_FAKE=1)', () => {
  beforeEach(() => {
    process.env['OPENAI_FAKE'] = '1'
    vi.resetModules()
  })
  afterEach(restore)

  it('blocks anything containing WINNER', async () => {
    const { moderateComment } = await import('./preFilter')
    const v = await moderateComment('the WINNER was obvious')
    expect(v.verdict).toBe('block')
    expect(v.categories).toEqual(['spoiler_winner'])
    expect(v.confidence).toBe(1)
  })

  it('blocks lowercase winner too (case-insensitive)', async () => {
    const { moderateComment } = await import('./preFilter')
    const v = await moderateComment('this season had a clear winner')
    expect(v.verdict).toBe('block')
  })

  it('flags anything containing SPOILER', async () => {
    const { moderateComment } = await import('./preFilter')
    const v = await moderateComment('SPOILER alert: it was a great season')
    expect(v.verdict).toBe('flag')
    expect(v.categories).toEqual(['spoiler_plot'])
  })

  it('allows anything else', async () => {
    const { moderateComment } = await import('./preFilter')
    const v = await moderateComment('this season was filmed in Fiji and the cast was great')
    expect(v.verdict).toBe('allow')
    expect(v.categories).toEqual([])
    expect(v.redacted_phrase).toBeNull()
  })
})

describe('moderateComment — fallback path when API key missing', () => {
  beforeEach(() => {
    delete process.env['OPENAI_FAKE']
    delete process.env['OPENAI_API_KEY']
    vi.resetModules()
  })
  afterEach(restore)

  it('returns verdict=flag with reason starting "fallback:" on missing key', async () => {
    const { moderateComment } = await import('./preFilter')
    const v = await moderateComment('any body')
    expect(v.verdict).toBe('flag')
    expect(v.reason).toMatch(/^fallback:/)
    expect(v.confidence).toBe(0)
  })
})

describe('verdictSchema — zod shape', () => {
  it('rejects extra fields', async () => {
    const { verdictSchema } = await import('./preFilter')
    const ok = verdictSchema.safeParse({
      verdict: 'allow',
      categories: [],
      confidence: 0.8,
      reason: 'looks fine',
      redacted_phrase: null,
    })
    expect(ok.success).toBe(true)
  })

  it('rejects bad verdict', async () => {
    const { verdictSchema } = await import('./preFilter')
    const bad = verdictSchema.safeParse({
      verdict: 'maybe',
      categories: [],
      confidence: 0.8,
      reason: 'x',
      redacted_phrase: null,
    })
    expect(bad.success).toBe(false)
  })

  it('rejects bad category enum', async () => {
    const { verdictSchema } = await import('./preFilter')
    const bad = verdictSchema.safeParse({
      verdict: 'flag',
      categories: ['something_random'],
      confidence: 0.8,
      reason: 'x',
      redacted_phrase: null,
    })
    expect(bad.success).toBe(false)
  })
})
