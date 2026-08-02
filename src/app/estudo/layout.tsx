import { JetBrains_Mono, Manrope } from 'next/font/google'
import { ThemeProvider } from '@/components/deucert/ThemeProvider'

// Fontes carregadas só aqui (layout aninhado de /estudo) — não no
// RootLayout compartilhado, pra não afetar o resto do KnowHow.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function EstudoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <ThemeProvider>{children}</ThemeProvider>
    </div>
  )
}
