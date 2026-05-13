import Link from 'next/link'
import { getAllShows } from '@/content/loaders'
import { Bullet } from '@/components/atoms/Bullet'

export function FooterPantheonsCol() {
  const shows = getAllShows().slice(0, 3)
  return (
    <nav
      className="site-footer-col"
      aria-label="Pantheons"
      data-testid="site-footer-pantheons-col"
    >
      <h2 className="site-footer-col-head">Pantheons</h2>
      <ul>
        {shows.map((s) => (
          <li key={s.slug}>
            <Link href={`/shows/${s.slug}`} prefetch={false}>
              <Bullet color={s.palette.primary} size={8} />
              <span>{s.name}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/shows"
            prefetch={false}
            className="site-footer-col-link-meta"
          >
            All shows →
          </Link>
        </li>
      </ul>
    </nav>
  )
}
