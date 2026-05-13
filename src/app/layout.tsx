import type { Metadata, Viewport } from 'next'
import { VercelAnalytics } from '@/components/analytics/VercelAnalytics'
import { VercelSpeedInsights } from '@/components/analytics/VercelSpeedInsights'
import { Header } from '@/components/chrome/Header'
import { Footer } from '@/components/chrome/Footer'
import { SkipToMain } from '@/components/chrome/SkipToMain'
import { siteConfig } from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: {
    default: 'Pantheon — the seasons, ranked. no spoilers.',
    template: '%s — Pantheon',
  },
  description:
    'A spoiler-free home for ranked TV seasons. Editor’s Canon and Community Rank side by side.',
  applicationName: 'Pantheon',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0E0B08',
  width: 'device-width',
  initialScale: 1,
}

const themeBootstrap = `(function(){try{var t=localStorage.getItem('pantheon_theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flicker theme bootstrap. Synchronous, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipToMain />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  )
}
