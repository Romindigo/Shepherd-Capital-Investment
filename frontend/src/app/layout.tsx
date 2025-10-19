import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shepherd Capital Investment',
  description: 'Plateforme privée d\'investissement sécurisée',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
