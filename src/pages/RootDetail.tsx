import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RelationGraph } from '../components/RelationGraph'
import { loadMorpheme } from '../lib/data'
import { starFromMorpheme } from '../lib/graphModel'
import type { MorphemeChunk, Word } from '../types'
import { KIND_LABEL, isMorphemeKind, levelLabel } from '../types'

function architecture(chunk: MorphemeChunk): { key: string; words: Word[] }[] {
  const groups = new Map<string, Word[]>()
  for (const word of chunk.words) {
    const others = word.parts.filter((part) => part.id !== chunk.id)
    const key = others.length ? others.map((part) => `${part.form} ${part.meaning}`).join(' + ') : '只有这个词素'
    const list = groups.get(key) || []
    list.push(word)
    groups.set(key, list)
  }
  return [...groups.entries()]
    .map(([key, words]) => ({ key, words }))
    .sort((a, b) => b.words.length - a.words.length)
}

export function RootWorkbench({ id }: { id: string }) {
  const { search } = useLocation()
  const [chunk, setChunk] = useState<MorphemeChunk | null>(null)
  const [error, setError] = useState('')
  const [hot, setHot] = useState<string | null>(null)
  const kind = id.split('/')[0] || ''

  useEffect(() => {
    if (!isMorphemeKind(kind) || !id.includes('/')) {
      setError('没有这个词素')
      setChunk(null)
      return
    }
    let live = true
    setChunk(null)
    setError('')
    setHot(null)
    loadMorpheme(id)
      .then((data) => {
        if (live) setChunk(data)
      })
      .catch(() => {
        if (live) setError('这个词素加载失败')
      })
    return () => {
      live = false
    }
  }, [id, kind])

  const spec = useMemo(() => (chunk ? starFromMorpheme(chunk) : null), [chunk])
  const groups = useMemo(() => (chunk ? architecture(chunk) : []), [chunk])

  if (error) return <p className="empty-pane">{error}</p>
  if (!chunk || !spec) return <p className="empty-pane">正在打开这一族</p>

  return (
    <div className="detail">
      <header className="detail-head">
        <div className="detail-title">
          <h1 className={`sort sort--hero tone-${chunk.kind}`}>
            <span className="sort__kind">{KIND_LABEL[chunk.kind]}</span>
            <span className="sort__form">{chunk.form}</span>
          </h1>
          <div>
            <p className="meaning">{chunk.meaning}</p>
            <p className="quiet">{chunk.words.length} 个词从这一块长出来</p>
          </div>
        </div>
        {chunk.story ? <p className="prose">{chunk.story}</p> : null}
        <div className="actions">
          <Link className="btn primary" to={`/study?m=${encodeURIComponent(chunk.id)}`}>
            学这一组
          </Link>
        </div>
      </header>
      <div className="detail-body">
        <div className="family">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="group-label">{group.key}</h2>
              <ul className="family-list">
                {group.words.map((word) => (
                  <li key={word.spelling}>
                    <Link
                      to={{ pathname: `/words/${encodeURIComponent(word.spelling)}`, search }}
                      className={hot === `w:${word.spelling}` ? 'family-link is-hot' : 'family-link'}
                      onMouseEnter={() => setHot(`w:${word.spelling}`)}
                      onMouseLeave={() => setHot(null)}
                    >
                      <strong>{word.spelling}</strong>
                      <span>{word.gloss}</span>
                      {word.levels[0] ? <em>{levelLabel(word.levels[0])}</em> : null}
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

export function RootDetailPage() {
  const { kind = '', slug = '' } = useParams()
  return <RootWorkbench id={`${kind}/${slug}`} />
}
