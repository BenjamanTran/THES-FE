import type { Metadata, Viewport } from 'next'
import { Lexend } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const lexend = Lexend({ 
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SmashHub Pro - The Ultimate Badminton Ecosystem',
  description: 'Connect with the Vietnamese badminton community. Find matches, book courts, and track your ranking.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-48.webp', sizes: '48x48', type: 'image/webp' },
      { url: '/icon-32.webp', sizes: '32x32', type: 'image/webp' },
    ],
    apple: '/icon-180.webp',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#353535',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="dark bg-background">
      <body className={`${lexend.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
