import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLegalDoc } from '@/content'
import { Prose } from '@/components/prose/Prose'
import { buildJsonLd, buildMetadata, jsonLdScriptProps } from '@/lib/seo'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  const doc = getLegalDoc('about')
  if (!doc) return buildMetadata({ title: 'About', description: 'About tiered.tv.', path: '/about' })
  return buildMetadata({
    title: doc.title,
    description: doc.description ?? 'About tiered.tv.',
    path: '/about',
  })
}

// Phase 17 — FAQ JSON-LD with 4 canonical questions. The HTML
// accordion is a follow-up; this layer is crawler-facing only.
const FAQS = [
  {
    question: 'Are the rankings actually spoiler-free?',
    answer:
      'Yes. Spoiler-free in tiered.tv means no winners, no eliminations, no plot beats, no deaths, no twists, no finale outcomes, no relationship outcomes. Format changes, casting energy, location, tonal shifts, and structural innovations are fair. Every comment is checked by an AI pre-filter before it posts; flagged comments enter a human-reviewed mod queue.',
  },
  {
    question: 'How is the editor’s canon ranking made?',
    answer:
      'One editor watches every season of a show, writes 80–120 words of rationale per ranked position, and commits the ranking to content/. The canon is opinionated and signed; the community vote is a separate ranking on the same show page, behind the Community tab.',
  },
  {
    question: 'How is the community ranking weighted?',
    answer:
      'Anonymous-guest votes count at 0.1×. Authenticated users with accounts under 7 days old count at 0.25×. Authenticated users 7+ days old count at 1.0×. Brigade rate-limits apply: 100 votes per anonymous session per day, 1000 per authenticated session per day. One live vote per (target, session).',
  },
  {
    question: 'What does the AI moderation pre-filter do?',
    answer:
      'Every comment passes through OpenAI gpt-5-mini before it posts. Allow → publishes immediately (after the new-account hold for the first five comments). Flag → enters the human-reviewed mod queue. Block → never posts. Every decision is logged for audit. Human moderators can always override.',
  },
]

export default function AboutPage() {
  const doc = getLegalDoc('about')
  if (!doc) notFound()
  const ld = buildJsonLd({ type: 'FAQPage', path: '/about', faqs: FAQS })
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24">
      <script {...jsonLdScriptProps({ id: 'ld-about-faq', data: ld })} />
      <Prose source={doc.body_md} />
    </article>
  )
}
