import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wall of Notes',
  description: 'Leave a thought, a quote, or just say hi.',
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
  maximumScale: 1,
}

import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
