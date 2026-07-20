import {
  type AssetType,
  type ChartSeries,
  type RangeKey,
  type SearchResult,
} from './types'

const API_BASE = '/td'

const INSTRUMENT_TYPES: Record<string, AssetType> = {
  'Common Stock': 'stock',
  'Preferred Stock': 'stock',
  'American Depositary Receipt': 'stock',
  REIT: 'stock',
  ETF: 'etf',
  'Digital Currency': 'crypto',
}

interface TwelveDataError {
  code?: number
  message?: string
  status?: string
}

function toError(body: TwelveDataError, fallback: string): Error {
  if (body.code === 429) {
    return new Error(
      'Twelve Data rate limit reached (8 requests/min on the free plan). ' +
        'Wait a minute and try again.',
    )
  }
  if (body.code === 401) {
    return new Error(
      'Missing or invalid Twelve Data API key. Add TWELVE_DATA_API_KEY to ' +
        '.env and restart the dev server.',
    )
  }
  return new Error(body.message ?? fallback)
}

interface TwelveSearchResponse extends TwelveDataError {
  data?: {
    symbol?: string
    instrument_name?: string
    exchange?: string
    instrument_type?: string
  }[]
}

export async function searchSymbols(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ symbol: query, outputsize: '30' })
  const res = await fetch(`${API_BASE}/symbol_search?${params}`, { signal })
  const body = (await res.json()) as TwelveSearchResponse
  if (!res.ok || body.status === 'error') {
    throw toError(body, `Search failed (${res.status})`)
  }
  // The same ticker is listed once per exchange; keep the first (most
  // relevant) listing of each symbol.
  const seen = new Set<string>()
  const results: SearchResult[] = []
  for (const item of body.data ?? []) {
    const type = item.instrument_type
      ? INSTRUMENT_TYPES[item.instrument_type]
      : undefined
    if (!item.symbol || !type || seen.has(item.symbol)) continue
    seen.add(item.symbol)
    results.push({
      symbol: item.symbol,
      name: item.instrument_name ?? item.symbol,
      type,
      exchange: item.exchange ?? '',
    })
    if (results.length >= 10) break
  }
  return results
}

const DAY_MS = 86_400_000

function localDateTime(msAgo: number): string {
  const d = new Date(Date.now() - msAgo)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function rangeParams(range: RangeKey, type: AssetType): URLSearchParams {
  switch (range) {
    case '24h':
      // Most recent N bars rather than a wall-clock window, so stocks show
      // their latest session even outside market hours (78 five-minute bars
      // per session; crypto trades around the clock).
      return new URLSearchParams({
        interval: '5min',
        outputsize: type === 'crypto' ? '288' : '78',
      })
    case '7d':
      return new URLSearchParams({
        interval: '30min',
        start_date: localDateTime(7 * DAY_MS),
        outputsize: '5000',
      })
    case '1mo':
      return new URLSearchParams({
        interval: '1day',
        start_date: localDateTime(30 * DAY_MS),
        outputsize: '5000',
      })
    case '1y':
      return new URLSearchParams({
        interval: '1day',
        start_date: localDateTime(365 * DAY_MS),
        outputsize: '5000',
      })
    case '5y':
      return new URLSearchParams({
        interval: '1week',
        start_date: localDateTime(5 * 365 * DAY_MS),
        outputsize: '5000',
      })
  }
}

interface TwelveTimeSeriesResponse extends TwelveDataError {
  meta?: { currency?: string }
  values?: {
    datetime?: string
    close?: string
    volume?: string
  }[]
}

function parseDatetime(value: string): number {
  // Intraday values look like "2026-07-18 15:55:00" (in the requested
  // timezone); daily and weekly values are date-only. Both are parsed as
  // local time so chart labels match what the user expects.
  const iso = value.includes(' ')
    ? value.replace(' ', 'T')
    : `${value}T00:00:00`
  return new Date(iso).getTime()
}

const chartCache = new Map<string, { at: number; data: ChartSeries }>()
const CHART_CACHE_TTL = 60_000

export async function fetchChart(
  symbol: string,
  range: RangeKey,
  type: AssetType,
  signal?: AbortSignal,
): Promise<ChartSeries> {
  const cacheKey = `${symbol}:${range}`
  const cached = chartCache.get(cacheKey)
  if (cached && Date.now() - cached.at < CHART_CACHE_TTL) {
    return cached.data
  }
  const params = rangeParams(range, type)
  params.set('symbol', symbol)
  params.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
  const res = await fetch(`${API_BASE}/time_series?${params}`, { signal })
  const body = (await res.json()) as TwelveTimeSeriesResponse
  if (!res.ok || body.status === 'error') {
    throw toError(body, `Could not load data for ${symbol} (${res.status})`)
  }
  const points = (body.values ?? [])
    .flatMap((value) => {
      const close = Number(value.close)
      if (!value.datetime || Number.isNaN(close)) return []
      const t = parseDatetime(value.datetime)
      if (Number.isNaN(t)) return []
      return [{ t, close, volume: Number(value.volume ?? 0) || 0 }]
    })
    // Twelve Data returns newest first
    .reverse()
  if (points.length === 0) {
    throw new Error(`No data for ${symbol} in this range`)
  }
  const series: ChartSeries = {
    symbol,
    // Crypto pairs have no meta.currency; the quote currency is the part
    // of the symbol after the slash (e.g. BTC/USD).
    currency: body.meta?.currency ?? symbol.split('/')[1] ?? 'USD',
    previousClose: null,
    points,
  }
  chartCache.set(cacheKey, { at: Date.now(), data: series })
  return series
}
