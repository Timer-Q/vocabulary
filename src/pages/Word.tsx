import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ComposingStick } from '../components/ComposingStick'
import { RelationTree } from '../components/RelationTree'
import { ExampleFold, WordList } from '../components/WordList'
import { loadWordBundle } from '../lib/data'
import { groupsFromWord } from '../lib/graphModel'
import { wordGraphPath } from '../lib/nav'
import type { SectionChunk, Word } from '../types'
import { levelLabel } from '../types'

type Bundle = {
  word: Word
  family: Word[]
  section: SectionChunk | null
}

function useWordBundle(spelling: string): { bundle: Bundle | null; error: string; loading: boolean } {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setBundle(null)
    setError('')
    setLoading(true)
    loadWordBundle(spelling)
      .then((next) => {
        if (!live) return
        if (!next) {
          setError('没有找到这个词')
          return
        }
        setBundle(next)
      })
      .catch(() => {
        if (live) setError('没有找到这个词')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [spelling])

  return { bundle, error, loading }
}

export function PhoneticLine({ word }: { word: Pick<Word, 'phonetic' | 'phoneticUs'> }) {
  if (!word.phonetic && !word.phoneticUs) return null
  if (word.phonetic && word.phoneticUs) {
    return (
      <p className="phonetic">
        <span>英 /{word.phonetic}/</span>
        <span>美 /{word.phoneticUs}/</span>
      </p>
    )
  }
  return <p className="phonetic">/{word.phonetic || word.phoneticUs}/</p>
}

function WordAnalysis({
  word,
  family,
  section,
  linkedParts,
}: {
  word: Word
  family: Word[]
  section: SectionChunk | null
  linkedParts: boolean
}) {
  const neighbors = (family.length > 0 ? family : section?.words || []).filter((item) => item.spelling !== word.spelling)
  return (
    <>
      <header className="detail-head">
        <div className="word-line">
          <h1 className="spell" id="word-title">
            {word.spelling}
          </h1>
          <PhoneticLine word={word} />
        </div>
        <p className="meaning">{word.gloss}</p>
        <div className="tag-row">
          {word.poses.map((pos) => (
            <span key={pos} className="tag">
              {pos}
            </span>
          ))}
          {word.levels.map((level) => (
            <span key={level} className="tag tone-level">
              {levelLabel(level)}
            </span>
          ))}
          {word.lectureRank ? (
            <span className="tag" title="《5500词》讲义里的编号，不是语料库词频">
              词表 {word.lectureRank}
            </span>
          ) : null}
          {word.section ? <span className="tag">{word.section}</span> : null}
          {word.hub ? <span className="tag tone-level">中心</span> : null}
        </div>
        <ComposingStick parts={word.parts} linked={linkedParts} />
        {word.bridge ? <p className="bridge">{word.bridge}</p> : null}
        {word.note ? (
          <section>
            <h2 className="group-label">讲义里的拆法</h2>
            <p className="prose">{word.note}</p>
          </section>
        ) : null}
        {word.examples.length > 0 ? (
          <ExampleFold examples={word.examples} />
        ) : (
          <p className="quiet">讲义里没有这个词的例句。</p>
        )}
      </header>
      {neighbors.length > 0 ? (
        <section className="family-block tone-root">
          <h2 className="group-label">{family.length > 0 ? '同族' : '同组'}</h2>
          <WordList words={neighbors} showExamples={false} replace />
        </section>
      ) : null}
    </>
  )
}

export function WordSheet({ overlay = false }: { overlay?: boolean }) {
  const { spelling = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { bundle, error, loading } = useWordBundle(spelling)
  const panel = useRef<HTMLDivElement>(null)
  const background = (location.state as { background?: unknown } | null)?.background

  useEffect(() => {
    panel.current?.focus()
  }, [spelling])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (background) navigate(-1)
      else navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [background, navigate])

  function close() {
    if (background) navigate(-1)
    else navigate('/')
  }

  return (
    <div
      ref={panel}
      className={overlay ? 'word-sheet is-overlay' : 'word-sheet is-inline'}
      role="dialog"
      aria-modal={overlay ? true : undefined}
      aria-labelledby="word-title"
      tabIndex={-1}
    >
      <div className="word-sheet__bar">
        <button type="button" className="btn" onClick={close}>
          返回
        </button>
        <span className="quiet">Esc</span>
        {bundle ? (
          <Link className="btn primary" to={wordGraphPath(bundle.word.spelling)}>
            进入关联图
          </Link>
        ) : null}
      </div>
      {error ? <p className="empty-pane">{error}</p> : null}
      {loading && !bundle ? <p className="empty-pane">正在打开这个词</p> : null}
      {bundle ? (
        <WordAnalysis word={bundle.word} family={bundle.family} section={bundle.section} linkedParts={false} />
      ) : null}
    </div>
  )
}

export function WordGraphPage() {
  const { spelling = '' } = useParams()
  const { bundle, error, loading } = useWordBundle(spelling)
  const spec = useMemo(
    () => (bundle ? groupsFromWord(bundle.word, bundle.family, bundle.section) : null),
    [bundle],
  )
  if (error) return <p className="empty-pane">{error}</p>
  if (loading || !bundle || !spec) return <p className="empty-pane">正在打开关联图</p>
  const neighbors = (bundle.family.length > 0 ? bundle.family : bundle.section?.words || []).filter(
    (item) => item.spelling !== bundle.word.spelling,
  )
  return (
    <div className="detail">
      <header className="detail-head">
        <p className="quiet">关联图</p>
        <div className="word-line">
          <h1 className="spell">{bundle.word.spelling}</h1>
          <PhoneticLine word={bundle.word} />
        </div>
        <p className="meaning">{bundle.word.gloss}</p>
        <p className="prose">列表是主体。关系树默认收着，展开后才看到词素和同族。</p>
      </header>
      <div className="detail-body">
        <RelationTree spec={spec} />
        {neighbors.length > 0 ? (
          <section className="family-block tone-root">
            <h2 className="group-label">{bundle.family.length > 0 ? '同族' : '同组'}</h2>
            <WordList words={neighbors} active={bundle.word.spelling} />
          </section>
        ) : (
          <p className="quiet">没有同族或同组的词。</p>
        )}
      </div>
    </div>
  )
}
