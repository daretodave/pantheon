import { auth0 } from '@/lib/auth0'
import { HeaderView } from './HeaderView'
import { headerUserFromSession } from './headerUser'

type HeaderProps = {
  tinted?: boolean
}

export async function Header({ tinted = false }: HeaderProps) {
  const session = await auth0.getSession().catch(() => null)
  const user = headerUserFromSession(
    session?.user as Record<string, unknown> | undefined,
  )
  return <HeaderView tinted={tinted} user={user} />
}
