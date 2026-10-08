import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ComposingStick } from '../components/ComposingStick'
import { RelationGraph } from '../components/RelationGraph'
import { loadMorpheme, loadOrphans, loadSection, lookupWord } from '../lib/data'
import { groupsFromWord } from '../lib/graphModel'
import type { SectionChunk, Word } from '../types'
import { levelLabel } from '../types'

export function WordPage() {
  const { spelling = '' } = useParams()
  const { search } = useLocation()
  const [word, setWord] = useState<Word | null>(null)
  const [family, setFamily] = useState<Word[]>([])
  const [section, setSection] = useState<SectionChunk | null>(null)
  const [error, setError] = useState('')
  const [hot, setHot] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    setWord(null)
    setFamily([])
    setSection(null)
    setError('')
    setHot(null)
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
  if (error) return <p className="empty-pane">{error}</p>
  if (!word || !spec) return <p className="empty-pane">正在打开这个词</p>

  const neighbors = (family.length > 0 ? family : section?.words || []).filter((item) => item.spelling !== word.spelling)

  return (
    <div className="detail">
      <header className="detail-head">
        <h1 className="spell">{word.spelling}</h1>
        {word.phonetic ? <p className="phonetic">/{word.phonetic}/</p> : null}
        <p className="meaning">{word.gloss}</p>
        <div className="meta-row">
          {word.levels.map((level) => (
            <span key={level}>{levelLabel(level)}</span>
          ))}
          {word.section ? (
            <Link to={{ pathname: `/sections/${word.section}`, search }}>
              {word.section}
              {word.hub ? ' 中心' : ''}
            </Link>
          ) : null}
        </div>
        <ComposingStick parts={word.parts} />
      </header>
      <div className="detail-body">
        <div className="family">
          {word.note ? (
            <section>
              <h2 className="group-label">讲义里的拆法</h2>
              <p className="prose">{word.note}</p>
            </section>
          ) : null}
          <section>
            <h2 className="group-label">例句</h2>
            {word.examples.length === 0 ? <p className="quiet">讲义里没有可用例句。派生词库的例句是模板句，这里不拿来充数。</p> : null}
            <ul className="examples">
              {word.examples.map((example) => (
                <li key={example.en}>
                  <p>{example.en}</p>
                  <span>{example.zh}</span>
                </li>
              ))}
            </ul>
          </section>
          {neighbors.length > 0 ? (
            <section>
              <h2 className="group-label">{family.length > 0 ? '同族' : '同组'}</h2>
              <ul className="family-list">
                {neighbors.slice(0, 40).map((item) => (
                  <li key={item.spelling}>
                    <Link
                      to={{ pathname: `/words/${encodeURIComponent(item.spelling)}`, search }}
                      className={hot === `w:${item.spelling}` ? 'family-link is-hot' : 'family-link'}
                      onMouseEnter={() => setHot(`w:${item.spelling}`)}
                      onMouseLeave={() => setHot(null)}
                    >
                      <strong>{item.spelling}</strong>
                      <span>{item.gloss}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <RelationGraph spec={spec} hotId={hot} onHot={setHot} />
      </div>
    </div>
  )
}
