import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Wall of Notes',
  description: 'Leave a thought, a quote, or just say hi.',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wall of Notes',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#facc15',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

import Providers from './providers'
import { InstallPWA } from '../components/InstallPWA'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={outfit.className}>
        <Providers>{children}</Providers>
        <InstallPWA />
      </body>
    </html>
  )
}
