import { z } from 'zod'

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { message: 'must be a #RRGGBB hex color' })

const slugRe = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(slugRe, { message: 'must be lowercase kebab-case' })

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'must be ISO date YYYY-MM-DD' })

export const paletteSchema = z.object({
  primary: hexColor,
  ink: hexColor,
  paper: hexColor,
})

export const showStatusEnum = z.enum(['airing', 'ended', 'hiatus'])

export const showTierEnum = z.enum(['S', 'A', 'B'])

export type ShowTier = z.infer<typeof showTierEnum>

export const showFrontmatterSchema = z
  .object({
    slug,
    name: z.string().min(1),
    palette: paletteSchema,
    seasons: z.number().int().nonnegative(),
    status: showStatusEnum,
    blurb: z.string().min(1).max(120),
    tagline: z.string().min(1).max(280),
    // Editorial fields added with the /shows tier-list redesign.
    // tier is the editor's confidence in the canon for this show:
    //   S — format-defining, we'd defend the order at a bar
    //   A — deep canon, we'd defend it at a kitchen table
    //   B — recent / under review, we haven't watched twice yet
    // network, est_year, genre_tag are surfaced on the show tile.
    // featured flags the single show that anchors the home hero.
    tier: showTierEnum,
    network: z.string().min(1).max(40),
    est_year: z.number().int().min(1900).max(2100),
    genre_tag: z.string().min(1).max(60),
    featured: z.boolean().default(false),
  })
  .strict()

export type ShowFrontmatter = z.infer<typeof showFrontmatterSchema>

export const showSchema = showFrontmatterSchema.extend({
  body_md: z.string().optional(),
})

export type Show = z.infer<typeof showSchema>

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

const blurbBody = z
  .string()
  .refine((b) => {
    const wc = wordCount(b)
    return wc >= 50 && wc <= 80
  }, { message: 'season blurb must be 50–80 words' })

// `display_title` allows a constrained subset of HTML so the season
// hero can render a colored accent inside the title — the canonical
// case is "Heroes <em>vs.</em><br>Villains" where `vs.` renders in
// `var(--show-primary)` and the line breaks before "Villains" per the
// Heroes vs. Villains design reference. Only <em>...</em> + <br/>
// permitted; renderers turn <em> into `<span class="amp">` and drop
// the rest as text. When absent, the season h1 falls back to the
// plain `title` string.
const displayTitleHtml = /^[^<]*(?:<em>[^<]+<\/em>|<br\s*\/?>)?[^<]*(?:<em>[^<]+<\/em>|<br\s*\/?>)?[^<]*(?:<em>[^<]+<\/em>|<br\s*\/?>)?[^<]*$/

// Episode-heat marks ride the "Episode rhythm" bar at the top of the
// season page. One entry per aired episode. Editor's judgment — `hot`
// is a peak the canon entry will reference; `med` is the show working
// well; `cold` is a slack ep. Length should match `ep_count` /
// `episodes` when supplied.
const episodeHeatEnum = z.enum(['cold', 'med', 'hot'])

const watchListItemSchema = z.object({
  // The episode label as printed in the "Watch for" card — e.g.
  // "Ep 1 · cold open" or "Ep 7 · long take". Lead with the episode
  // number; an optional thin-space-separated tag follows the bullet.
  episode_label: z.string().min(1).max(48),
  // 1-2 sentence pointer at what to notice. Spoiler-safe by P0 rule.
  body: z.string().min(1).max(320),
})

export type WatchListItem = z.infer<typeof watchListItemSchema>

