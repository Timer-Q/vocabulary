import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RelationTree } from '../components/RelationTree'
import { WordList } from '../components/WordList'
import { loadMorpheme } from '../lib/data'
import { starFromMorpheme } from '../lib/graphModel'
import type { MorphemeChunk, Word } from '../types'
import { KIND_LABEL, glossText, isMorphemeKind } from '../types'

function architecture(chunk: MorphemeChunk): { key: string; tone: string; words: Word[] }[] {
  const groups = new Map<string, { tone: string; words: Word[] }>()
  for (const word of chunk.words) {
    const others = word.parts.filter((part) => part.id !== chunk.id)
    const key = others.length
      ? others
          .map((part) => {
            const meaning = glossText(part.meaning)
            return meaning ? `${part.form} ${meaning}` : part.form
          })
          .join(' + ')
      : '只有这个词素'
    const tone = others[0]?.type || chunk.kind
    const entry = groups.get(key) || { tone, words: [] }
    entry.words.push(word)
    groups.set(key, entry)
  }
  return [...groups.entries()]
    .map(([key, value]) => ({ key, tone: value.tone, words: value.words }))
    .sort((a, b) => b.words.length - a.words.length)
}

export function RootWorkbench({ id }: { id: string }) {
  const [chunk, setChunk] = useState<MorphemeChunk | null>(null)
  const [error, setError] = useState('')
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
            {glossText(chunk.meaning) ? <p className="meaning">{glossText(chunk.meaning)}</p> : null}
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
        <RelationTree spec={spec} />
        <div className="family">
          {groups.map((group) => (
            <section key={group.key} className={`family-block tone-${group.tone}`}>
              <h2 className="group-label">{group.key}</h2>
              <WordList words={group.words} />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RootDetailPage() {
  const { kind = '', slug = '' } = useParams()
  return <RootWorkbench id={`${kind}/${slug}`} />
}
