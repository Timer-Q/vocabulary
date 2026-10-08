import { Link, useLocation } from 'react-router-dom'
import type { GNode, GraphSpec } from '../lib/graphModel'
import { wordLocation } from '../lib/nav'
import { glossText } from '../types'

function NodeLink({ node }: { node: GNode }) {
  const location = useLocation()
  const spelling = node.id.startsWith('w:') ? node.id.slice(2) : ''
  const to = spelling ? wordLocation(spelling, location) : { pathname: node.to, search: location.search }
  const hint = glossText(node.hint)
  return (
    <Link to={to} className={`tree-link tone-${node.tone}`}>
      <strong>{node.label}</strong>
      {hint ? <span>{hint}</span> : null}
    </Link>
  )
}

export function RelationTree({ spec }: { spec: GraphSpec }) {
  return (
    <details className="rel-tree">
      <summary>
        <span>关系树</span>
        <span className="quiet">{spec.subtitle}</span>
      </summary>
      <div className="rel-tree__body">
        {spec.note ? <p className="quiet">{spec.note}</p> : null}
        <ul className="rel-tree__root">
          <li>
            <NodeLink node={spec.focus} />
            {spec.groups.length > 0 ? (
              spec.groups.map((group) => (
                <details key={group.via.id} className="rel-branch">
                  <summary>
                    {group.viaLabel} · {group.via.label}
                    {glossText(group.via.hint) ? ` ${glossText(group.via.hint)}` : ''}
                    {group.children.length ? ` · ${group.children.length}` : ''}
                  </summary>
                  <ul>
                    <li>
                      <NodeLink node={group.via} />
                    </li>
                    {group.children.map((child) => (
                      <li key={child.id}>
                        <NodeLink node={child} />
                      </li>
                    ))}
                  </ul>
                </details>
              ))
            ) : (
              <details className="rel-branch">
                <summary>
                  {spec.edgeLabel} · {spec.leaves.length}
                </summary>
                <ul>
                  {spec.leaves.map((leaf) => (
                    <li key={leaf.id}>
                      <NodeLink node={leaf} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        </ul>
        {spec.leaves.length === 0 && spec.groups.length === 0 ? <p className="quiet">这一支下面没有别的节点。</p> : null}
      </div>
    </details>
  )
}
