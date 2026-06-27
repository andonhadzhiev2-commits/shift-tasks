import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Смени и задачи',
  description: 'Управление на задачи по смени',
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
