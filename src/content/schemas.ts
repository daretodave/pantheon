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

export const showFrontmatterSchema = z.object({
  slug,
  name: z.string().min(1),
  network: z.string().min(1),
  format: z.string().min(1),
  hero_motifs: z.array(z.string().min(1)).max(6).default([]),
  palette: paletteSchema,
  status: showStatusEnum,
  tagline: z.string().min(1).optional(),
  first_aired: isoDate.optional(),
})

export type ShowFrontmatter = z.infer<typeof showFrontmatterSchema>

export const showSchema = showFrontmatterSchema.extend({
  body_md: z.string(),
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

export const seasonFrontmatterSchema = z.object({
  show: slug,
  number: z.number().int().positive(),
  title: z.string().min(1),
  premiere_date: isoDate.optional(),
  ep_count: z.number().int().positive().optional(),
  location: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  format_changes: z.array(z.string().min(1)).default([]),
  canonical_position: z.number().int().positive().optional(),
})

export type SeasonFrontmatter = z.infer<typeof seasonFrontmatterSchema>

export const seasonSchema = seasonFrontmatterSchema.extend({
  blurb_md: blurbBody,
})

export type Season = z.infer<typeof seasonSchema>

export const themeEntrySchema = z.object({
  show: slug,
  season: z.number().int().positive(),
  rank: z.number().int().positive(),
  blurb: z.string().min(1).max(280),
})

export type ThemeEntry = z.infer<typeof themeEntrySchema>

export const themeFrontmatterSchema = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1).max(280),
  entries: z.array(themeEntrySchema).min(1).max(15),
})

export type ThemeFrontmatter = z.infer<typeof themeFrontmatterSchema>

export const themeSchema = themeFrontmatterSchema.extend({
  body_md: z.string().default(''),
})

export type Theme = z.infer<typeof themeSchema>

const rationaleBody = z
  .string()
  .refine((b) => {
    const wc = wordCount(b)
    return wc >= 80 && wc <= 120
  }, { message: 'canon rationale must be 80–120 words' })

export const canonEntrySchema = z.object({
  rank: z.number().int().positive(),
  season: z.number().int().positive(),
  title: z.string().min(1),
  rationale: rationaleBody,
})

export type CanonEntry = z.infer<typeof canonEntrySchema>

export const canonFileSchema = z.object({
  show: slug,
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
