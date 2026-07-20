import { formatCompact, formatPercent, formatPrice } from '~/lib/format'
import { type ChartSeries, type RangeKey } from '~/lib/types'

interface StatsRowProps {
  series: ChartSeries
  range: RangeKey
}

export function StatsRow({ series, range }: StatsRowProps) {
  const { points, currency } = series
  const last = points[points.length - 1]
  const first = points[0]
  // Intraday change is measured against the previous close when Yahoo
  // provides one; longer ranges compare against the window's first point.
  const baseline =
    range === '24h' && series.previousClose != null
      ? series.previousClose
      : first.close
  const change = last.close - baseline
  const fraction = baseline === 0 ? 0 : change / baseline
  const up = change >= 0
  const closes = points.map((p) => p.close)
  const high = Math.max(...closes)
  const low = Math.min(...closes)
  const volume = points.reduce((sum, p) => sum + p.volume, 0)

  return (
    <div className="stats-row">
      <div className="stat-tile">
        <span className="stat-label">Last price</span>
        <span className="stat-value">{formatPrice(last.close, currency)}</span>
        <span className={up ? 'stat-delta delta-up' : 'stat-delta delta-down'}>
          {up ? '▲' : '▼'} {formatPrice(change, currency)} (
          {formatPercent(fraction)})
        </span>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Range high</span>
        <span className="stat-value">{formatPrice(high, currency)}</span>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Range low</span>
        <span className="stat-value">{formatPrice(low, currency)}</span>
      </div>
      <div className="stat-tile">
        <span className="stat-label">Volume</span>
        <span className="stat-value">
          {volume > 0 ? formatCompact(volume) : '—'}
        </span>
      </div>
    </div>
  )
}
