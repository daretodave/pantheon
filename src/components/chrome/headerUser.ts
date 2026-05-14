export type HeaderUser = {
  handle: string
  displayLabel: string
  profileHref: string
}

export function headerUserFromSession(
  raw: Record<string, unknown> | null | undefined,
): HeaderUser | null {
  if (!raw) return null

  const nickname = typeof raw['nickname'] === 'string' ? raw['nickname'].trim() : ''
  if (nickname) {
    const handle = nickname.replace(/^@+/, '')
    return { handle, displayLabel: `@${handle}`, profileHref: `/u/${handle}` }
  }

  const email = typeof raw['email'] === 'string' ? raw['email'].trim() : ''
  if (email) {
    const local = email.split('@')[0] ?? ''
    if (local) {
      const handle = local.toLowerCase()
      return { handle, displayLabel: `@${handle}`, profileHref: `/u/${handle}` }
    }
  }

  const sub = typeof raw['sub'] === 'string' ? raw['sub'] : ''
  if (sub) {
    const handle = sub.replace(/[^a-z0-9-]/gi, '-').slice(0, 32).toLowerCase()
    if (handle) {
      return { handle, displayLabel: `@${handle}`, profileHref: `/u/${handle}` }
    }
  }

  return null
}
