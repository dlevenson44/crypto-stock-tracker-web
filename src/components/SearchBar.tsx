import { type KeyboardEvent, useEffect, useRef, useState } from 'react'

import { searchSymbols } from '~/lib/api'
import { TYPE_LABELS, type SearchResult } from '~/lib/types'

interface SearchBarProps {
  onSelect: (result: SearchResult) => void
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchSymbols(trimmed, controller.signal)
        .then((found) => {
          setResults(found)
          setActive(-1)
          setOpen(true)
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setResults([])
          setOpen(true)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const select = (result: SearchResult) => {
    setQuery(result.symbol)
    setOpen(false)
    onSelect(result)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : (i - 1) % results.length))
    } else if (event.key === 'Enter') {
      const target = active >= 0 ? results[active] : results[0]
      if (target) {
        event.preventDefault()
        select(target)
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="search" ref={rootRef}>
      <input
        className="search-input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-listbox"
        aria-autocomplete="list"
        aria-activedescendant={
          active >= 0 ? `search-option-${active}` : undefined
        }
        aria-label="Search stock or crypto tickers"
        placeholder="Search a stock or crypto ticker (AAPL, BTC/USD, …)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (results.length > 0) setOpen(true)
        }}
      />
      {open && (
        <ul className="search-results" id="search-listbox" role="listbox">
          {results.length === 0 && (
            <li className="search-empty">No matching tickers</li>
          )}
          {results.map((result, index) => (
            <li key={result.symbol}>
              <button
                type="button"
                id={`search-option-${index}`}
                role="option"
                aria-selected={index === active}
                className={
                  index === active ? 'search-option active' : 'search-option'
                }
                onMouseEnter={() => setActive(index)}
                onClick={() => select(result)}
              >
                <span className="search-symbol">{result.symbol}</span>
                <span className="search-name">{result.name}</span>
                <span className={`badge badge-${result.type}`}>
                  {TYPE_LABELS[result.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
