import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DeskProvider, RowList, useDesk, useDeskKeys, type DeskRow } from '../lib/desk'
import type { MorphemeSummary, SectionSummary } from '../types'

const nav = [
  { to: '/', label: '今天', match: (path: string) => path === '/' },
  {
    to: '/roots',
    label: '词库',
    match: (path: string) => path.startsWith('/roots') || path.startsWith('/sections') || path.startsWith('/words'),
  },
  { to: '/study', label: '学习', match: (path: string) => path.startsWith('/study') },
  { to: '/me', label: '进度', match: (path: string) => path.startsWith('/me') },
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

function SearchPopover() {
  const desk = useDesk()
  const navigate = useNavigate()
  const location = useLocation()
  const q = desk.query.trim().toLowerCase()
  const morphs = (desk.index?.morphemes ?? [])
    .filter((item) => item.form.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q))
    .slice(0, 40)
    .map(morphRow)
  const sections = (desk.index?.sections ?? [])
    .filter((item) => item.hub.includes(q) || item.id.toLowerCase().includes(q) || item.hubGloss.includes(desk.query.trim()))
    .slice(0, 12)
    .map(sectionRow)
  const rows = [...desk.wordHits, ...morphs, ...sections]
  useDeskKeys({
    rows,
    onCommit: (row) => navigate(row.to),
  })
  return (
    <div className="popover" role="presentation">
      {desk.searching ? <p className="status">还在找单词</p> : null}
      {rows.length === 0 && !desk.searching ? <p className="status">没有匹配。</p> : null}
      <RowList
        idPrefix="hit"
        rows={rows}
        hi={desk.hi}
        pathname={location.pathname}
        label="搜索结果"
        onPick={(row, index) => {
          desk.setHi(index)
          navigate(row.to)
        }}
      />
    </div>
  )
}

function DeskFrame() {
  const location = useLocation()
  const desk = useDesk()
  const lexicon =
    location.pathname.startsWith('/roots') ||
    location.pathname.startsWith('/sections') ||
    location.pathname.startsWith('/words')
  const showPopover = desk.query.trim().length > 0 && !lexicon

  return (
    <div className="desk">
      <a className="skip" href="#content">
        跳到内容
      </a>
      <aside className="rail">
        <Link to="/" className="brand">
          <span className="brand__sort">根</span>
          <span>词根词汇</span>
        </Link>
        <nav className="rail-nav" aria-label="主导航">
          {nav.map((item) => {
            const on = item.match(location.pathname)
            return (
              <Link key={item.to} to={item.to} className={on ? 'rail-link is-on' : 'rail-link'} aria-current={on ? 'page' : undefined}>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="desk-main">
        <div className="command-wrap">
          <form
            className="command"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              ref={desk.inputRef}
              value={desk.query}
              onChange={(event) => desk.setQuery(event.target.value)}
              placeholder="词素、释义或单词"
              aria-label="搜索词素或单词"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd aria-hidden="true">/</kbd>
          </form>
          {showPopover ? <SearchPopover /> : null}
        </div>
        <main id="content" className="desk-slot">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function Shell() {
  return (
    <DeskProvider>
      <DeskFrame />
    </DeskProvider>
  )
}
