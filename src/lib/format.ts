import { type RangeKey } from './types'

export function formatPrice(value: number, currency: string): string {
  const abs = Math.abs(value)
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(fraction: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(fraction)
}

const TICK_FORMAT: Record<RangeKey, Intl.DateTimeFormatOptions> = {
  '24h': { hour: 'numeric', minute: '2-digit' },
  '7d': { weekday: 'short', hour: 'numeric' },
  '1mo': { month: 'short', day: 'numeric' },
  '1y': { month: 'short', day: 'numeric' },
  '5y': { month: 'short', year: 'numeric' },
}

const DETAIL_FORMAT: Record<RangeKey, Intl.DateTimeFormatOptions> = {
  '24h': { dateStyle: 'medium', timeStyle: 'short' },
  '7d': { dateStyle: 'medium', timeStyle: 'short' },
  '1mo': { dateStyle: 'medium' },
  '1y': { dateStyle: 'medium' },
  '5y': { dateStyle: 'medium' },
}

export function formatTick(timestamp: number, range: RangeKey): string {
  return new Intl.DateTimeFormat('en-US', TICK_FORMAT[range]).format(timestamp)
}

export function formatDetail(timestamp: number, range: RangeKey): string {
  return new Intl.DateTimeFormat('en-US', DETAIL_FORMAT[range]).format(
    timestamp,
  )
}
