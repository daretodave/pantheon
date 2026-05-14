import { Footer } from '@/components/chrome/Footer'
import { Header } from '@/components/chrome/Header'
import { SkipToMain } from '@/components/chrome/SkipToMain'
import { Wrap } from '@/components/chrome/Wrap'
import { SearchHost } from '@/components/search/SearchHost'
import { getSearchIndex } from '@/lib/searchIndex'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchItems = getSearchIndex()
  return (
    <>
      <SkipToMain />
      <Header />
      <Wrap>
        <main id="main" className="flex-1">
          {children}
        </main>
      </Wrap>
      <Footer />
      <SearchHost items={searchItems} />
    </>
  )
}
