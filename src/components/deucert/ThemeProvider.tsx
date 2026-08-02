'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'deucert_theme'

export function useEstudoTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useEstudoTheme precisa estar dentro de <ThemeProvider>')
  return ctx
}

// Tema escopado a `/estudo` via Context + atributo num wrapper local — nunca
// em document.documentElement, pra não vazar pro resto do KnowHow. Aceita um
// pequeno flash na primeira carga (parte de 'dark') em troca desse isolamento.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved) {
      setTheme(saved)
      return
    }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    setTheme(prefersLight ? 'light' : 'dark')
  }, [])

  function toggleTheme() {
    setTheme(t => {
      const next: Theme = t === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="estudo-scope font-sans" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
