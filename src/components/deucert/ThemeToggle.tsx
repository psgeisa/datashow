'use client'
import { Moon, Sun } from 'lucide-react'
import { useEstudoTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useEstudoTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
    >
      {theme === 'light' ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
    </button>
  )
}
