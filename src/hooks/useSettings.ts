'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'datashow_settings'

interface Settings {
  volume: number   // 0–1
  muted: boolean
}

const DEFAULT: Settings = { volume: 0.5, muted: false }

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT)

  useEffect(() => { setSettings(load()) }, [])

  function update(patch: Partial<Settings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const effectiveVolume = settings.muted ? 0 : settings.volume

  return {
    volume: settings.volume,
    muted: settings.muted,
    effectiveVolume,
    setVolume: (v: number) => update({ volume: v }),
    toggleMute: () => update({ muted: !settings.muted }),
  }
}
