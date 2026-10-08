import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RelationGraph } from '../components/RelationGraph'
import { loadSection } from '../lib/data'
import { starFromSection } from '../lib/graphModel'
import type { SectionChunk } from '../types'

export function SectionPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const [section, setSection] = useState<SectionChunk | null>(null)
  const [error, setError] = useState('')
  const [hot, setHot] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    setSection(null)
    setError('')
    setHot(null)
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
  if (error) return <p className="empty-pane">{error}</p>
  if (!section || !spec) return <p className="empty-pane">正在打开这一组</p>

  const letters = new Map<string, SectionChunk['words']>()
  for (const word of section.words) {
    const letter = word.spelling[0] || '#'
    const list = letters.get(letter) || []
    list.push(word)
    letters.set(letter, list)
  }

  return (
    <div className="detail">
      <header className="detail-head">
        <p className="quiet">讲义组 {section.id}</p>
        <h1 className="spell">{section.hub}</h1>
        <p className="meaning">{section.title}</p>
        <p className="prose">中心词连着同组的每一个词，词和词之间没有第二条边。</p>
        <div className="actions">
          <Link className="btn primary" to={`/study?s=${encodeURIComponent(section.id)}`}>
            学这一组
          </Link>
        </div>
      </header>
      <div className="detail-body">
        <div className="family">
          {[...letters.entries()].map(([letter, words]) => (
            <section key={letter}>
              <h2 className="group-label">{letter}</h2>
              <ul className="family-list">
                {words.map((word) => (
                  <li key={word.spelling}>
                    <Link
                      to={{ pathname: `/words/${encodeURIComponent(word.spelling)}`, search }}
                      className={hot === `w:${word.spelling}` ? 'family-link is-hot' : 'family-link'}
                      onMouseEnter={() => setHot(`w:${word.spelling}`)}
                      onMouseLeave={() => setHot(null)}
                    >
                      <strong>
                        {word.spelling}
                        {word.hub ? <em>中心</em> : null}
                      </strong>
                      <span>{word.gloss}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <RelationGraph spec={spec} hotId={hot} onHot={setHot} />
      </div>
    </div>
  )
}
