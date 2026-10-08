import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { RowList, samePath, useDesk, useDeskKeys, type DeskRow } from '../lib/desk'
import { dueCount, useProgress } from '../lib/progress'
import type { MorphemeKind, MorphemeSummary, SectionSummary } from '../types'

const filters: { id: 'all' | MorphemeKind; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'root', label: '词根' },
  { id: 'prefix', label: '前缀' },
  { id: 'suffix', label: '后缀' },
  { id: 'combining_form', label: '组合' },
]

const TodayContext = createContext<string | null>(null)

export function useTodayId(): string | null {
  return useContext(TodayContext)
}

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

function rootRow(item: MorphemeSummary, done: boolean): DeskRow {
  return {
    key: item.id,
    to: `/roots/${item.id}`,
    label: item.form,
    hint: item.meaning,
    meta: done ? `${item.count} 学过` : String(item.count),
    tone: item.kind,
  }
}

function paneFor(path: string): 'today' | 'lex' | null {
  if (path === '/') return 'today'
  if (path.startsWith('/roots') || path.startsWith('/sections') || path.startsWith('/words')) return 'lex'
  return null
}

export function AwaitingSelection() {
  return (
    <div className="empty-pane">
      <p>选中左侧一行，词族和关系图会在这边打开。</p>
    </div>
  )
}

export function LexiconDesk() {
  const location = useLocation()
  const explicit = paneFor(location.pathname)
  const [pane, setPane] = useState<'today' | 'lex'>(explicit ?? 'today')
  useEffect(() => {
    if (explicit) setPane(explicit)
  }, [explicit])

  const keysOn = location.pathname !== '/study' && !location.pathname.startsWith('/me')
  const [todayId, setTodayId] = useState<string | null>(null)

  return (
    <TodayContext.Provider value={todayId}>
      <div className="workspace">
        <section className="master" aria-label="词库列表">
          {pane === 'today' ? <TodayHead /> : <LexHead />}
          <div className="list-stack">
            <div className={pane === 'today' ? 'list-keep' : 'list-keep is-parked'}>
              <TodayList shown={pane === 'today'} keys={pane === 'today' && keysOn} onId={setTodayId} />
            </div>
            <div className={pane === 'lex' ? 'list-keep' : 'list-keep is-parked'}>
              <LexList shown={pane === 'lex'} keys={pane === 'lex' && keysOn} />
            </div>
          </div>
        </section>
        <div className="detail-slot">
          <Outlet />
        </div>
      </div>
    </TodayContext.Provider>
  )
}

function TodayHead() {
  const progress = useProgress()
  const goal = progress.dailyNew + progress.dailyReview
  const done = Math.min(goal, progress.newToday + progress.reviewedToday)
  const pct = goal === 0 ? 0 : Math.round((done / goal) * 100)
  return (
    <header className="master-head">
      <div className="master-head__row">
        <h1>今天</h1>
        <span className="keys" aria-hidden="true">
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>↵</kbd>
        </span>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="quiet">
        新词 {progress.newToday}/{progress.dailyNew}，复习 {progress.reviewedToday}/{progress.dailyReview}
      </p>
      <TodayActions />
    </header>
  )
}

function TodayActions() {
  const todayId = useTodayId()
  const due = dueCount(useProgress())
  return (
    <div className="actions">
      {todayId ? (
        <Link className="btn primary" to={`/study?m=${encodeURIComponent(todayId)}`}>
          学习这一组
        </Link>
      ) : (
        <Link className="btn primary" to="/study">
          去学习
        </Link>
      )}
      <Link className="btn" to="/study?mode=review">
        复习 {due}
      </Link>
    </div>
  )
}

function TodayList({ shown, keys, onId }: { shown: boolean; keys: boolean; onId: (id: string | null) => void }) {
  const desk = useDesk()
  const progress = useProgress()
  const navigate = useNavigate()
  const location = useLocation()
  const [hi, setHi] = useState(0)
  const rows = useMemo(() => {
    const roots = desk.index?.morphemes.filter((item) => item.kind === 'root') ?? []
    const pending = roots.filter((item) => !progress.doneRoots.includes(item.id))
    const finished = roots.filter((item) => progress.doneRoots.includes(item.id))
    return [...pending.map((item) => rootRow(item, false)), ...finished.map((item) => rootRow(item, true))]
  }, [desk.index, progress.doneRoots])

  useEffect(() => {
    if (rows.length === 0) {
      onId(null)
      return
    }
    const next = Math.max(0, Math.min(hi, rows.length - 1))
    if (next !== hi) setHi(next)
    onId(rows[next]?.key ?? null)
  }, [rows, hi, onId])

  useDeskKeys({
    rows,
    enabled: keys && desk.query.trim().length === 0,
    onCommit: (row, how) => {
      const index = rows.findIndex((item) => item.key === row.key)
      if (index >= 0) setHi(index)
      if (how === 'enter') navigate(row.to)
    },
  })

  return (
      <RowList
        idPrefix="home"
        rows={rows}
        hi={desk.query.trim() ? -1 : hi}
        pathname={location.pathname}
        label="今天的词根"
        follow={shown}
        onPick={(row, index) => {
          setHi(index)
          navigate(row.to)
        }}
      />
  )
}

function LexHead() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = location.pathname.startsWith('/sections') ? 'section' : deskTab(location.search)
  const kind = kindFrom(location.search)

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
    const pathname = location.pathname.startsWith('/roots') ? location.pathname : '/roots'
    navigate({ pathname, search: search ? `?${search}` : '' }, { replace: true })
  }

  return (
    <header className="master-head">
      <div className="master-head__row">
        <h1>词库</h1>
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
    </header>
  )
}

function LexList({ shown, keys }: { shown: boolean; keys: boolean }) {
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
    enabled: keys,
    onCommit: (row, how) => navigate({ pathname: row.to, search: location.search }, how === 'arrow' ? { replace: true } : undefined),
    onEscape: () => {
      if (location.pathname !== '/roots') {
        navigate({ pathname: '/roots', search: location.search })
        return true
      }
      return false
    },
  })

  useEffect(() => {
    if (!shown || desk.query.trim()) return
    const idx = rows.findIndex((row) => samePath(location.pathname, row.to))
    if (idx >= 0 && idx !== desk.hi) desk.setHi(idx)
  }, [location.pathname, rowSig, desk.query, desk.hi, desk.setHi, rows, shown])

  return (
    <>
      {desk.indexError ? <p className="status">{desk.indexError}</p> : null}
      {!desk.index && !desk.indexError ? <p className="status">正在加载词库</p> : null}
      {desk.searching ? <p className="status">还在找单词</p> : null}
      {desk.index && rows.length === 0 ? <p className="status">没有匹配。</p> : null}
      <RowList
        idPrefix="lex"
        rows={rows}
        hi={desk.hi}
        pathname={location.pathname}
        label={tab === 'section' ? '讲义组' : '词素'}
        follow={shown}
        onPick={(row, index) => {
          desk.setHi(index)
          navigate({ pathname: row.to, search: location.search })
        }}
      />
    </>
  )
}

function deskTab(search: string): 'morpheme' | 'section' {
  return new URLSearchParams(search).get('tab') === 'section' ? 'section' : 'morpheme'
}

function kindFrom(search: string): (typeof filters)[number]['id'] {
  const value = new URLSearchParams(search).get('kind')
  return filters.some((item) => item.id === value) ? (value as (typeof filters)[number]['id']) : 'all'
}
