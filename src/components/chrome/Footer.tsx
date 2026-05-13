import { FooterAboutCol } from './footer/FooterAboutCol'
import { FooterBrand } from './footer/FooterBrand'
import { FooterMeta } from './footer/FooterMeta'
import { FooterPantheonsCol } from './footer/FooterPantheonsCol'

type FooterProps = {
  tinted?: boolean
}

export function Footer({ tinted = false }: FooterProps) {
  const rootClass = tinted ? 'site-footer tinted' : 'site-footer'
  return (
    <footer
      data-testid="site-footer"
      data-tinted={tinted ? 'true' : undefined}
      className={rootClass}
    >
      <div className="site-footer-cols">
        <FooterBrand />
        <FooterPantheonsCol />
        <FooterAboutCol />
      </div>
      <FooterMeta />
    </footer>
  )
}
