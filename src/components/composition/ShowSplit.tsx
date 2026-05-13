import Link from 'next/link'

export type ShowSplitPanel = {
  href: string
  tag: string
  title: string
  blurb: string
  go: string
}

type ShowSplitProps = {
  canon: ShowSplitPanel
  community: ShowSplitPanel
}

function SplitButton({
  panel,
  testid,
}: {
  panel: ShowSplitPanel
  testid: string
}) {
  return (
    <Link className="split-btn" href={panel.href} data-testid={testid}>
      <div className="split-btn-tag">{panel.tag}</div>
      <div className="split-btn-title">{panel.title}</div>
      <div className="split-btn-blurb">{panel.blurb}</div>
      <div className="split-btn-go">{panel.go}</div>
    </Link>
  )
}

export function ShowSplit({ canon, community }: ShowSplitProps) {
  return (
    <section className="show-split" data-testid="show-split" aria-label="canon and community">
      <SplitButton panel={canon} testid="split-btn-canon" />
      <SplitButton panel={community} testid="split-btn-community" />
    </section>
  )
}
