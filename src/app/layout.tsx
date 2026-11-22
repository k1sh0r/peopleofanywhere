import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ANALYTICS_ON, CITY_NAME, GA_ID, IS_PRODUCTION, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/config/site'
import './globals.css'

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const body = Barlow({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // added to the iPhone home screen, the city opens full screen without Safari's bars (Phase 6B)
  appleWebApp: { capable: true, title: CITY_NAME, statusBarStyle: 'black-translucent' },
  // every ?invite= / ?connections / preview link is the same page
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  // only production is indexed; dev, previews and *.netlify.app say noindex (next.config.ts sends the header too)
  robots: IS_PRODUCTION ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  formatDetection: { telephone: false, email: false, address: false },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en',
}

export const viewport: Viewport = {
  themeColor: '#1C1F2B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {IS_PRODUCTION && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
        {children}
      </body>
      {ANALYTICS_ON && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
