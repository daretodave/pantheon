import { BrandMark } from '../BrandMark'

export function FooterBrand() {
  return (
    <div className="site-footer-brand" data-testid="site-footer-brand">
      <span className="site-footer-brand-lockup">
        <BrandMark size={22} />
        <span>Pantheon</span>
      </span>
      <p className="site-footer-promise" data-testid="site-footer-promise">
        the seasons, ranked. <em>no spoilers.</em>
      </p>
    </div>
  )
}
