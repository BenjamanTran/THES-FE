import type { Metadata, Viewport } from 'next'
import { Lexend } from 'next/font/google'

import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-provider'
import { Toaster } from '@/components/ui/sonner'
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
  themeColor: '#fafafa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="outdoor bg-background" suppressHydrationWarning>
      <body className={`${lexend.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
