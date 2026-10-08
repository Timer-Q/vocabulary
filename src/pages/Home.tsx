import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RootWorkbench } from './RootDetail'
import { RowList, useDesk, useDeskKeys, type DeskRow } from '../lib/desk'
import { dueCount, useProgress } from '../lib/progress'
import type { MorphemeSummary } from '../types'

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

export function HomePage() {
  const desk = useDesk()
  const progress = useProgress()
  const navigate = useNavigate()
  const location = useLocation()
  const due = dueCount(progress)
  const rows = useMemo(() => {
    const roots = desk.index?.morphemes.filter((item) => item.kind === 'root') ?? []
    const pending = roots.filter((item) => !progress.doneRoots.includes(item.id))
    const finished = roots.filter((item) => progress.doneRoots.includes(item.id))
    return [...pending.map((item) => rootRow(item, false)), ...finished.map((item) => rootRow(item, true))]
  }, [desk.index, progress.doneRoots])

  const searching = desk.query.trim().length > 0
  useDeskKeys({
    rows,
    enabled: !searching,
    onCommit: (row, how) => {
      if (how === 'enter') navigate(row.to)
    },
  })

  const current = rows[Math.min(desk.hi, Math.max(0, rows.length - 1))]
  const goal = progress.dailyNew + progress.dailyReview
  const done = Math.min(goal, progress.newToday + progress.reviewedToday)
  const pct = goal === 0 ? 0 : Math.round((done / goal) * 100)

  return (
    <div className="workspace">
      <section className="master" aria-label="今天的词根">
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
          <div className="actions">
            {current ? (
              <Link className="btn primary" to={`/study?m=${encodeURIComponent(current.key)}`}>
                学习 {current.label}
              </Link>
            ) : (
              <Link className="btn primary" to="/study">
                去学习
              </Link>
            )}
            <Link className="btn" to="/study?mode=review">
              复习到期 {due}
            </Link>
          </div>
          {desk.indexError ? <p className="status">{desk.indexError}</p> : null}
          {!desk.index && !desk.indexError ? <p className="status">正在加载词库</p> : null}
        </header>
        <RowList
          idPrefix="home"
          rows={rows}
          hi={searching ? -1 : desk.hi}
          pathname={location.pathname}
          label="词根"
          onPick={(row) => navigate(row.to)}
        />
      </section>
      <div className="detail-slot">{current ? <RootWorkbench id={current.key} /> : <div className="empty-pane">词库还没打开。</div>}</div>
    </div>
  )
}
