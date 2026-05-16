import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import {
  getAllSeasons,
  getAllShows,
  getAllThemes,
  getCanon,
  getSeason,
  getSeasonBySlug,
  getShow,
} from '@/content'
import type { Season, Show, Theme } from '@/content'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import {
  AdjacentSeasons,
  AppearsInList,
  CommentInput,
  CommentInputStub,
  CommentThread,
  SeasonEpStrip,
  SeasonHero,
  SeasonInfoCard,
  SeasonStatsStrip,
  SeasonTOC,
  ShieldBadge,
  VotePair,
  WatchList,
  type AdjacentSide,
  type AppearsInRow,
  type SeasonStat,
  type TOCSection,
} from '@/components/composition'
import { Bullet } from '@/components/atoms/Bullet'
import { auth0 } from '@/lib/auth0'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

type Params = { show: string; slug: string }

export function generateStaticParams(): Params[] {
  const out: Params[] = []
  for (const show of getAllShows()) {
    for (const season of getAllSeasons(show.slug)) {
      out.push({ show: show.slug, slug: season.slug })
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
      path: `/shows/${params.show}/season/${params.slug}`,
      noIndex: true,
    })
  }
  const season = getSeasonBySlug(show.slug, params.slug)
  if (!season) {
    return buildMetadata({
      title: `${show.name} season`,
      description: '',
      path: `/shows/${show.slug}/season/${params.slug}`,
      noIndex: true,
    })
  }
  return buildMetadata({
    title: `${show.name} S${season.number} — ${season.title}`,
    description: `Vote and discuss ${show.name} season ${season.number}: ${season.title}.`,
    path: `/shows/${show.slug}/season/${season.slug}`,
  })
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ledeOf(season: Season): string {
  if (season.lede) return season.lede
  return season.blurb_md.trim()
}

function bodyOf(season: Season): string | undefined {
  if (season.body) return season.body
  if (season.lede) {
    const rest = season.blurb_md.trim()
    return rest.length > 0 ? rest : undefined
  }
  return undefined
}

function statsFor(season: Season): SeasonStat[] {
  const premieredVal = season.premiere_date
    ? new Date(season.premiere_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : season.aired_year
      ? String(season.aired_year)
      : undefined
  const epsVal = season.ep_count ?? season.episodes
  return [
    { key: 'Filmed', value: season.location, caption: season.filming_caption },
    { key: 'Premiered', value: premieredVal, caption: season.premiere_caption },
    {
      key: 'Episodes',
      value: epsVal != null ? String(epsVal) : undefined,
      caption: season.episodes_caption,
    },
    {
      key: 'Format',
      value: season.format_summary,
      caption: season.format_caption,
    },
    {
      key: 'Cast size',
      value:
        season.cast_size != null
          ? `${season.cast_size} ${season.cast_size === 1 ? 'player' : 'players'}`
          : season.cast_note,
      caption: season.cast_size_caption,
    },
    { key: 'Host', value: season.host, caption: season.host_caption },
  ]
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
      href: `/shows/${show.slug}/season/${s.slug}`,
      rank: s.canonical_position ?? null,
      title: s.title,
      caption: s.tag,
    }
  }
  if (pos === -1) {
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
    // Phase 33: canon consolidated into the show page; canon is the
    // default ranking view there.
    rows.push({
      href: `/shows/${show.slug}`,
      name: `${show.name} — Editor's Canon`,
      meta: `Editor's Canon · #${pad2(canonRank)}`,
    })
  }
  return rows
}

