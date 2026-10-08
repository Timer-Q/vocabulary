import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { searchWords, useIndex } from './data'
import type { IndexData } from '../types'

export type DeskRow = {
  key: string
  to: string
  label: string
  hint: string
  meta: string
  tone: string
}

export type CommitHow = 'arrow' | 'enter'

type Bound = {
  token: object
  readonly rows: DeskRow[]
  onCommit: (row: DeskRow, how: CommitHow) => void
  onEscape?: () => boolean
}

type DeskContextValue = {
  query: string
  setQuery: (value: string) => void
  hi: number
  setHi: (value: number) => void
  inputRef: RefObject<HTMLInputElement | null>
  wordHits: DeskRow[]
  searching: boolean
  index?: IndexData
  indexError?: string
  bind: (next: Bound | null, token?: object) => void
}

const DeskContext = createContext<DeskContextValue | null>(null)

function isField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function samePath(path: string, to: string): boolean {
  const norm = (value: string) => {
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }
  const left = norm(path)
  const right = norm(to)
  return left === right || left.startsWith(right.endsWith('/') ? right : `${right}/`)
}

export function DeskProvider({ children }: { children: ReactNode }) {
  const { data, error } = useIndex()
  const [query, setQueryState] = useState('')
  const [hi, setHiState] = useState(0)
  const [wordHits, setWordHits] = useState<DeskRow[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hiRef = useRef(0)
  const queryRef = useRef('')
  const boundRef = useRef<Bound | null>(null)

  queryRef.current = query

  const setHi = useCallback((value: number) => {
    hiRef.current = value
    setHiState(value)
  }, [])

  const setQuery = useCallback((value: string) => {
    setQueryState(value)
    hiRef.current = 0
    setHiState(0)
  }, [])

  const bind = useCallback((next: Bound | null, token?: object) => {
    if (next === null) {
      if (token && boundRef.current?.token !== token) return
      boundRef.current = null
      return
    }
    boundRef.current = next
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setWordHits([])
      setSearching(false)
      return
    }
    let live = true
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchWords(q)
        .then((rows) => {
          if (!live) return
          setWordHits(
            rows.map((row) => ({
              key: `w:${row[0]}`,
              to: `/words/${encodeURIComponent(row[0])}`,
              label: row[0],
              hint: row[1],
              meta: '单词',
              tone: 'word',
            })),
          )
        })
        .finally(() => {
          if (live) setSearching(false)
        })
    }, 160)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      if (event.key === '/' && !isField(event.target)) {
        event.preventDefault()
        inputRef.current?.focus()
        return
      }
      if (event.key === 'Escape') {
        if (queryRef.current) {
          event.preventDefault()
          setQueryState('')
          hiRef.current = 0
          setHiState(0)
          return
        }
        if (document.activeElement === inputRef.current) {
          inputRef.current?.blur()
          return
        }
        if (boundRef.current?.onEscape?.()) event.preventDefault()
        return
      }
      const bound = boundRef.current
      if (!bound || bound.rows.length === 0) return
      if (isField(event.target) && event.target !== inputRef.current) return
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const next = Math.max(0, Math.min(bound.rows.length - 1, hiRef.current + delta))
        hiRef.current = next
        setHiState(next)
        const row = bound.rows[next]
        if (row) bound.onCommit(row, 'arrow')
        return
      }
      if (event.key === 'Enter') {
        const row = bound.rows[hiRef.current]
        if (!row) return
        event.preventDefault()
        bound.onCommit(row, 'enter')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const value = useMemo(
    () => ({
      query,
      setQuery,
      hi,
      setHi,
      inputRef,
      wordHits,
      searching,
      index: data,
      indexError: error,
      bind,
    }),
    [query, setQuery, hi, setHi, wordHits, searching, data, error, bind],
  )

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>
}

export function useDesk(): DeskContextValue {
  const value = useContext(DeskContext)
  if (!value) throw new Error('desk')
  return value
}

export function useDeskKeys(params: {
  rows: DeskRow[]
  enabled?: boolean
  onCommit: (row: DeskRow, how: CommitHow) => void
  onEscape?: () => boolean
}): void {
  const { hi, setHi, bind } = useDesk()
  const paramsRef = useRef(params)
  paramsRef.current = params
  const enabled = params.enabled !== false
  const count = params.rows.length

  useEffect(() => {
    if (count > 0 && hi > count - 1) setHi(count - 1)
  }, [hi, count, setHi])

  useEffect(() => {
    if (!enabled) return
    const token = {}
    bind({
      token,
      get rows() {
        return paramsRef.current.rows
      },
      onCommit: (row, how) => paramsRef.current.onCommit(row, how),
      onEscape: () => Boolean(paramsRef.current.onEscape?.()),
    })
    return () => {
      bind(null, token)
    }
  }, [enabled, bind])
}

export function RowList({
  rows,
  hi,
  pathname,
  label,
  idPrefix,
  onPick,
}: {
  rows: DeskRow[]
  hi: number
  pathname: string
  label: string
  idPrefix: string
  onPick: (row: DeskRow, index: number) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const activeKey = rows[hi]?.key
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [hi, activeKey])

  return (
    <div
      ref={listRef}
      className="list"
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={rows[hi] ? `${idPrefix}-row-${hi}` : undefined}
    >
      {rows.map((row, index) => {
        const on = samePath(pathname, row.to)
        return (
          <button
            key={row.key}
            type="button"
            role="option"
            id={`${idPrefix}-row-${index}`}
            data-idx={index}
            aria-selected={on}
            tabIndex={-1}
            className={`row tone-${row.tone}${index === hi ? ' is-hi' : ''}${on ? ' is-on' : ''}`}
            onClick={() => onPick(row, index)}
          >
            <span className="row__form">{row.label}</span>
            <span className="row__hint">{row.hint}</span>
            <span className="row__meta">{row.meta}</span>
          </button>
        )
      })}
    </div>
  )
}
