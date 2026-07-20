import { useMemo } from 'react'

import { type ChartOptions, type TooltipItem } from 'chart.js'
import { Bar } from 'react-chartjs-2'

import { useChartTheme } from '~/lib/chartTheme'
import { formatCompact, formatDetail, formatTick } from '~/lib/format'
import { type ChartSeries, type RangeKey } from '~/lib/types'

interface VolumeChartProps {
  series: ChartSeries
  range: RangeKey
}

export function VolumeChart({ series, range }: VolumeChartProps) {
  const theme = useChartTheme()

  const data = useMemo(
    () => ({
      labels: series.points.map((p) => formatTick(p.t, range)),
      datasets: [
        {
          label: 'Volume',
          data: series.points.map((p) => p.volume),
          backgroundColor: theme.volume,
          borderRadius: 2,
          maxBarThickness: 14,
          categoryPercentage: 0.9,
          barPercentage: 0.9,
        },
      ],
    }),
    [series, range, theme],
  )

  const options = useMemo<ChartOptions<'bar'>>(
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
            title: (items: TooltipItem<'bar'>[]) =>
              formatDetail(series.points[items[0].dataIndex].t, range),
            label: (item: TooltipItem<'bar'>) =>
              `Volume: ${formatCompact(item.parsed.y ?? 0)}`,
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
          beginAtZero: true,
          grid: { color: theme.grid },
          border: { display: false },
          ticks: {
            color: theme.muted,
            maxTicksLimit: 4,
            callback: (value) => formatCompact(Number(value)),
          },
        },
      },
    }),
    [series, range, theme],
  )

  return (
    <div className="chart-area chart-volume">
      <Bar data={data} options={options} />
    </div>
  )
}
