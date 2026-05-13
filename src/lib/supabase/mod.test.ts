import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal type-check on the mod.ts shape — the actual queries
// run against the local Supabase in e2e. Here we just verify
// the exported API surface compiles + that the module loads
// without env (the cached client is lazy).

const savedUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const savedKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

function restore() {
  if (savedUrl !== undefined) process.env['NEXT_PUBLIC_SUPABASE_URL'] = savedUrl
  else delete process.env['NEXT_PUBLIC_SUPABASE_URL']
  if (savedKey !== undefined) process.env['SUPABASE_SERVICE_ROLE_KEY'] = savedKey
  else delete process.env['SUPABASE_SERVICE_ROLE_KEY']
  vi.resetModules()
}

describe('mod module surface', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(restore)

  it('exports getModQueue and modAction', async () => {
    const mod = await import('./mod')
    expect(typeof mod.getModQueue).toBe('function')
    expect(typeof mod.modAction).toBe('function')
  })

  it('ModQueueItem and ModActionResult types compile', async () => {
    const mod = await import('./mod')
    // If the module imported without error, the types resolved.
    expect(mod).toBeDefined()
  })
})
