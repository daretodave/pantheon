// Helpers for reading the Auth0 `permissions` custom claim.
// Set by the `Add Pantheon claims` Auth0 Action — see
// setup/04_auth0.md §H. The claim is stored under the
// `https://pantheon.app/permissions` namespace per bearings
// line 116.
//
// Auth0 sometimes emits the claim as a JSON array of strings
// and sometimes as a single comma-separated string (depending
// on how the dashboard was configured). This helper normalizes
// both shapes.

export const PERMISSIONS_CLAIM = 'https://pantheon.app/permissions'

export type Permission =
  | 'mod:read'
  | 'mod:approve'
  | 'mod:hide'
  | 'mod:remove'
  | 'mod:unhide'
  | 'mod:dismiss_flag'

function asUnknown(user: unknown): Record<string, unknown> | null {
  if (!user || typeof user !== 'object') return null
  return user as Record<string, unknown>
}

export function readPermissions(user: unknown): string[] {
  const u = asUnknown(user)
  if (!u) return []
  const raw = u[PERMISSIONS_CLAIM]
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string')
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
  return []
}

export function hasPermission(user: unknown, permission: Permission): boolean {
  return readPermissions(user).includes(permission)
}

export function isMod(user: unknown): boolean {
  return hasPermission(user, 'mod:read')
}
