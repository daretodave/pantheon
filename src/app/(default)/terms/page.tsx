import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLegalDoc } from '@/content'
import { Prose } from '@/components/prose/Prose'
import { buildMetadata } from '@/lib/seo'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  const doc = getLegalDoc('terms')
  if (!doc) return buildMetadata({ title: 'Terms', description: 'Terms of Service.', path: '/terms' })
  return buildMetadata({
    title: doc.title,
    description: doc.description ?? 'Terms of Service.',
    path: '/terms',
  })
}

export default function TermsPage() {
  const doc = getLegalDoc('terms')
  if (!doc) notFound()
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16 md:py-24">
      <Prose source={doc.body_md} />
    </article>
  )
}
