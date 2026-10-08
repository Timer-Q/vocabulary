import { Link, useLocation } from 'react-router-dom'
import type { Part } from '../types'
import { KIND_LABEL } from '../types'

export function ComposingStick({
  parts,
  conceal = false,
}: {
  parts: Part[]
  conceal?: boolean
}) {
  const { search } = useLocation()
  if (parts.length === 0) return <p className="quiet">这个词没有词素拆分。</p>
  return (
    <div className={`stick${conceal ? ' is-concealed' : ''}`}>
      {parts.map((part) => (
        <Link key={part.id} to={{ pathname: `/roots/${part.id}`, search }} className={`sort tone-${part.type}`}>
          <span className="sort__kind">{KIND_LABEL[part.type]}</span>
          <span className="sort__form">{part.form}</span>
          <span className="sort__mean">{part.meaning}</span>
        </Link>
      ))}
    </div>
  )
}
