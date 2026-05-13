import pkg from '../../../../package.json' with { type: 'json' }
import { ThemeToggle } from '../ThemeToggle'

const PACKAGE_VERSION = (pkg as { version?: string }).version ?? '0.0.0'

export function FooterMeta() {
  const year = new Date().getFullYear()
  return (
    <div className="site-footer-meta" data-testid="site-footer-meta">
      <span className="site-footer-meta-rebellion">
        © {year} Pantheon · est. as a quiet rebellion against ranked lists that
        ruin the show
      </span>
      <span
        className="site-footer-meta-version"
        data-testid="site-footer-meta-version"
      >
        v{PACKAGE_VERSION}
      </span>
      <span className="site-footer-meta-toggle">
        <ThemeToggle />
      </span>
    </div>
  )
}
