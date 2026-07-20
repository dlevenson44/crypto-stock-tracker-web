export type AssetType = 'stock' | 'etf' | 'crypto'

export const TYPE_LABELS: Record<AssetType, string> = {
  stock: 'Stock',
  etf: 'ETF',
  crypto: 'Crypto',
}

export interface SearchResult {
  symbol: string
  name: string
  type: AssetType
  exchange: string
}

export type RangeKey = '24h' | '7d' | '1mo' | '1y' | '5y'

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '1mo', label: '1M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
]

export interface PricePoint {
  t: number
  close: number
  volume: number
}

export interface ChartSeries {
  symbol: string
  range: RangeKey
  currency: string
  points: PricePoint[]
}
