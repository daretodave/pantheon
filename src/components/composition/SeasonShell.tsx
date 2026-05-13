import type { ReactNode } from 'react'

type SeasonShellProps = {
  main: ReactNode
  aside: ReactNode
}

export function SeasonShell({ main, aside }: SeasonShellProps) {
  return (
    <div className="season-shell" data-testid="season-shell">
      <article className="season-main" data-testid="season-main">
        {main}
      </article>
      <aside className="season-aside" data-testid="season-aside">
        {aside}
      </aside>
    </div>
  )
}
