import { useEffect, useState } from 'react'

import { PriceChart } from '~/components/PriceChart'
import { RangeTabs } from '~/components/RangeTabs'
import { SearchBar } from '~/components/SearchBar'
import { StatsRow } from '~/components/StatsRow'
import { VolumeChart } from '~/components/VolumeChart'
import { fetchChart } from '~/lib/api'
import { type ChartSeries, type RangeKey, type SearchResult } from '~/lib/types'

import './App.css'

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  stock: 'Stock',
  etf: 'ETF',
  crypto: 'Crypto',
}

const QUICK_PICKS: SearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'SPY', name: 'SPDR S&P 500', type: 'etf', exchange: 'NYSE' },
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', exchange: '' },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', exchange: '' },
]

function App() {
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [range, setRange] = useState<RangeKey>('24h')
  const [series, setSeries] = useState<ChartSeries | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchChart(selected.symbol, range, selected.type, controller.signal)
      .then((data) => setSeries(data))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load data')
        setSeries(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [selected, range, attempt])

  const showSeries = selected && series && series.symbol === selected.symbol

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crypto &amp; Stock Tracker</h1>
        <p className="tagline">
          Search any stock or crypto ticker and explore its price history.
        </p>
      </header>

      <SearchBar onSelect={setSelected} />

      {!selected && (
        <section className="empty-state">
          <p>Or jump straight to a popular ticker:</p>
          <div className="quick-picks">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.symbol}
                type="button"
                className="quick-pick"
                onClick={() => setSelected(pick)}
              >
                {pick.symbol}
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <section className={loading ? 'result is-loading' : 'result'}>
          <div className="result-header">
            <div>
              <h2>{selected.name}</h2>
              <p className="result-meta">
                {selected.symbol}
                <span className={`badge badge-${selected.type}`}>
                  {TYPE_LABELS[selected.type]}
                </span>
                {selected.exchange && (
                  <span className="exchange">{selected.exchange}</span>
                )}
              </p>
            </div>
            <RangeTabs value={range} onChange={setRange} />
          </div>

          {error && (
            <div role="alert" className="error">
              <p>{error}</p>
              <button
                type="button"
                className="retry"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          )}
          {loading && !showSeries && <p className="loading">Loading…</p>}

          {showSeries && (
            <>
              <StatsRow series={series} range={range} />
              <div className="card">
                <h3>Price</h3>
                <PriceChart series={series} range={range} />
              </div>
              {series.points.some((p) => p.volume > 0) && (
                <div className="card">
                  <h3>Volume</h3>
                  <VolumeChart series={series} range={range} />
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default App
