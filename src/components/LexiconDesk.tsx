import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { RowList, samePath, useDesk, useDeskKeys, type DeskRow } from '../lib/desk'
import type { MorphemeKind, MorphemeSummary, SectionSummary } from '../types'

const filters: { id: 'all' | MorphemeKind; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'root', label: '词根' },
  { id: 'prefix', label: '前缀' },
  { id: 'suffix', label: '后缀' },
  { id: 'combining_form', label: '组合' },
]

function morphRow(item: MorphemeSummary): DeskRow {
  return {
    key: item.id,
    to: `/roots/${item.id}`,
    label: item.form,
    hint: item.meaning,
    meta: String(item.count),
    tone: item.kind,
  }
}

function sectionRow(item: SectionSummary): DeskRow {
  return {
    key: `s:${item.id}`,
    to: `/sections/${item.id}`,
    label: item.hub,
    hint: item.hubGloss,
    meta: item.id,
    tone: 'hub',
  }
}

export function AwaitingSelection() {
  return (
    <div className="empty-pane">
      <p>选中左侧一行，词族和关系图会在这边打开。</p>
    </div>
  )
}

export function LexiconDesk() {
  const desk = useDesk()
  const navigate = useNavigate()
  const location = useLocation()
  const tab = location.pathname.startsWith('/sections') ? 'section' : deskTab(location.search)
  const kind = kindFrom(location.search)

  const rows = useMemo(() => {
    const data = desk.index
    if (!data) return []
    const q = desk.query.trim().toLowerCase()
    const raw = desk.query.trim()
    if (tab === 'section') {
      const sections = data.sections
        .filter((item) => {
          if (!q) return true
          return item.hub.includes(q) || item.id.toLowerCase().includes(q) || item.hubGloss.includes(raw)
        })
        .map(sectionRow)
      return q ? [...desk.wordHits, ...sections] : sections
    }
    const morphs = data.morphemes
      .filter((item) => {
        if (kind !== 'all' && item.kind !== kind) return false
        if (!q) return true
        return item.form.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q)
      })
      .map(morphRow)
    return q ? [...desk.wordHits, ...morphs] : morphs
  }, [desk.index, desk.query, desk.wordHits, tab, kind])

  const rowSig = rows.map((row) => row.key).join('|')

  useDeskKeys({
    rows,
    onCommit: (row, how) => navigate({ pathname: row.to, search: location.search }, how === 'arrow' ? { replace: true } : undefined),
    onEscape: () => {
      if (location.pathname !== '/roots') {
        navigate('/roots')
        return true
      }
      return false
    },
  })

  useEffect(() => {
    if (desk.query.trim()) return
    const idx = rows.findIndex((row) => samePath(location.pathname, row.to))
    if (idx >= 0 && idx !== desk.hi) desk.setHi(idx)
  }, [location.pathname, rowSig, desk.query, desk.hi, desk.setHi, rows])

  function setTab(next: 'morpheme' | 'section') {
    const params = new URLSearchParams(location.search)
    if (next === 'section') params.set('tab', 'section')
    else params.delete('tab')
    const search = params.toString()
    navigate({ pathname: '/roots', search: search ? `?${search}` : '' }, { replace: true })
  }

  function setKind(next: (typeof filters)[number]['id']) {
    const params = new URLSearchParams(location.search)
    params.delete('tab')
    if (next === 'all') params.delete('kind')
    else params.set('kind', next)
    const search = params.toString()
    navigate({ pathname: location.pathname.startsWith('/roots') ? location.pathname : '/roots', search: search ? `?${search}` : '' }, { replace: true })
  }

  return (
    <div className="workspace">
      <section className="master" aria-label="词库列表">
        <header className="master-head">
          <div className="master-head__row">
            <h1>词库</h1>
            <span className="count-quiet">{rows.length}</span>
            <span className="keys" aria-hidden="true">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <kbd>↵</kbd>
            </span>
          </div>
          <div className="toolbar">
            <div className="seg" role="group" aria-label="词库分区">
              <button type="button" className={tab === 'morpheme' ? 'is-on' : ''} onClick={() => setTab('morpheme')}>
                词素
              </button>
              <button type="button" className={tab === 'section' ? 'is-on' : ''} onClick={() => setTab('section')}>
                讲义组
              </button>
            </div>
            {tab === 'morpheme' ? (
              <select
                aria-label="词素类型"
                value={kind}
                onChange={(event) => setKind(event.target.value as (typeof filters)[number]['id'])}
              >
                {filters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {desk.indexError ? <p className="status">{desk.indexError}</p> : null}
          {!desk.index && !desk.indexError ? <p className="status">正在加载词库</p> : null}
          {desk.searching ? <p className="status">还在找单词</p> : null}
          {desk.index && rows.length === 0 ? <p className="status">没有匹配。</p> : null}
        </header>
        <RowList
          idPrefix="lex"
          rows={rows}
          hi={desk.hi}
          pathname={location.pathname}
          label={tab === 'section' ? '讲义组' : '词素'}
          onPick={(row, index) => {
            desk.setHi(index)
            navigate({ pathname: row.to, search: location.search })
          }}
        />
      </section>
      <div className="detail-slot">
        <Outlet />
      </div>
    </div>
  )
}

function deskTab(search: string): 'morpheme' | 'section' {
  return new URLSearchParams(search).get('tab') === 'section' ? 'section' : 'morpheme'
}

function kindFrom(search: string): (typeof filters)[number]['id'] {
  const value = new URLSearchParams(search).get('kind')
  return filters.some((item) => item.id === value) ? (value as (typeof filters)[number]['id']) : 'all'
}
