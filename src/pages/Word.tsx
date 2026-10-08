import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RelationGraph } from '../components/RelationGraph'
import { loadMorpheme, loadOrphans, loadSection, lookupWord } from '../lib/data'
import { groupsFromWord } from '../lib/graphModel'
import type { SectionChunk, Word } from '../types'
import { KIND_LABEL, levelLabel } from '../types'

export function WordPage({ graph = false }: { graph?: boolean }) {
  const { spelling = '' } = useParams()
  const [word, setWord] = useState<Word | null>(null)
  const [family, setFamily] = useState<Word[]>([])
  const [section, setSection] = useState<SectionChunk | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setWord(null)
    setFamily([])
    setSection(null)
    setError('')
    lookupWord(spelling)
      .then(async (row) => {
        if (!row) throw new Error('missing')
        let nextFamily: Word[] = []
        let nextSection: SectionChunk | null = null
        let nextWord: Word | undefined
        if (row[2].startsWith('m/')) {
          const chunk = await loadMorpheme(row[2].slice(2))
          nextFamily = chunk.words
          nextWord = chunk.words.find((item) => item.spelling === row[0])
          if (nextWord?.section) nextSection = await loadSection(nextWord.section)
        } else if (row[2].startsWith('s/')) {
          nextSection = await loadSection(row[2].slice(2))
          nextWord = nextSection.words.find((item) => item.spelling === row[0])
          const root = nextWord?.parts.find((part) => part.type === 'root')
          if (root) {
            try {
              nextFamily = (await loadMorpheme(root.id)).words
            } catch {
              nextFamily = []
            }
          }
        } else {
          const pack = await loadOrphans()
          nextWord = pack.words.find((item) => item.spelling === row[0])
        }
        if (!nextWord) throw new Error('missing')
        if (!live) return
        setWord(nextWord)
        setFamily(nextFamily)
        setSection(nextSection)
      })
      .catch(() => {
        if (live) setError('没有找到这个词')
      })
    return () => {
      live = false
    }
  }, [spelling])

  const spec = useMemo(() => (word ? groupsFromWord(word, family, section) : null), [word, family, section])
  if (error) return <p className="empty">{error}</p>
  if (!word || !spec) return <div className="skeleton list-skeleton" />

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="eyebrow">单词</p>
        <h1 className="display">{word.spelling}</h1>
        {word.phonetic ? <p className="phonetic">/{word.phonetic}/</p> : null}
        <p className="lede">{word.gloss}</p>
        <div className="chip-row">
          {word.levels.map((level) => (
            <span key={level} className="kind-pill">
              {levelLabel(level)}
            </span>
          ))}
          {word.section ? (
            <Link className="kind-pill tone-hub" to={`/sections/${word.section}`}>
              {word.section}
              {word.hub ? ' · 中心' : ''}
            </Link>
          ) : null}
        </div>
        <div className="split-row">
          {word.parts.length ? (
            word.parts.map((part) => (
              <Link key={part.id} to={`/roots/${part.id}`} className={`split-chip tone-${part.type}`}>
                <small>{KIND_LABEL[part.type]}</small>
                <strong>{part.form}</strong>
                <span>{part.meaning}</span>
              </Link>
            ))
          ) : (
            <p className="muted">这个词没有词素拆分。</p>
          )}
        </div>
        {graph ? null : (
          <div className="hero__actions">
            <Link className="button" to={`/words/${encodeURIComponent(word.spelling)}/graph`}>
              全屏关系图
            </Link>
          </div>
        )}
      </header>
      <RelationGraph spec={spec} compact={!graph} />
      {graph ? null : (
        <>
          {word.note ? (
            <section className="note-card">
              <h2>讲义里的拆法</h2>
              <p>{word.note}</p>
            </section>
          ) : null}
          <section>
            <h2>例句</h2>
            {word.examples.length === 0 ? <p className="muted">讲义里没有可用例句。派生词库的例句是模板句，这里不拿来充数。</p> : null}
            <ul className="examples">
              {word.examples.map((example) => (
                <li key={example.en}>
                  <p>{example.en}</p>
                  <span>{example.zh}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
