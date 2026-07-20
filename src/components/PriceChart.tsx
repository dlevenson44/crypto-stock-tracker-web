import { useMemo } from 'react'

import { type ChartOptions, type TooltipItem } from 'chart.js'
import { Line } from 'react-chartjs-2'

import { useChartTheme } from '~/lib/chartTheme'
import { formatDetail, formatPrice, formatTick } from '~/lib/format'
import { type ChartSeries, type RangeKey } from '~/lib/types'

interface PriceChartProps {
  series: ChartSeries
  range: RangeKey
}

export function PriceChart({ series, range }: PriceChartProps) {
  const theme = useChartTheme()

  const data = useMemo(
    () => ({
      labels: series.points.map((p) => formatTick(p.t, range)),
      datasets: [
        {
          label: series.symbol,
          data: series.points.map((p) => p.close),
          borderColor: theme.series,
          backgroundColor: theme.seriesFill,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: theme.series,
          pointHoverBorderColor: theme.tooltipInk,
          fill: true,
        },
      ],
    }),
    [series, range, theme],
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipInk,
          bodyColor: theme.tooltipInk,
          displayColors: false,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (items: TooltipItem<'line'>[]) =>
              formatDetail(series.points[items[0].dataIndex].t, range),
            label: (item: TooltipItem<'line'>) =>
              formatPrice(item.parsed.y ?? 0, series.currency),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: theme.grid },
          ticks: {
            color: theme.muted,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
        y: {
          grid: { color: theme.grid },
          border: { display: false },
          ticks: {
            color: theme.muted,
            maxTicksLimit: 5,
            callback: (value) => formatPrice(Number(value), series.currency),
          },
        },
      },
    }),
    [series, range, theme],
  )

  return (
    <div className="chart-area chart-price">
      <Line data={data} options={options} />
    </div>
  )
}