function paragraphsOf(body: string): string[] {
  return body
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function whereItSitsCopy(
  show: Show,
  canonRank: number | null,
  canonTotal: number,
): string {
  if (canonRank == null || canonTotal === 0) {
    return `Canon position not assigned yet — the editors' draft is still in progress for ${show.name}. Check back as the canon fills in.`
  }
  if (canonTotal === 1) {
    return `Sole entry in the ${show.name} Editor's Canon so far. Adjacent picks land as the canon grows.`
  }
  return `Slot #${pad2(canonRank)} of ${canonTotal} in the ${show.name} Editor's Canon. The neighbors below frame what we ranked above and below it.`
}

// 31a: digit-form back-compat. URLs like `/shows/survivor/season/4`
// resolve the season by number and 308 to its canonical slug form.
// Decided to do this in the page instead of middleware so the
// resolver can use the existing content loaders without forcing
// the middleware onto an experimental Node.js runtime — the
// user-visible behavior (`/season/4` → `/season/marquesas`) is
// identical, and Next.js's permanentRedirect emits a 308.
const DIGIT_PARAM_RE = /^\d+$/

export default async function SeasonPage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  if (DIGIT_PARAM_RE.test(params.slug)) {
    const n = Number.parseInt(params.slug, 10)
    const bySeason = getSeason(show.slug, n)
    if (bySeason) {
      permanentRedirect(`/shows/${show.slug}/season/${bySeason.slug}`)
    }
    notFound()
  }
  const season = getSeasonBySlug(show.slug, params.slug)
  if (!season) notFound()

  const session = await auth0.getSession().catch(() => null)
  const authed = Boolean(session?.user)

  const seasons = getAllSeasons(show.slug)
  const themes = getAllThemes()
  const canonFile = getCanon(show.slug)
  const canonHit = canonFile?.entries.find((e) => e.season === season.number)
  const canonRank = canonHit?.rank ?? season.canonical_position ?? null
  const canonTotal = canonFile?.entries.length ?? show.seasons

  const articleLd = buildJsonLd({
    type: 'Article',
    headline: `${show.name} S${season.number} — ${season.title}`,
    description: (season.lede ?? season.blurb_md).slice(0, 200),
    path: `/shows/${show.slug}/season/${season.slug}`,
    author: 'tiered.tv Editors',
    ...(season.premiere_date ? { datePublished: season.premiere_date } : {}),
  })
  const crumbsLd = buildJsonLd({
    type: 'BreadcrumbList',
    trail: [
      { name: 'Tiers', path: '/shows' },
      { name: show.name, path: `/shows/${show.slug}` },
      { name: `Season ${season.number}`, path: `/shows/${show.slug}/season/${season.slug}` },
    ],
  })

  const seasonTargetId = `${show.slug}:${season.number}`
  const { prev, next } = adjacentByCanon(show, seasons, season)
  const appearsIn = appearsInRowsFor(show, season, themes, canonRank)
  const voteQuestion =
    season.vote_question ?? 'Does this belong in the community top 10?'

  const lede = ledeOf(season)
  const body = bodyOf(season)
  const bodyParagraphs = body ? paragraphsOf(body) : []
  const wordsForRead = `${lede} ${body ?? ''}`
    .split(/\s+/)
    .filter(Boolean).length
  const readMinutes = Math.max(1, Math.round(wordsForRead / 220))

  const stats = statsFor(season)
  const populatedStats = stats.filter(
    (s) => (s.value && s.value.length > 0) || (s.caption && s.caption.length > 0),
  )
  const statsVisible = populatedStats.length >= 3
  const epHeatVisible = (season.episode_heat?.length ?? 0) > 0
  const watchVisible = (season.watch_list?.length ?? 0) > 0
  const shapeHasCopy = bodyParagraphs.length > 0
  const adjacentVisible = Boolean(prev || next)

  const sections: TOCSection[] = [
    { id: 's-take', num: '01', label: 'The take' },
    ...(shapeHasCopy ? [{ id: 's-shape', num: '02', label: 'The shape of the season' }] : []),
    { id: 's-where', num: '03', label: 'Where it sits in the canon' },
    ...(watchVisible ? [{ id: 's-watch', num: '04', label: 'What to watch for' }] : []),
    ...(adjacentVisible ? [{ id: 's-related', num: '05', label: 'Adjacent in the canon' }] : []),
    ...(appearsIn.length > 0 ? [{ id: 's-appears', num: '06', label: 'Also appears in' }] : []),
  ]

  return (
    <ShowPaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-season', data: articleLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-season-breadcrumb', data: crumbsLd })} />
      <div className="screen season-page" data-testid="season-page-screen">
        <SeasonHero
          crumb={
            <>
              <Bullet color="var(--show-primary)" size={9} />
              <a href="/shows">Tiers</a>
              <span aria-hidden="true">/</span>
              <a href={`/shows/${show.slug}`}>{show.name}</a>
              <span aria-hidden="true">/</span>
              <span>Season {season.number}</span>
            </>
          }
          eyebrow={season.eyebrow}
          title={season.title}
          displayTitle={season.display_title}
          lede={lede}
          byline={
            <>
              <span>Canon entry by <span className="who">tiered.tv Editors</span></span>
              <span className="dot" aria-hidden="true" />
              <span className="read">{readMinutes} min read</span>
            </>
          }
          infoCard={
            <SeasonInfoCard
              canonRank={canonRank}
              canonTotal={canonTotal}
              canonMeta={`${canonTotal} ${canonTotal === 1 ? 'season' : 'seasons'}`}
              voteQuestion={voteQuestion}
              voteSlot={
                <VotePair
                  initialCount={0}
                  targetType="season"
                  targetId={seasonTargetId}
                  label="net votes"
                />
              }
            />
          }
        />

        {statsVisible ? <SeasonStatsStrip stats={populatedStats} /> : null}

        {epHeatVisible ? (
          <SeasonEpStrip
            heat={season.episode_heat}
            caption={season.episode_heat_caption}
          />
        ) : null}

        <div className="body-grid">
          <SeasonTOC sections={sections} />

          <article className="article" data-testid="season-article">
            <section id="s-take" data-testid="section-take">
              <div className="article-eyebrow"><span className="num">01</span><span>The take</span></div>
              <h2>{season.title}.</h2>
              <p data-testid="season-lede">{lede}</p>
              {season.pull ? (
                <blockquote className="season-pull" data-testid="season-pull">
                  {season.pull}
                </blockquote>
              ) : null}
            </section>

            {shapeHasCopy ? (
              <section id="s-shape" data-testid="section-shape">
                <div className="article-eyebrow"><span className="num">02</span><span>The shape of the season</span></div>
                <h2>A rhythm worth tracking.</h2>
                {bodyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ) : null}

            <section id="s-where" data-testid="section-where">
              <div className="article-eyebrow"><span className="num">03</span><span>Where it sits in the canon</span></div>
              <h2>
                {canonRank != null
                  ? `The #${pad2(canonRank)} slot.`
                  : 'Awaiting a canon slot.'}
              </h2>
              <p>{whereItSitsCopy(show, canonRank, canonTotal)}</p>
              <ShieldBadge />
            </section>

            {watchVisible ? (
              <section id="s-watch" data-testid="section-watch">
                <div className="article-eyebrow"><span className="num">04</span><span>What to watch for</span></div>
                <h2>{`${season.watch_list?.length ?? 0} moments, no spoilers.`}</h2>
                <WatchList items={season.watch_list} />
              </section>
            ) : null}

            {adjacentVisible ? (
              <section id="s-related" data-testid="section-related">
                <div className="article-eyebrow"><span className="num">05</span><span>Adjacent in the canon</span></div>
                <h2>Read next.</h2>
                <AdjacentSeasons prev={prev} next={next} />
              </section>
            ) : null}

            {appearsIn.length > 0 ? (
              <section id="s-appears" data-testid="section-appears">
                <div className="article-eyebrow"><span className="num">06</span><span>Also appears in</span></div>
                <h2>Cross-references.</h2>
                <AppearsInList rows={appearsIn} />
              </section>
            ) : null}
          </article>

          <aside className="thread" data-testid="season-thread" aria-label="Reader thread">
            <CommentThread
              count={0}
              input={
                authed ? (
                  <CommentInput
                    targetType="season"
                    targetId={seasonTargetId}
                  />
                ) : (
                  <CommentInputStub
                    signInHref={`/sign-in?return=/shows/${show.slug}/season/${season.slug}`}
                  />
                )
              }
            />
          </aside>
        </div>
      </div>
    </ShowPaletteScope>
  )
}
