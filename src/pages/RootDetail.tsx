import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

export function RootDetailPage({ graph = false }: { graph?: boolean }) {
  const { kind = '', slug = '' } = useParams()
  const id = `${kind}/${slug}`
  const [chunk, setChunk] = useState<MorphemeChunk | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isMorphemeKind(kind) || !slug) {
      setError('没有这个词素')
      return
    }
    let live = true
    setChunk(null)
    setError('')
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
  }, [id, kind, slug])

  const spec = useMemo(() => (chunk ? starFromMorpheme(chunk) : null), [chunk])
  const groups = useMemo(() => (chunk ? architecture(chunk) : []), [chunk])

  if (error) return <p className="empty">{error}</p>
  if (!chunk || !spec) return <div className="skeleton list-skeleton" />

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="eyebrow">
          <Link to="/roots">词库</Link> · {KIND_LABEL[chunk.kind]}
        </p>
        <h1 className="display">{chunk.form}</h1>
        <p className="lede">{chunk.meaning}</p>
        {chunk.story ? <p className="story">{chunk.story}</p> : null}
        <div className="hero__actions">
          <Link className="button primary" to={`/study?m=${encodeURIComponent(chunk.id)}`}>
            学这一组
          </Link>
          {graph ? (
            <Link className="button" to={`/roots/${chunk.id}`}>
              看词族结构
            </Link>
          ) : (
            <Link className="button" to={`/roots/${chunk.id}/graph`}>
              全屏关系图
            </Link>
          )}
        </div>
      </header>
      <RelationGraph spec={spec} compact={!graph} />
      {graph ? null : (
        <section className="stack">
          <div className="section-head">
            <h2>怎么拼在一起</h2>
            <span className="muted">{chunk.words.length} 个词，按另外的词素分组</span>
          </div>
          {groups.map((group) => (
            <section key={group.key} className="arch-group">
              <h3>{group.key}</h3>
              <ul className="word-results">
                {group.words.map((word) => (
                  <li key={word.spelling}>
                    <Link to={`/words/${encodeURIComponent(word.spelling)}`}>
                      <strong>{word.spelling}</strong>
                      <span>{word.gloss}</span>
                      {word.levels[0] ? <em className="level">{levelLabel(word.levels[0])}</em> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      )}
    </div>
  )
}
