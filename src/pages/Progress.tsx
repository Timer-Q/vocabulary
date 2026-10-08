import { dueCount, masteredCount, resetProgress, seenCount, setDailyGoals, useProgress } from '../lib/progress'
import { useIndex } from '../lib/data'

export function ProgressPage() {
  const progress = useProgress()
  const { data } = useIndex()
  const due = dueCount(progress)
  const seen = seenCount(progress)
  const mastered = masteredCount(progress)

  return (
    <div className="stack narrow">
      <header className="page-intro">
        <p className="eyebrow">进度</p>
        <h1>只记在这台浏览器里</h1>
        <p className="lede">没有账号。清站点数据会把复习进度一起清掉。</p>
      </header>
      <ul className="stat-row">
        <li><strong>{seen}</strong><span>学过</span></li>
        <li><strong>{due}</strong><span>到期</span></li>
        <li><strong>{mastered}</strong><span>较熟</span></li>
        <li><strong>{progress.doneRoots.length}</strong><span>词根组</span></li>
      </ul>
      <section className="goal-card">
        <h2>每天多少</h2>
        <div className="stepper">
          <span>新词</span>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew - 1, progress.dailyReview)}>
            −
          </button>
          <strong>{progress.dailyNew}</strong>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew + 1, progress.dailyReview)}>
            +
          </button>
        </div>
        <div className="stepper">
          <span>复习</span>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew, progress.dailyReview - 5)}>
            −
          </button>
          <strong>{progress.dailyReview}</strong>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew, progress.dailyReview + 5)}>
            +
          </button>
        </div>
      </section>
      {data ? (
        <p className="muted">
          词库里有 {data.stats.words} 个词、{data.stats.morphemes} 个词素。今天已新学 {progress.newToday}，复习 {progress.reviewedToday}。
        </p>
      ) : null}
      <button
        type="button"
        className="button danger"
        onClick={() => {
          if (window.confirm('清除这台浏览器上的学习进度？')) resetProgress()
        }}
      >
        清除进度
      </button>
    </div>
  )
}
