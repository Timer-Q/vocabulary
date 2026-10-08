import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadMorpheme, loadOrphans, loadSection, studyWords, useIndex } from '../lib/data'
import { dueEntries, gradeCard, markRootDone, rememberRoot, useProgress } from '../lib/progress'
import type { ReviewResult } from '../lib/sm2'
import { KIND_LABEL, type Word } from '../types'

const grades: { id: ReviewResult; label: string; tone: 'bad' | 'warn' | 'ok' | 'great' }[] = [
  { id: 'unknown', label: '不认识', tone: 'bad' },
  { id: 'vague', label: '模糊', tone: 'warn' },
  { id: 'known', label: '认识', tone: 'ok' },
  { id: 'mastered', label: '掌握', tone: 'great' },
]

type QueueItem = { word: Word; chunk: string }

type Session = {
  title: string
  bucket: 'new' | 'review'
  rootId: string | null
  queue: QueueItem[]
  finishedAllNew: boolean
}

export function StudyPage() {
  const [params] = useSearchParams()
  const morphemeId = params.get('m')
  const sectionId = params.get('s')
  const mode = params.get('mode')
  const progress = useProgress()
  const { data } = useIndex()
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [done, setDone] = useState(false)
  const [reload, setReload] = useState(0)
  const shownAt = useRef(Date.now())

  useEffect(() => {
    let live = true
    setDone(false)
    setIndex(0)
    setFlipped(false)
    setSession(null)
    setError('')
    if (!morphemeId && !sectionId && mode !== 'review') return
    setLoading(true)
    const run = async () => {
      if (mode === 'review') {
        const due = dueEntries(progress).slice(0, progress.dailyReview)
        const byChunk = new Map<string, string[]>()
        for (const entry of due) {
          const list = byChunk.get(entry.card.chunk) || []
          list.push(entry.spelling)
          byChunk.set(entry.card.chunk, list)
        }
        const queue: QueueItem[] = []
        for (const [chunk, spellings] of byChunk) {
          const source = chunk.startsWith('s/')
            ? await loadSection(chunk.slice(2))
            : chunk.startsWith('w/')
              ? await loadOrphans()
              : await loadMorpheme(chunk.startsWith('m/') ? chunk.slice(2) : chunk)
          const wanted = new Set(spellings)
          for (const item of source.words) {
            if (wanted.has(item.spelling)) queue.push({ word: item, chunk })
          }
        }
        if (!live) return
        setSession({
          title: '到期复习',
          bucket: 'review',
          rootId: null,
          queue,
          finishedAllNew: false,
        })
        return
      }
      if (morphemeId) {
        const chunk = await loadMorpheme(morphemeId)
        rememberRoot(chunk.id)
        const fresh = studyWords(chunk.words).filter((word) => !progress.cards[word.spelling])
        const chunkId = `m/${chunk.id}`
        const queue = fresh.slice(0, progress.dailyNew).map((item) => ({ word: item, chunk: chunkId }))
        if (!live) return
        setSession({
          title: `${chunk.form} · ${KIND_LABEL[chunk.kind]}`,
          bucket: 'new',
          rootId: chunk.kind === 'root' ? chunk.id : null,
          queue,
          finishedAllNew: fresh.length > 0 && fresh.length <= progress.dailyNew,
        })
        return
      }
      if (sectionId) {
        const section = await loadSection(sectionId)
        const fresh = studyWords(section.words).filter((word) => !progress.cards[word.spelling])
        const chunkId = `s/${section.id}`
        if (!live) return
        setSession({
          title: section.title,
          bucket: 'new',
          rootId: null,
          queue: fresh.slice(0, progress.dailyNew).map((item) => ({ word: item, chunk: chunkId })),
          finishedAllNew: fresh.length > 0 && fresh.length <= progress.dailyNew,
        })
      }
    }
    run()
      .catch(() => {
        if (live) setError('这一组加载失败')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
    // progress snapshot is read when the query starts; grading must not rebuild the queue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphemeId, sectionId, mode, reload])

  const card = session?.queue[index]
  const word = card?.word
  useEffect(() => {
    shownAt.current = Date.now()
    setFlipped(false)
  }, [word?.spelling])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || done) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setFlipped(true)
      }
      const map: Record<string, ReviewResult> = { '1': 'unknown', '2': 'vague', '3': 'known', '4': 'mastered' }
      const result = map[event.key]
      if (result && flipped) grade(result)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function grade(result: ReviewResult) {
    if (!session || !card || flash) return
    const good = result === 'known' || result === 'mastered'
    setFlash(good ? 'ok' : 'bad')
    gradeCard(card.word.spelling, card.chunk, result, Date.now() - shownAt.current, session.bucket)
    window.setTimeout(() => {
      setFlash(null)
      if (index + 1 >= session.queue.length) {
        if (session.rootId && session.finishedAllNew) markRootDone(session.rootId)
        setDone(true)
      } else {
        setIndex((current) => current + 1)
      }
    }, 280)
  }

  const nextRoot = useMemo(() => {
    const roots = data?.morphemes.filter((item) => item.kind === 'root') ?? []
    return roots.find((item) => !progress.doneRoots.includes(item.id) && item.id !== session?.rootId)
  }, [data, progress.doneRoots, session?.rootId])

  if (!morphemeId && !sectionId && mode !== 'review') {
    const roots = data?.morphemes.filter((item) => item.kind === 'root') ?? []
    const upcoming = roots.find((item) => !progress.doneRoots.includes(item.id)) || roots[0]
    return (
      <div className="stack">
        <header className="page-intro">
          <p className="eyebrow">学习</p>
          <h1>一次只学一组</h1>
          <p className="lede">新词按词根成组出现。到期的词会按记忆曲线回来。</p>
        </header>
        <div className="choice-grid">
          {upcoming ? (
            <Link className="choice primary" to={`/study?m=${encodeURIComponent(upcoming.id)}`}>
              <strong>学 {upcoming.form}</strong>
              <span>{upcoming.meaning} · {upcoming.count} 词</span>
            </Link>
          ) : null}
          <Link className="choice" to="/study?mode=review">
            <strong>复习到期</strong>
            <span>{dueEntries(progress).length} 个到点了</span>
          </Link>
          <Link className="choice" to="/roots">
            <strong>自己挑一组</strong>
            <span>词根、前缀，或一章讲义</span>
          </Link>
        </div>
      </div>
    )
  }

  if (error) return <p className="empty">{error}</p>
  if (loading || !session) return <div className="skeleton list-skeleton" />

  if (session.queue.length === 0) {
    return (
      <div className="stack">
        <header className="page-intro">
          <p className="eyebrow">{session.title}</p>
          <h1>{mode === 'review' ? '现在没有到期的词' : '这组已经见过'}</h1>
          <p className="lede">{mode === 'review' ? '去学一个新词根，或者等复习时间到。' : '可以换下一个词根，或打开关系图再看一遍结构。'}</p>
          <div className="hero__actions">
            {nextRoot ? (
              <Link className="button primary" to={`/study?m=${encodeURIComponent(nextRoot.id)}`}>
                下一个 {nextRoot.form}
              </Link>
            ) : null}
            <Link className="button" to="/roots">
              回词库
            </Link>
          </div>
        </header>
      </div>
    )
  }

  if (done) {
    return (
      <div className="stack done-panel">
        <div className="burst" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">本组完成</p>
        <h1>记下了 {session.queue.length} 个</h1>
        <p className="lede">不认识的词大约 10 分钟后会回到复习队列。</p>
        <div className="hero__actions">
          {session.rootId && !session.finishedAllNew ? (
            <button type="button" className="button primary" onClick={() => { setDone(false); setIndex(0); setReload((current) => current + 1) }}>
              继续这一组
            </button>
          ) : nextRoot ? (
            <Link className="button primary" to={`/study?m=${encodeURIComponent(nextRoot.id)}`}>
              再来一组 {nextRoot.form}
            </Link>
          ) : (
            <Link className="button primary" to="/study?mode=review">
              去复习
            </Link>
          )}
          <Link className="button" to="/">
            回今天
          </Link>
        </div>
      </div>
    )
  }

  if (!card || !word) return null
  const step = `${index + 1} / ${session.queue.length}`

  return (
    <div className="stack study">
      {flash ? <div className={`flash ${flash}`} /> : null}
      <header className="study__top">
        <div>
          <p className="eyebrow">{session.title}</p>
          <h1>{session.bucket === 'review' ? '复习' : '新词'}</h1>
        </div>
        <strong className="step">{step}</strong>
      </header>
      <div className="meter" aria-hidden>
        <span style={{ width: `${((index + (flipped ? 0.45 : 0.15)) / session.queue.length) * 100}%` }} />
      </div>
      <button type="button" className={`study-card ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped(true)}>
        <span className="study-card__face front">
          <em className="display">{word.spelling}</em>
          {word.phonetic ? <span className="phonetic">/{word.phonetic}/</span> : null}
          <span className="split-row static">
            {word.parts.length ? (
              word.parts.map((part) => (
                <span key={part.id} className={`split-chip tone-${part.type}`}>
                  <small>{KIND_LABEL[part.type]}</small>
                  <strong>{part.form}</strong>
                </span>
              ))
            ) : (
              <span className="muted">没有拆分，翻开看释义</span>
            )}
          </span>
          <span className="flip-hint">{flipped ? '' : '点击翻开 · 空格'}</span>
        </span>
        <span className="study-card__face back">
          <strong className="gloss">{word.gloss}</strong>
          <span className="split-row static">
            {word.parts.map((part) => (
              <span key={part.id} className={`split-chip tone-${part.type}`}>
                <strong>{part.form}</strong>
                <span>{part.meaning}</span>
              </span>
            ))}
          </span>
          {word.examples[0] ? (
            <span className="study-example">
              {word.examples[0].en}
              <small>{word.examples[0].zh}</small>
            </span>
          ) : null}
        </span>
      </button>
      <div className={`grade-bar ${flipped ? 'is-ready' : ''}`}>
        {grades.map((gradeItem) => (
          <button
            key={gradeItem.id}
            type="button"
            className={`grade tone-${gradeItem.tone}`}
            disabled={!flipped || Boolean(flash)}
            onClick={() => grade(gradeItem.id)}
          >
            {gradeItem.label}
          </button>
        ))}
      </div>
    </div>
  )
}
