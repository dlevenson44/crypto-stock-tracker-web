import { useEffect, useState } from 'react'

export interface ChartTheme {
  muted: string
  grid: string
  series: string
  seriesFill: string
  volume: string
  up: string
  down: string
  tooltipBg: string
  tooltipInk: string
}

const LIGHT: ChartTheme = {
  muted: '#898781',
  grid: '#e1e0d9',
  series: '#2a78d6',
  seriesFill: 'rgba(42, 120, 214, 0.1)',
  volume: '#2a78d6',
  up: '#006300',
  down: '#d03b3b',
  tooltipBg: '#0b0b0b',
  tooltipInk: '#fcfcfb',
}

// Same hues re-stepped for the dark surface, not an automatic flip.
const DARK: ChartTheme = {
  muted: '#898781',
  grid: '#2c2c2a',
  series: '#3987e5',
  seriesFill: 'rgba(57, 135, 229, 0.14)',
  volume: '#3987e5',
  up: '#0ca30c',
  down: '#d03b3b',
  tooltipBg: '#2c2c2a',
  tooltipInk: '#ffffff',
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function useChartTheme(): ChartTheme {
  const [dark, setDark] = useState(() => window.matchMedia(DARK_QUERY).matches)
  useEffect(() => {
    const mql = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return dark ? DARK : LIGHT
}
