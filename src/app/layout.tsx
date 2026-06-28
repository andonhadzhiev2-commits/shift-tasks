import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Рай Супермаркети - Смени',
  description: 'Управление на задачи по смени',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Рай Смени',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: [
      { url: '/icon-76x76.png', sizes: '76x76' },
      { url: '/icon-120x120.png', sizes: '120x120' },
      { url: '/icon-152x152.png', sizes: '152x152' },
      { url: '/icon-180x180.png', sizes: '180x180' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
