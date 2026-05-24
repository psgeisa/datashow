import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DataShow — Quiz de Dados Multiplayer',
  description: 'O quiz show de dados mais caótico do universo. SQL, Python, ML, BI e mais.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
