import { describe, expect, it } from 'vitest'
import { headerUserFromSession } from '../headerUser'

describe('headerUserFromSession', () => {
  it('returns null for missing user', () => {
    expect(headerUserFromSession(null)).toBeNull()
    expect(headerUserFromSession(undefined)).toBeNull()
  })

  it('prefers nickname when present', () => {
    expect(
      headerUserFromSession({ nickname: 'asha', email: 'asha@example.com' }),
    ).toEqual({ handle: 'asha', displayLabel: '@asha', profileHref: '/u/asha' })
  })

  it('strips leading @ from nickname', () => {
    expect(headerUserFromSession({ nickname: '@asha' })).toEqual({
      handle: 'asha',
      displayLabel: '@asha',
      profileHref: '/u/asha',
    })
  })

  it('falls back to email local part when nickname is missing', () => {
    expect(headerUserFromSession({ email: 'Pat.Smith@example.com' })).toEqual({
      handle: 'pat.smith',
      displayLabel: '@pat.smith',
      profileHref: '/u/pat.smith',
    })
  })

  it('falls back to sub when nickname + email are missing', () => {
    expect(headerUserFromSession({ sub: 'auth0|abc123' })).toEqual({
      handle: 'auth0-abc123',
      displayLabel: '@auth0-abc123',
      profileHref: '/u/auth0-abc123',
    })
  })

  it('returns null when the user object has no useful identifiers', () => {
    expect(headerUserFromSession({ irrelevant: 1 })).toBeNull()
    expect(headerUserFromSession({ nickname: '   ' })).toBeNull()
  })
})
