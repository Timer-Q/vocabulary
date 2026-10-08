import { Link } from 'react-router-dom'
import { useIndex } from '../lib/data'
import { dueCount, useProgress } from '../lib/progress'
import { KIND_LABEL, type MorphemeSummary } from '../types'

function nextRoot(roots: MorphemeSummary[], done: string[]): MorphemeSummary | undefined {
  return roots.find((item) => !done.includes(item.id)) || roots[0]
}

export function HomePage() {
  const { data, error } = useIndex()
  const progress = useProgress()
  const due = dueCount(progress)
  const roots = data?.morphemes.filter((item) => item.kind === 'root') ?? []
  const upcoming = nextRoot(roots, progress.doneRoots)
  const goal = progress.dailyNew + progress.dailyReview
  const done = Math.min(goal, progress.newToday + progress.reviewedToday)
  const pct = goal === 0 ? 0 : Math.round((done / goal) * 100)

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow">今天</p>
          <h1>先拆词根，再背单词</h1>
          <p className="lede">
            一组词共用一个词素。学完能在关系图里看见它怎么长出别的词。
          </p>
          <div className="hero__actions">
            {upcoming ? (
              <Link className="button primary" to={`/study?m=${encodeURIComponent(upcoming.id)}`}>
                学习 {upcoming.form}
              </Link>
            ) : (
              <Link className="button primary" to="/study">
                去学习
              </Link>
            )}
            <Link className={`button ${due ? '' : 'ghost'}`} to="/study?mode=review">
              复习到期 {due}
            </Link>
          </div>
        </div>
        <div className="ring-wrap" style={{ ['--p' as string]: String(pct) }}>
          <div className="ring">
            <strong>{pct}%</strong>
            <span>今日</span>
          </div>
          <p>
            新词 {progress.newToday}/{progress.dailyNew}
            <br />
            复习 {progress.reviewedToday}/{progress.dailyReview}
          </p>
        </div>
      </section>

      {error ? <p className="empty">{error}</p> : null}
      {!data && !error ? <div className="skeleton hero-skeleton" /> : null}

      {data ? (
        <>
          <section>
            <div className="section-head">
              <h2>词库有多大</h2>
              <Link to="/roots">全部词素</Link>
            </div>
            <ul className="stat-row">
              <li><strong>{data.stats.morphemes}</strong><span>词素</span></li>
              <li><strong>{data.stats.words}</strong><span>单词</span></li>
              <li><strong>{data.stats.lectureSections}</strong><span>讲义组</span></li>
              <li><strong>{progress.doneRoots.length}</strong><span>学过的词根</span></li>
            </ul>
          </section>
          <section>
            <div className="section-head">
              <h2>从这些词根开始</h2>
              <Link to="/roots">搜索</Link>
            </div>
            <div className="card-grid">
              {roots.slice(0, 8).map((item, index) => (
                <Link key={item.id} to={`/roots/${item.id}`} className="root-card" style={{ animationDelay: `${index * 40}ms` }}>
                  <span className={`kind-pill tone-${item.kind}`}>{KIND_LABEL[item.kind]}</span>
                  <strong>{item.form}</strong>
                  <em>{item.meaning}</em>
                  <span>{item.count} 个词</span>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <div className="section-head">
              <h2>讲义是星形的</h2>
              <span className="muted">中心词连着同组词</span>
            </div>
            <div className="scroller">
              {data.sections.slice(0, 12).map((section) => (
                <Link key={section.id} to={`/sections/${section.id}`} className="section-chip">
                  <strong>{section.hub}</strong>
                  <span>{section.id} · {section.hubGloss}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
