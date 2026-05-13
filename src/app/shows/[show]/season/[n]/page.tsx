import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAllSeasons,
  getAllShows,
  getSeason,
  getShow,
} from '@/content'
import { PaletteScope } from '@/components/facade'
import {
  CommentInputStub,
  CommentThread,
  SeasonHead,
  SeasonShell,
  ShieldBadge,
  VotePair,
} from '@/components/composition'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'
import { ShowSigilArt } from '../../ShowSigilArt'

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

export default function SeasonPage({ params }: { params: Params }) {
  const show = getShow(params.show)
  if (!show) notFound()
  const num = Number.parseInt(params.n, 10)
  if (!Number.isFinite(num)) notFound()
  const season = getSeason(show.slug, num)
  if (!season) notFound()

  const articleLd = buildJsonLd({
    type: 'Article',
    headline: `${show.name} S${season.number} — ${season.title}`,
    description: season.blurb_md.slice(0, 200),
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

  return (
    <PaletteScope show={show.slug}>
      <script {...jsonLdScriptProps({ id: 'ld-season', data: articleLd })} />
      <script {...jsonLdScriptProps({ id: 'ld-season-breadcrumb', data: crumbsLd })} />
      <div className="screen season-page" data-testid="season-page-screen">
        <SeasonShell
          main={
            <>
              <SeasonHead
                crumb={
                  <>
                    <a href="/shows">Pantheons</a> /{' '}
                    <a href={`/shows/${show.slug}`}>{show.name}</a> /{' '}
                    <span>Season {season.number}</span>
                  </>
                }
                sigil={<ShowSigilArt slug={show.slug} name={show.name} />}
                title={season.title}
                rankRow={
                  <>
                    {season.canonical_position ? (
                      <div className="season-rank-tag">
                        <span className="season-rank-label">Editor&rsquo;s Canon</span>
                        <span className="season-rank-num">
                          #{String(season.canonical_position).padStart(2, '0')}
                        </span>
                      </div>
                    ) : null}
                    <ShieldBadge inline />
                  </>
                }
              />

              <div className="season-body" data-testid="season-blurb">
                <p className="season-lede">{season.blurb_md.trim()}</p>
              </div>

              <div
                className="season-vote-block"
                data-testid="season-vote-block"
                aria-label="Vote on this season"
              >
                <div className="season-vote-head">
                  <div className="season-vote-q">
                    Does this belong in the canon top 10?
                  </div>
                  <div className="season-vote-meta">
                    Votes land for real in phase 11 — this is the working shell.
                  </div>
                </div>
                <VotePair
                  initialCount={0}
                  targetType="season"
                  targetId={seasonTargetId}
                  label="tilt"
                />
              </div>
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
    </PaletteScope>
  )
}
