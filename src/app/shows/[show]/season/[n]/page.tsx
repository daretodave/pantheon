import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAllSeasons,
  getAllShows,
  getAllThemes,
  getCanon,
  getSeason,
  getShow,
} from '@/content'
import type { Season, Show, Theme } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import {
  AdjacentSeasons,
  AppearsInList,
  CommentInputStub,
  CommentThread,
  RankTag,
  SeasonBody,
  SeasonDetails,
  SeasonHead,
  SeasonShell,
  ShieldBadge,
  VotePair,
  type AdjacentSide,
  type AppearsInRow,
  type SeasonDetail,
} from '@/components/composition'
import { Bullet } from '@/components/atoms/Bullet'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

type Params = { show: string; n: string }

export function generateStaticParams(): Params[] {
  const out: Params[] = []
  for (const show of getAllShows()) {
    for (const season of getAllSeasons(show.slug)) {
      out.push({ show: show.slug, n: String(season.number) })
    }
  }
  return out
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const show = getShow(params.show)
  if (!show) {
    return buildMetadata({
      title: 'Season',
      description: '',
      path: `/shows/${params.show}/season/${params.n}`,
      noIndex: true,
    })
  }
  const num = Number.parseInt(params.n, 10)
  const season = Number.isFinite(num) ? getSeason(show.slug, num) : null
  if (!season) {
    return buildMetadata({
      title: `${show.name} S${params.n}`,
      description: '',
      path: `/shows/${show.slug}/season/${params.n}`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${show.name} S${season.number} — ${season.title}`,
    description: `Vote and discuss ${show.name} season ${season.number}: ${season.title}.`,
    path: `/shows/${show.slug}/season/${season.number}`,
  })
}

function padRank(n: number | null | undefined): string {
  if (n == null) return '—'
  return `#${String(n).padStart(2, '0')}`
}

function ledeOf(season: Season): string {
  if (season.lede) return season.lede
  return season.blurb_md.trim()
}

function bodyOf(season: Season): string | undefined {
  if (season.body) return season.body
  // When `lede` is authored separately, fall the file body into the
  // section as bonus prose. Otherwise leave it for the lede slot.
  if (season.lede) {
    const rest = season.blurb_md.trim()
    return rest.length > 0 ? rest : undefined
  }
  return undefined
}

function detailsOf(season: Season, show: Show): SeasonDetail[] {
  const out: SeasonDetail[] = []
  if (season.location) out.push({ key: 'Filmed', value: season.location })
  const yr = season.aired_year ?? (
    season.premiere_date ? new Date(season.premiere_date).getUTCFullYear() : null
  )
  if (yr) out.push({ key: 'Aired', value: String(yr) })
  const eps = season.episodes ?? season.ep_count
  if (eps) out.push({ key: 'Episodes', value: String(eps) })
  if (season.cast_note) {
    out.push({ key: 'Cast', value: season.cast_note })
  }
  if (out.length < 4 && season.host) {
    out.push({ key: 'Host', value: season.host })
  }
  if (out.length < 4) {
    out.push({ key: 'Show', value: show.name })
  }
  return out.slice(0, 4)
}

function adjacentByCanon(
  show: Show,
  seasons: Season[],
  current: Season,
): { prev: AdjacentSide | null; next: AdjacentSide | null } {
  const ranked = seasons
    .filter((s) => typeof s.canonical_position === 'number')
    .sort((a, b) => (a.canonical_position ?? 0) - (b.canonical_position ?? 0))
  const pos = ranked.findIndex((s) => s.number === current.number)
  const toSide = (s: Season | undefined | null): AdjacentSide | null => {
    if (!s) return null
    return {
      href: `/shows/${show.slug}/season/${s.number}`,
      rank: s.canonical_position ?? null,
      title: s.title,
      caption: s.tag,
    }
  }
  if (pos === -1) {
    // Current season isn't ranked yet — fall back to by-number siblings.
    const ordered = [...seasons].sort((a, b) => a.number - b.number)
    const idx = ordered.findIndex((s) => s.number === current.number)
    return {
      prev: toSide(idx > 0 ? ordered[idx - 1] : null),
      next: toSide(idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null),
    }
  }
  return {
    prev: toSide(pos > 0 ? ranked[pos - 1] : null),
    next: toSide(pos < ranked.length - 1 ? ranked[pos + 1] : null),
  }
}

function appearsInRowsFor(
  show: Show,
  season: Season,
  themes: Theme[],
  canonRank: number | null,
): AppearsInRow[] {
  const rows: AppearsInRow[] = []
  for (const t of themes) {
    const hit = t.entries.find(
      (e) => e.show === show.slug && e.season === season.number,
    )
    if (!hit) continue
    rows.push({
      href: `/themes/${t.slug}`,
      name: t.title,
      meta: `list · ${t.entries.length} ${t.entries.length === 1 ? 'entry' : 'entries'}`,
    })
  }
  if (canonRank != null) {
    rows.push({
      href: `/shows/${show.slug}/canon`,
      name: `${show.name} — Editor's Canon`,
      meta: `Editor's Canon · ${padRank(canonRank)}`,
    })
  }
  return rows
}

export default function SeasonPage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  const num = Number.parseInt(params.n, 10)
  if (!Number.isFinite(num)) notFound()
  const season = getSeason(show.slug, num)
  if (!season) notFound()

  const seasons = getAllSeasons(show.slug)
  const themes = getAllThemes()
  const canonFile = getCanon(show.slug)
  const canonHit = canonFile?.entries.find((e) => e.season === season.number)
  const canonRank = canonHit?.rank ?? season.canonical_position ?? null

  const articleLd = buildJsonLd({
    type: 'Article',
    headline: `${show.name} S${season.number} — ${season.title}`,
    description: (season.lede ?? season.blurb_md).slice(0, 200),
    path: `/shows/${show.slug}/season/${season.number}`,
    author: 'Pantheon Editors',
    ...(season.premiere_date ? { datePublished: season.premiere_date } : {}),
  })
  const crumbsLd = buildJsonLd({
    type: 'BreadcrumbList',
    trail: [
      { name: 'Pantheons', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: `Season ${season.number}`, path: `/shows/${show.slug}/season/${season.number}` },
    ],
  })

  const seasonTargetId = `${show.slug}:${season.number}`
  const { prev, next } = adjacentByCanon(show, seasons, season)
  const appearsIn = appearsInRowsFor(show, season, themes, canonRank)
  const voteQuestion =
    season.vote_question ?? 'Does this belong in the canon top 10?'

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-season', data: articleLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-season-breadcrumb', data: crumbsLd })} />
      <div className="screen season-page" data-testid="season-page-screen">
        <SeasonShell
          main={
            <>
              <SeasonHead
                crumb={
                  <>
                    <Bullet color="var(--show-primary)" size={9} />
                    <a href="/shows">Pantheons</a>
                    <span aria-hidden="true">/</span>
                    <a href={`/shows/${show.slug}`}>{show.name}</a>
                    <span aria-hidden="true">/</span>
                    <span>Season {season.number}</span>
                  </>
                }
                title={season.title}
                eyebrow={season.eyebrow}
                rankRow={
                  <>
                    <RankTag label="Editor's Canon" value={padRank(canonRank)} />
                    <RankTag label="Community" value="—" />
                    <ShieldBadge inline />
                  </>
                }
              />

              <SeasonBody
                lede={ledeOf(season)}
                body={bodyOf(season)}
                pull={season.pull}
              />

              <SeasonDetails details={detailsOf(season, show)} />

              <div
                className="season-vote-block"
                data-testid="season-vote-block"
                aria-label="Vote on this season"
              >
                <div className="season-vote-head">
                  <div className="season-vote-q">{voteQuestion}</div>
                  <div className="season-vote-meta">
                    vote once per reader · change your mind within 72h
                  </div>
                </div>
                <VotePair
                  initialCount={0}
                  targetType="season"
                  targetId={seasonTargetId}
                  label="net votes"
                />
              </div>

              <AdjacentSeasons prev={prev} next={next} />

              <AppearsInList rows={appearsIn} />
            </>
          }
          aside={
            <CommentThread
              count={0}
              input={
                <CommentInputStub
                  signInHref={`/sign-in?return=/shows/${show.slug}/season/${season.number}`}
                />
              }
            />
          }
        />
      </div>
    </ShowPaletteScope>
  )
}
