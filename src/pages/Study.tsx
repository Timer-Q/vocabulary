import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ComposingStick } from '../components/ComposingStick'
import { loadMorpheme, loadOrphans, loadSection, studyWords, useIndex } from '../lib/data'
import { useDesk } from '../lib/desk'
import { dueEntries, gradeCard, markRootDone, rememberRoot, useProgress } from '../lib/progress'
import type { ReviewResult } from '../lib/sm2'
import { KIND_LABEL, type Word } from '../types'

const grades: { id: ReviewResult; label: string; key: string }[] = [
  { id: 'unknown', label: '不认识', key: '1' },
  { id: 'vague', label: '模糊', key: '2' },
  { id: 'known', label: '认识', key: '3' },
  { id: 'mastered', label: '掌握', key: '4' },
]

type QueueItem = { word: Word; chunk: string }

type Session = {
  title: string
  bucket: 'new' | 'review'
  rootId: string | null
  queue: QueueItem[]
  finishedAllNew: boolean
}

function isField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function StudyPage() {
  const [params] = useSearchParams()
  const morphemeId = params.get('m')
  const sectionId = params.get('s')
  const mode = params.get('mode')
  const progress = useProgress()
  const { data } = useIndex()
  const desk = useDesk()
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mark, setMark] = useState<ReviewResult | null>(null)
  const [done, setDone] = useState(false)
  const [reload, setReload] = useState(0)
  const shownAt = useRef(Date.now())
  const flippedRef = useRef(false)
  const markRef = useRef<ReviewResult | null>(null)

  useEffect(() => {
    let live = true
    setDone(false)
    setIndex(0)
    setFlipped(false)
    flippedRef.current = false
    setMark(null)
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
          title: `${chunk.form} ${KIND_LABEL[chunk.kind]}`,
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
    flippedRef.current = false
    setMark(null)
    markRef.current = null
  }, [word?.spelling])

  function grade(result: ReviewResult) {
    if (!session || !card || markRef.current) return
    if (!flippedRef.current) return
    markRef.current = result
    setMark(result)
    gradeCard(card.word.spelling, card.chunk, result, Date.now() - shownAt.current, session.bucket)
    window.setTimeout(() => {
      markRef.current = null
      setMark(null)
      if (index + 1 >= session.queue.length) {
        if (session.rootId && session.finishedAllNew) markRootDone(session.rootId)
        setDone(true)
      } else {
        setIndex((current) => current + 1)
      }
    }, 160)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!word || done || desk.query.trim()) return
      if (event.isComposing || isField(event.target)) return
      if (event.key === ' ' || event.key === 'Enter') {
        if ((event.target as HTMLElement | null)?.closest('.grade, a, .btn')) return
        event.preventDefault()
        flippedRef.current = true
        setFlipped(true)
      }
      const map: Record<string, ReviewResult> = { '1': 'unknown', '2': 'vague', '3': 'known', '4': 'mastered' }
      const result = map[event.key]
      if (result && flippedRef.current) grade(result)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nextRoot = useMemo(() => {
    const roots = data?.morphemes.filter((item) => item.kind === 'root') ?? []
    return roots.find((item) => !progress.doneRoots.includes(item.id) && item.id !== session?.rootId)
  }, [data, progress.doneRoots, session?.rootId])

  if (!morphemeId && !sectionId && mode !== 'review') {
    const roots = data?.morphemes.filter((item) => item.kind === 'root') ?? []
    const upcoming = roots.find((item) => !progress.doneRoots.includes(item.id)) || roots[0]
    return (
      <div className="study-stage">
        <header className="detail-head">
          <h1>一次学一组</h1>
          <p className="prose">新词按词根成组出现。到期的词会按记忆曲线回来。</p>
        </header>
        <div className="choice-row">
          {upcoming ? (
            <Link className="choice" to={`/study?m=${encodeURIComponent(upcoming.id)}`}>
              <strong>学 {upcoming.form}</strong>
              <span>
                {upcoming.meaning}，{upcoming.count} 词
              </span>
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

  if (error) return <p className="empty-pane">{error}</p>
  if (loading || !session) return <p className="empty-pane">正在准备这一组</p>

  if (session.queue.length === 0) {
    return (
      <div className="study-stage">
        <header className="detail-head">
          <p className="quiet">{session.title}</p>
          <h1>{mode === 'review' ? '现在没有到期的词' : '这组已经见过'}</h1>
          <p className="prose">{mode === 'review' ? '去学一个新词根，或者等复习时间到。' : '可以换下一个词根，或回到词族再看一遍结构。'}</p>
          <div className="actions">
            {nextRoot ? (
              <Link className="btn primary" to={`/study?m=${encodeURIComponent(nextRoot.id)}`}>
                下一个 {nextRoot.form}
              </Link>
            ) : null}
            <Link className="btn" to="/roots">
              回词库
            </Link>
          </div>
        </header>
      </div>
    )
  }

  if (done) {
    return (
      <div className="study-stage">
        <header className="detail-head">
          <p className="quiet">本组完成</p>
          <h1>记下了 {session.queue.length} 个</h1>
          <p className="prose">不认识和模糊的词大约 10 分钟后会回到复习队列。</p>
          <div className="actions">
            {session.rootId && !session.finishedAllNew ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setDone(false)
                  setIndex(0)
                  setReload((current) => current + 1)
                }}
              >
                继续这一组
              </button>
            ) : nextRoot ? (
              <Link className="btn primary" to={`/study?m=${encodeURIComponent(nextRoot.id)}`}>
                再来一组 {nextRoot.form}
              </Link>
            ) : (
              <Link className="btn primary" to="/study?mode=review">
                去复习
              </Link>
            )}
            <Link className="btn" to="/">
              回今天
            </Link>
          </div>
        </header>
      </div>
    )
  }

  if (!card || !word) return null
  const step = `${index + 1} / ${session.queue.length}`

  return (
    <div className={`study-stage${mark ? ` mark-${mark}` : ''}`}>
      <header className="study-top">
        <div>
          <p className="quiet">{session.title}</p>
          <h1>{session.bucket === 'review' ? '复习' : '新词'}</h1>
        </div>
        <strong className="step">{step}</strong>
      </header>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${((index + (flipped ? 0.45 : 0.12)) / session.queue.length) * 100}%` }} />
      </div>
      <div className="study-sheet" onClick={() => { flippedRef.current = true; setFlipped(true) }}>
        <p className="spell">{word.spelling}</p>
        {word.phonetic ? <p className="phonetic">/{word.phonetic}/</p> : null}
        <ComposingStick parts={word.parts} conceal={!flipped} />
        {flipped ? (
          <div className="reveal">
            <p className="gloss">{word.gloss}</p>
            {word.examples[0] ? (
              <p className="study-example">
                {word.examples[0].en}
                <span>{word.examples[0].zh}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="hint">空格翻开</p>
        )}
      </div>
      <div className={`grade-dock${flipped ? ' is-ready' : ''}`}>
        {grades.map((gradeItem) => (
          <button
            key={gradeItem.id}
            type="button"
            className={`grade grade-${gradeItem.id}${mark === gradeItem.id ? ' is-flash' : ''}`}
            disabled={!flipped || Boolean(mark)}
            onClick={() => grade(gradeItem.id)}
          >
            <kbd>{gradeItem.key}</kbd>
            {gradeItem.label}
          </button>
        ))}
      </div>
    </div>
  )
}
