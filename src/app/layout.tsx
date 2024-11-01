import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SOL 代币浏览器',
  description: '浏览和导入 SOL 代币钱包',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}