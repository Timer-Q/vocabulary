import { Link, useLocation } from 'react-router-dom'
import type { Part } from '../types'
import { KIND_LABEL, glossText } from '../types'

export function ComposingStick({
  parts,
  conceal = false,
  linked = true,
}: {
  parts: Part[]
  conceal?: boolean
  linked?: boolean
}) {
  const { search } = useLocation()
  if (parts.length === 0) return <p className="quiet">这个词没有词素拆分。</p>
  return (
    <div className={`stick${conceal ? ' is-concealed' : ''}`}>
      {parts.map((part) => {
        const meaning = glossText(part.meaning)
        const body = (
          <>
            <span className="sort__kind">{KIND_LABEL[part.type]}</span>
            <span className="sort__form">{part.form}</span>
            {meaning ? <span className="sort__mean">{meaning}</span> : null}
          </>
        )
        if (!linked) {
          return (
            <div key={part.id} className={`sort tone-${part.type}`}>
              {body}
            </div>
          )
        }
        return (
          <Link key={part.id} to={{ pathname: `/roots/${part.id}`, search }} className={`sort tone-${part.type}`}>
            {body}
          </Link>
        )
      })}
    </div>
  )
}
