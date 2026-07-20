import { RANGE_OPTIONS, type RangeKey } from '~/lib/types'

interface RangeTabsProps {
  value: RangeKey
  onChange: (range: RangeKey) => void
}

export function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <div className="range-tabs" role="group" aria-label="Time range">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={option.key === value ? 'range-tab active' : 'range-tab'}
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
