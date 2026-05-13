import { describe, expect, it } from 'vitest'

// The FAQs array is private to the page module. We re-export
// behavior assertions via the JSON-LD that the e2e walks, but
// this unit-level test smoke-checks that the page module
// imports without crashing — primarily a guard against a stale
// content/legal/about.md filename or schema change breaking
// build.

describe('/about page module', () => {
  it('exports a default page component', async () => {
    const mod = await import('../page')
    expect(typeof mod.default).toBe('function')
  })

  it('exports generateMetadata', async () => {
    const mod = await import('../page')
    expect(typeof mod.generateMetadata).toBe('function')
  })
})
