import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RelationGraph } from '../components/RelationGraph'
import { loadSection } from '../lib/data'
import { starFromSection } from '../lib/graphModel'
import type { SectionChunk } from '../types'

export function SectionPage({ graph = false }: { graph?: boolean }) {
  const { id = '' } = useParams()
  const [section, setSection] = useState<SectionChunk | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setSection(null)
    setError('')
    loadSection(id)
      .then((data) => {
        if (live) setSection(data)
      })
      .catch(() => {
        if (live) setError('这一组加载失败')
      })
    return () => {
      live = false
    }
  }, [id])

  const spec = useMemo(() => (section ? starFromSection(section) : null), [section])
  if (error) return <p className="empty">{error}</p>
  if (!section || !spec) return <div className="skeleton list-skeleton" />

  const letters = new Map<string, SectionChunk['words']>()
  for (const word of section.words) {
    const letter = word.spelling[0] || '#'
    const list = letters.get(letter) || []
    list.push(word)
    letters.set(letter, list)
  }

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="eyebrow">
          <Link to="/roots">词库</Link> · 讲义组
        </p>
        <h1 className="display">{section.hub}</h1>
        <p className="lede">{section.title}。中心词连着同组的每一个词。</p>
        <div className="hero__actions">
          <Link className="button primary" to={`/study?s=${encodeURIComponent(section.id)}`}>
            学这一组
          </Link>
          {graph ? (
            <Link className="button" to={`/sections/${section.id}`}>
              看词表
            </Link>
          ) : (
            <Link className="button" to={`/sections/${section.id}/graph`}>
              全屏关系图
            </Link>
          )}
        </div>
      </header>
      <RelationGraph spec={spec} compact={!graph} />
      {graph
        ? null
        : [...letters.entries()].map(([letter, words]) => (
            <section key={letter}>
              <h2 className="letter-head">{letter}</h2>
              <ul className="word-results">
                {words.map((word) => (
                  <li key={word.spelling}>
                    <Link to={`/words/${encodeURIComponent(word.spelling)}`}>
                      <strong>
                        {word.spelling}
                        {word.hub ? <em className="level">中心</em> : null}
                      </strong>
                      <span>{word.gloss}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
    </div>
  )
}
