import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { wordLocation } from '../lib/nav'
import type { Example, Word } from '../types'
import { glossText, levelLabel } from '../types'

export function ExampleFold({ examples }: { examples: Example[] }) {
  const [open, setOpen] = useState(false)
  if (examples.length === 0) return null
  const shown = open ? examples : examples.slice(0, 1)
  return (
    <div className="example-fold">
      <ul className="examples">
        {shown.map((example) => (
          <li key={example.en}>
            <p>{example.en}</p>
            {example.zh ? <span>{example.zh}</span> : null}
          </li>
        ))}
      </ul>
      {examples.length > 1 ? (
        <button type="button" className="text-btn" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? '收起例句' : `还有 ${examples.length - 1} 条例句`}
        </button>
      ) : null}
    </div>
  )
}

function PhoneticBits({ word }: { word: Pick<Word, 'phonetic' | 'phoneticUs'> }) {
  if (!word.phonetic && !word.phoneticUs) return null
  if (word.phonetic && word.phoneticUs) {
    return (
      <span className="family-phon">
        英 /{word.phonetic}/ 美 /{word.phoneticUs}/
      </span>
    )
  }
  return <span className="family-phon">/{word.phonetic || word.phoneticUs}/</span>
}

export function WordList({
  words,
  showExamples = true,
  active = '',
  replace = false,
}: {
  words: Word[]
  showExamples?: boolean
  active?: string
  replace?: boolean
}) {
  const location = useLocation()
  return (
    <ul className="family-list">
      {words.map((word) => (
        <li key={word.spelling} className={word.spelling === active ? 'family-item is-on' : 'family-item'}>
          <Link to={wordLocation(word.spelling, location)} replace={replace} className="family-link">
            <span className="family-spell">
              <strong>{word.spelling}</strong>
              <PhoneticBits word={word} />
            </span>
            <span className="family-gloss">{word.gloss}</span>
            <span className="tag-row">
              {word.poses.map((pos) => (
                <em key={pos} className="tag">
                  {pos}
                </em>
              ))}
              {word.levels.map((level) => (
                <em key={level} className="tag tone-level">
                  {levelLabel(level)}
                </em>
              ))}
              {word.lectureRank ? <em className="tag">词表 {word.lectureRank}</em> : null}
              {word.hub ? <em className="tag tone-level">中心</em> : null}
              {word.parts.map((part) => {
                const meaning = glossText(part.meaning)
                return (
                  <em key={part.id} className={`tag tone-${part.type}`}>
                    {part.form}
                    {meaning ? ` ${meaning}` : ''}
                  </em>
                )
              })}
            </span>
          </Link>
          {showExamples && word.examples.length > 0 ? <ExampleFold examples={word.examples} /> : null}
        </li>
      ))}
    </ul>
  )
}
