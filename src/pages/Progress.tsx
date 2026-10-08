import { dueCount, masteredCount, resetProgress, seenCount, setDailyGoals, useProgress } from '../lib/progress'
import { useIndex } from '../lib/data'

export function ProgressPage() {
  const progress = useProgress()
  const { data } = useIndex()
  const due = dueCount(progress)
  const seen = seenCount(progress)
  const mastered = masteredCount(progress)

  return (
    <div className="settings">
      <header className="detail-head">
        <h1>进度</h1>
        <p className="prose">只记在这台浏览器里。清站点数据会把复习进度一起清掉。</p>
      </header>
      <dl className="ledger">
        <div>
          <dt>学过</dt>
          <dd>{seen}</dd>
        </div>
        <div>
          <dt>到期</dt>
          <dd>{due}</dd>
        </div>
        <div>
          <dt>较熟</dt>
          <dd>{mastered}</dd>
        </div>
        <div>
          <dt>词根组</dt>
          <dd>{progress.doneRoots.length}</dd>
        </div>
      </dl>
      <section className="goals">
        <h2>每天多少</h2>
        <div className="stepper">
          <span>新词</span>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew - 1, progress.dailyReview)} aria-label="减少新词">
            −
          </button>
          <strong>{progress.dailyNew}</strong>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew + 1, progress.dailyReview)} aria-label="增加新词">
            +
          </button>
        </div>
        <div className="stepper">
          <span>复习</span>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew, progress.dailyReview - 5)} aria-label="减少复习">
            −
          </button>
          <strong>{progress.dailyReview}</strong>
          <button type="button" onClick={() => setDailyGoals(progress.dailyNew, progress.dailyReview + 5)} aria-label="增加复习">
            +
          </button>
        </div>
      </section>
      {data ? (
        <p className="quiet">
          词库里有 {data.stats.words} 个词、{data.stats.morphemes} 个词素。今天已新学 {progress.newToday}，复习 {progress.reviewedToday}。
        </p>
      ) : null}
      <button
        type="button"
        className="btn danger"
        onClick={() => {
          if (window.confirm('清除这台浏览器上的学习进度？')) resetProgress()
        }}
      >
        清除进度
      </button>
    </div>
  )
}
