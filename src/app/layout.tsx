import type { Metadata, Viewport } from 'next'
import { VercelAnalytics } from '@/components/analytics/VercelAnalytics'
import { VercelSpeedInsights } from '@/components/analytics/VercelSpeedInsights'
import { siteConfig } from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: {
    default: 'tiered.tv — the seasons, ranked. no spoilers.',
    template: '%s — tiered.tv',
  },
  description:
    'A spoiler-free home for ranked TV seasons. Editor’s Canon and Community Rank side by side.',
  applicationName: 'tiered.tv',
  // Phase 32: global RSS feed, auto-discoverable site-wide.
  // Per-show pages add their own feed on top of this.
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'tiered.tv — all updates' },
      ],
    },
  },
  icons: {
    icon: [
      // Modern browsers prefer the SVG (vector, scales at any tab size).
      // .ico is the universal fallback. Both render the gold mark on
      // transparent so it sits cleanly against any tab chrome.
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      // The PNG tiles are the cream-on-paper variant used by PWAs and
      // the home-screen install prompt — NOT the browser-tab favicon.
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

const themeBootstrap = `(function(){try{var t=localStorage.getItem('tiered_theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flicker theme bootstrap. Synchronous, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  )
}