export const seasonFrontmatterSchema = z.object({
  show: slug,
  number: z.number().int().positive(),
  // 31a: every season carries a slug — the loader pre-fills it from
  // the filename (`NN-<slug>.md`) before this schema validates. A
  // frontmatter `slug:` value overrides the filename derivation only
  // when a curator needs a different rendered URL than the file
  // would imply (rare; reserved for awkward renames).
  slug,
  title: z.string().min(1),
  // Rich-display variant of `title` — limited HTML, optional. See
  // `displayTitleHtml` above.
  display_title: z
    .string()
    .min(1)
    .max(160)
    .regex(displayTitleHtml, {
      message:
        'display_title allows only <em>...</em> and <br/> inside plain text',
    })
    .optional(),
  premiere_date: isoDate.optional(),
  ep_count: z.number().int().positive().optional(),
  location: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  format_changes: z.array(z.string().min(1)).default([]),
  canonical_position: z.number().int().positive().optional(),
  // 19c: optional editorial fields for the rebuilt season page.
  // Render conditionally — absent fields collapse the corresponding
  // surface (eyebrow, pull quote, details strip).
  eyebrow: z.string().min(1).max(80).optional(),
  lede: z.string().min(1).max(280).optional(),
  body: z.string().min(1).optional(),
  pull: z.string().min(1).max(240).optional(),
  vote_question: z.string().min(1).max(120).optional(),
  aired_year: z.number().int().min(1900).max(2100).optional(),
  episodes: z.number().int().positive().optional(),
  cast_note: z.string().min(1).max(80).optional(),
  tag: z.string().min(1).max(80).optional(),
  // 26a: stats-strip captions surfaced under each stat key in the
  // new season hero (per `design/tiered.tv · Heroes vs. Villains.html`
  // § STATS STRIP). All optional — renderer collapses each stat when
  // both the value field and its caption are absent.
  filming_caption: z.string().min(1).max(80).optional(),
  premiere_caption: z.string().min(1).max(80).optional(),
  episodes_caption: z.string().min(1).max(80).optional(),
  format_summary: z.string().min(1).max(60).optional(),
  format_caption: z.string().min(1).max(80).optional(),
  cast_size: z.number().int().positive().max(999).optional(),
  cast_size_caption: z.string().min(1).max(80).optional(),
  host_caption: z.string().min(1).max(80).optional(),
  // Episode-heat strip + caption.
  episode_heat: z.array(episodeHeatEnum).min(1).max(60).optional(),
  episode_heat_caption: z.string().min(1).max(60).optional(),
  // Watch-list (the "What to watch for" section).
  watch_list: z.array(watchListItemSchema).min(1).max(8).optional(),
})

export type SeasonFrontmatter = z.infer<typeof seasonFrontmatterSchema>

export const seasonSchema = seasonFrontmatterSchema.extend({
  blurb_md: blurbBody,
})

export type Season = z.infer<typeof seasonSchema>

export const themeCategorySchema = z.enum([
  'tone',
  'craft',
  'era',
  'single',
])

export type ThemeCategory = z.infer<typeof themeCategorySchema>

export const themeStatusSchema = z.enum([
  'growing',
  'stable',
  'updated',
  'started',
])

export type ThemeStatus = z.infer<typeof themeStatusSchema>

export const themeEntrySchema = z.object({
  show: slug,
  season: z.number().int().positive(),
  rank: z.number().int().positive(),
  title: z.string().min(1).max(140),
  blurb: z.string().min(1).max(280),
  season_label: z.string().min(1).max(60).optional(),
})

export type ThemeEntry = z.infer<typeof themeEntrySchema>

export const themeSentimentEnum = z.enum([
  'warm-up',
  'warm-down',
  'neutral',
  'hold',
  'verdict',
  'consensus',
])

export type ThemeSentiment = z.infer<typeof themeSentimentEnum>

// Theme taglines may include at most one well-formed `<b>…</b>` emphasis
// span — the renderer is regex-bounded (see <ListDetailHero>'s parser).
// Anything richer is rejected here at validation time so curator errors
// surface in `pnpm content:check` rather than at render time.
const taglineEmphasis = /^[^<]*(<b>[^<]*<\/b>[^<]*)?$/

const themeFrontmatterObject = z.object({
  slug,
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  tagline: z
    .string()
    .min(1)
    .max(360)
    .regex(taglineEmphasis, {
      message:
        'tagline allows at most one well-formed <b>...</b> emphasis span',
    }),
  category: themeCategorySchema,
  sentiment: themeSentimentEnum.default('hold'),
  status: themeStatusSchema.default('stable'),
  curator: z.string().min(1).max(80).default('tiered.tv Editors'),
  last_revised: isoDate,
  featured: z.boolean().default(false),
  related: z.array(slug).max(4).default([]),
  era_range: z
    .tuple([
      z.number().int().min(1900).max(2100),
      z.number().int().min(1900).max(2100),
    ])
    .optional(),
  entries: z.array(themeEntrySchema).min(1).max(30),
})

