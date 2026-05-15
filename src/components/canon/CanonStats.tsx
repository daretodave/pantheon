import type { CanonFile } from '@/content'

type CanonStatsProps = {
  entryCount: number
  canon: CanonFile | null
}

function formatRevised(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function CanonStats({ entryCount, canon }: CanonStatsProps) {
  const revised = canon?.last_revised ? formatRevised(canon.last_revised) : '—'
  const editor = canon?.editor ?? 'tiered.tv Editors'
  return (
    <div className="cp-head-stats" data-testid="canon-stats">
      <div className="cp-head-stat" data-testid="canon-stat-entries">
        <span className="k">Entries</span>
        <span className="v">{entryCount}</span>
      </div>
      <div className="cp-head-stat" data-testid="canon-stat-revised">
        <span className="k cp-canon-only">Last revised</span>
        <span className="k cp-community-only">
          <span className="cp-live-dot" />
          Last recompute
        </span>
        <span className="v cp-canon-only">{revised}</span>
        <span className="v warm cp-community-only">votes pending</span>
      </div>
      <div className="cp-head-stat" data-testid="canon-stat-editor">
        <span className="k cp-canon-only">Editor</span>
        <span className="k cp-community-only">Voters this week</span>
        <span className="v cp-canon-only">{editor}</span>
        <span className="v cp-community-only">—</span>
      </div>
    </div>
  )
}
