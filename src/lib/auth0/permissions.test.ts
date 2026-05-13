import { describe, expect, it } from 'vitest'
import {
  PERMISSIONS_CLAIM,
  hasPermission,
  isMod,
  readPermissions,
} from './permissions'

describe('readPermissions', () => {
  it('returns [] for null / undefined / empty', () => {
    expect(readPermissions(null)).toEqual([])
    expect(readPermissions(undefined)).toEqual([])
    expect(readPermissions({})).toEqual([])
  })

  it('returns the array claim verbatim', () => {
    const user = {
      [PERMISSIONS_CLAIM]: ['mod:read', 'mod:hide'],
    }
    expect(readPermissions(user)).toEqual(['mod:read', 'mod:hide'])
  })

  it('drops non-string entries from the array claim', () => {
    const user = {
      [PERMISSIONS_CLAIM]: ['mod:read', 42, null, 'mod:hide'],
    }
    expect(readPermissions(user)).toEqual(['mod:read', 'mod:hide'])
  })

  it('splits comma-separated string claims', () => {
    const user = {
      [PERMISSIONS_CLAIM]: 'mod:read, mod:hide ,mod:remove',
    }
    expect(readPermissions(user)).toEqual(['mod:read', 'mod:hide', 'mod:remove'])
  })

  it('ignores unrelated claim keys', () => {
    const user = {
      'https://other.example.com/permissions': ['mod:read'],
    }
    expect(readPermissions(user)).toEqual([])
  })
})

describe('hasPermission', () => {
  it('true when the claim contains the permission', () => {
    const user = { [PERMISSIONS_CLAIM]: ['mod:read', 'mod:hide'] }
    expect(hasPermission(user, 'mod:read')).toBe(true)
    expect(hasPermission(user, 'mod:hide')).toBe(true)
  })

  it('false when the claim lacks the permission', () => {
    const user = { [PERMISSIONS_CLAIM]: ['mod:read'] }
    expect(hasPermission(user, 'mod:remove')).toBe(false)
  })

  it('false on missing user / claim', () => {
    expect(hasPermission(null, 'mod:read')).toBe(false)
    expect(hasPermission({}, 'mod:read')).toBe(false)
  })
})

describe('isMod', () => {
  it('reads the mod:read permission specifically', () => {
    expect(isMod({ [PERMISSIONS_CLAIM]: ['mod:read'] })).toBe(true)
    expect(isMod({ [PERMISSIONS_CLAIM]: ['mod:approve'] })).toBe(false)
    expect(isMod({ [PERMISSIONS_CLAIM]: [] })).toBe(false)
  })
})
