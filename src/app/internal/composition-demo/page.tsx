import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CompositionDemo } from './CompositionDemo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Composition primitives — demo',
  robots: { index: false, follow: false },
}

export default function CompositionDemoPage() {
  if (process.env['INTERNAL_DEMOS'] !== '1') notFound()
  return <CompositionDemo />
}