function checkEraRange(
  data: { category: ThemeCategory; era_range?: [number, number] },
  ctx: z.RefinementCtx,
): void {
  if (data.category === 'era' && !data.era_range) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['era_range'],
      message: 'era_range is required when category=era',
    })
  }
}

export const themeFrontmatterSchema =
  themeFrontmatterObject.superRefine(checkEraRange)

export type ThemeFrontmatter = z.infer<typeof themeFrontmatterSchema>

export const themeSchema = themeFrontmatterObject
  .extend({ body_md: z.string().default('') })
  .superRefine(checkEraRange)

export type Theme = z.infer<typeof themeSchema>

const rationaleBody = z
  .string()
  .refine((b) => {
    const wc = wordCount(b)
    return wc >= 80 && wc <= 120
  }, { message: 'canon rationale must be 80–120 words' })

// 31a: optional editorial hint authored alongside a canon entry so
// the page can render a community-rank pill even before live vote
// signal wires in. Replaced by the live signal once enough votes
// land.
export const communityRankHintSchema = z.object({
  rank: z.number().int().positive(),
  delta: z.number().int(),
  sentiment: z.enum(['up', 'down', 'hold']),
})

export type CommunityRankHint = z.infer<typeof communityRankHintSchema>

export const canonEntrySchema = z.object({
  rank: z.number().int().positive(),
  season: z.number().int().positive(),
  title: z.string().min(1),
  rationale: rationaleBody,
  // 31a: optional editorial fields surfaced by the unified
  // canon/community shell that 31c will rebuild. Renderers collapse
  // each surface when absent.
  tag: z.string().min(1).max(120).optional(),
  slot_argument: z.string().min(1).max(240).optional(),
  community_rank_hint: communityRankHintSchema.optional(),
})

export type CanonEntry = z.infer<typeof canonEntrySchema>

// 31a: methodology cell — three of these stack across the canon
// page's "How we ranked it" strip. Cells are independently
// optional; renderer collapses absent ones.
const methodologyCellHeading = z.string().min(1).max(80)
const methodologyCellParagraph = z
  .string()
  .min(1)
  .refine((b) => {
    const wc = wordCount(b)
    return wc >= 40 && wc <= 60
  }, { message: 'methodology paragraph must be 40–60 words' })

const tierBlurb = z
  .string()
  .refine((b) => {
    const wc = wordCount(b)
    return wc >= 10 && wc <= 40
  }, { message: 'tier blurb must be 10–40 words' })

const eraBandSchema = z.object({
  key: slug,
  label: z.string().min(1).max(40),
  range: z.tuple([
    z.number().int().min(1900).max(2100),
    z.number().int().min(1900).max(2100),
  ]),
})

export type EraBand = z.infer<typeof eraBandSchema>

export const canonFileSchema = z.object({
  show: slug,
  // 31a: optional editorial frontmatter consumed by the unified
  // canon/community shell (rebuilt in 31c). Every field is optional
  // so existing canons (survivor / dragrace / top-chef) validate
  // without modification; 31b populates the fields as it drains.
  editor: z.string().min(1).max(80).optional(),
  last_revised: isoDate.optional(),
  meth_who_h: methodologyCellHeading.optional(),
  meth_who_p: methodologyCellParagraph.optional(),
  meth_how_h: methodologyCellHeading.optional(),
  meth_how_p: methodologyCellParagraph.optional(),
  meth_when_h: methodologyCellHeading.optional(),
  meth_when_p: methodologyCellParagraph.optional(),
  tier_s_blurb: tierBlurb.optional(),
  tier_a_blurb: tierBlurb.optional(),
  tier_b_blurb: tierBlurb.optional(),
  tier_c_blurb: tierBlurb.optional(),
  weekly_question: z.string().min(1).max(140).optional(),
  era_bands: z.array(eraBandSchema).max(6).optional(),
  entries: z.array(canonEntrySchema).min(1),
})

export type CanonFile = z.infer<typeof canonFileSchema>

export const legalSlugEnum = z.enum(['about', 'terms', 'privacy'])

export const legalFrontmatterSchema = z.object({
  slug: legalSlugEnum,
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  updated: isoDate.optional(),
})

export type LegalFrontmatter = z.infer<typeof legalFrontmatterSchema>

export const legalDocSchema = legalFrontmatterSchema.extend({
  body_md: z.string().min(1),
})

export type LegalDoc = z.infer<typeof legalDocSchema>

export const __wordCount = wordCount
