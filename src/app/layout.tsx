import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KnowHow — Quiz de Dados Multiplayer',
  description: 'Treine sozinho. Desafie em grupo. SQL, Python, ML, BI e mais.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
