import { notFound } from 'next/navigation'
import { Footer } from '@/components/chrome/Footer'
import { Header } from '@/components/chrome/Header'
import { SkipToMain } from '@/components/chrome/SkipToMain'
import { ShowPaletteScope } from '@/components/show/ShowPaletteScope'
import { SearchHost } from '@/components/search/SearchHost'
import { getShow } from '@/content/loaders'
import { getSearchIndex } from '@/lib/searchIndex'

type Params = { show: string }

export default function ShowSegmentLayout({
  params,
  children,
}: {
  params: Params
  children: React.ReactNode
}) {
  const show = getShow(params.show)
  if (!show) notFound()

  const searchItems = getSearchIndex()

  return (
    <ShowPaletteScope show={show.slug} palette={show.palette} asSegment>
      <SkipToMain />
      <Header tinted />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer tinted />
      <SearchHost items={searchItems} />
    </ShowPaletteScope>
  )
}
