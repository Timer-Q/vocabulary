import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchWords, useIndex } from '../lib/data'
import type { CatalogRow, MorphemeKind } from '../types'
import { KIND_LABEL } from '../types'

const filters: { id: 'all' | MorphemeKind; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'root', label: '词根' },
  { id: 'prefix', label: '前缀' },
  { id: 'suffix', label: '后缀' },
  { id: 'combining_form', label: '组合' },
]

export function RootsPage() {
  const { data, error } = useIndex()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<(typeof filters)[number]['id']>('all')
  const [tab, setTab] = useState<'morpheme' | 'section'>('morpheme')
  const [hits, setHits] = useState<CatalogRow[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 1 || tab !== 'morpheme') {
      setHits([])
      return
    }
    let live = true
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchWords(q)
        .then((rows) => {
          if (live) setHits(rows)
        })
        .finally(() => {
          if (live) setSearching(false)
        })
    }, 160)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [query, tab])

  const morphemes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.morphemes ?? []).filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false
      if (!q) return true
      return item.form.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q)
    })
  }, [data, kind, query])

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.sections ?? []).filter((item) => {
      if (!q) return true
      return item.hub.includes(q) || item.id.toLowerCase().includes(q) || item.hubGloss.includes(query.trim())
    })
  }, [data, query])

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="eyebrow">词库</p>
        <h1>按词素找，不按字母表淹没</h1>
        <p className="lede">搜词根、前缀，或者直接搜单词。讲义组单独放着，因为它们是另一套结构。</p>
      </header>
      <div className="search-bar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="act、离开、abandon"
          aria-label="搜索词素或单词"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      <div className="chip-row">
        <button type="button" className={tab === 'morpheme' ? 'is-on' : ''} onClick={() => setTab('morpheme')}>
          词素
        </button>
        <button type="button" className={tab === 'section' ? 'is-on' : ''} onClick={() => setTab('section')}>
          讲义组
        </button>
        {tab === 'morpheme'
          ? filters.map((item) => (
              <button key={item.id} type="button" className={kind === item.id ? 'is-on' : ''} onClick={() => setKind(item.id)}>
                {item.label}
              </button>
            ))
          : null}
      </div>
      {error ? <p className="empty">{error}</p> : null}
      {!data && !error ? <div className="skeleton list-skeleton" /> : null}
      {tab === 'morpheme' && hits.length > 0 ? (
        <section>
          <h2>单词</h2>
          <ul className="word-results">
            {hits.map((row) => (
              <li key={row[0]}>
                <Link to={`/words/${encodeURIComponent(row[0])}`}>
                  <strong>{row[0]}</strong>
                  <span>{row[1]}</span>
                </Link>
              </li>
            ))}
          </ul>
          {searching ? <p className="muted">还在找…</p> : null}
        </section>
      ) : null}
      {tab === 'morpheme' ? (
        <ul className="morpheme-list">
          {morphemes.map((item) => (
            <li key={item.id}>
              <Link to={`/roots/${item.id}`}>
                <span className={`kind-pill tone-${item.kind}`}>{KIND_LABEL[item.kind]}</span>
                <strong>{item.form}</strong>
                <em>{item.meaning}</em>
                <span className="count">{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="morpheme-list">
          {sections.map((item) => (
            <li key={item.id}>
              <Link to={`/sections/${item.id}`}>
                <span className="kind-pill tone-hub">{item.id}</span>
                <strong>{item.hub}</strong>
                <em>{item.hubGloss}</em>
                <span className="count">{item.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data && tab === 'morpheme' && morphemes.length === 0 ? <p className="empty">没有这个词素。</p> : null}
    </div>
  )
}
