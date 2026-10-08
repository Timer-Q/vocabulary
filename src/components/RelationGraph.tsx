import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { samePath } from '../lib/desk'
import type { GNode, GraphSpec } from '../lib/graphModel'

type Placed = { node: GNode; x: number; y: number; tier: 'focus' | 'mid' | 'leaf' }
type DrawnEdge = { x1: number; y1: number; x2: number; y2: number; label: string; dashed?: boolean }

const WIDTH = 1000
const HEIGHT = 720

function boxSize(label: string, tier: Placed['tier']): { w: number; h: number } {
  const unit = tier === 'focus' ? 15 : 12
  const min = tier === 'leaf' ? 86 : tier === 'mid' ? 96 : 120
  return { w: Math.min(188, Math.max(min, label.length * unit + 36)), h: tier === 'focus' ? 62 : 46 }
}

function placeStar(spec: GraphSpec): { nodes: Placed[]; edges: DrawnEdge[] } {
  const cx = WIDTH / 2
  const cy = HEIGHT / 2 - 10
  const focus: Placed = { node: spec.focus, x: cx, y: cy, tier: 'focus' }
  const leaves = spec.leaves.map((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(spec.leaves.length, 1)) * Math.PI * 2
    const ring = spec.leaves.length > 10 && index >= 10 ? 292 : 214
    return {
      node,
      x: cx + Math.cos(angle) * ring,
      y: cy + Math.sin(angle) * ring * 0.86,
      tier: 'leaf' as const,
    }
  })
  const nodes = [focus, ...leaves]
  const edges = leaves.map((leaf) => ({
    x1: focus.x,
    y1: focus.y,
    x2: leaf.x,
    y2: leaf.y,
    label: spec.edgeLabel,
    dashed: spec.edgeLabel === '同组',
  }))
  return { nodes, edges }
}

function placeGroups(spec: GraphSpec): { nodes: Placed[]; edges: DrawnEdge[] } {
  const cx = WIDTH / 2
  const cy = HEIGHT / 2 - 6
  const focus: Placed = { node: spec.focus, x: cx, y: cy, tier: 'focus' }
  const nodes: Placed[] = [focus]
  const edges: DrawnEdge[] = []
  const count = Math.max(spec.groups.length, 1)
  spec.groups.forEach((group, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
    const via: Placed = {
      node: group.via,
      x: cx + Math.cos(angle) * 196,
      y: cy + Math.sin(angle) * 168,
      tier: 'mid',
    }
    nodes.push(via)
    edges.push({ x1: focus.x, y1: focus.y, x2: via.x, y2: via.y, label: group.viaLabel, dashed: group.dashed })
    const kids = group.children
    const spread = Math.min(Math.PI * 0.85, 0.34 * Math.max(kids.length - 1, 1) + 0.2)
    kids.forEach((child, childIndex) => {
      const childAngle = kids.length === 1 ? angle : angle - spread / 2 + (childIndex / (kids.length - 1)) * spread
      const placed: Placed = {
        node: child,
        x: via.x + Math.cos(childAngle) * 168,
        y: via.y + Math.sin(childAngle) * 132,
        tier: 'leaf',
      }
      nodes.push(placed)
      edges.push({
        x1: via.x,
        y1: via.y,
        x2: placed.x,
        y2: placed.y,
        label: group.childLabel,
        dashed: group.dashed,
      })
    })
  })
  return { nodes, edges }
}

export function RelationGraph({
  spec,
  hotId = null,
  onHot,
}: {
  spec: GraphSpec
  hotId?: string | null
  onHot?: (id: string | null) => void
}) {
  const layout = useMemo(() => (spec.mode === 'groups' ? placeGroups(spec) : placeStar(spec)), [spec])
  const [hover, setHover] = useState<string | null>(null)
  const active = hotId ?? hover
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const frame = useRef<HTMLDivElement>(null)
  const markerId = useId().replace(/:/g, '')
  const navigate = useNavigate()
  const location = useLocation()

  function point(id: string | null) {
    setHover(id)
    onHot?.(id)
  }

  useEffect(() => {
    const node = frame.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY < 0 ? 0.08 : -0.08
      setView((current) => ({ ...current, k: Math.min(2.2, Math.max(0.7, current.k + delta)) }))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    setView({ x: 0, y: 0, k: 1 })
  }, [spec.focus.id])

  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const hovered = layout.nodes.find((item) => item.node.id === active)?.node

  return (
    <section className="graph-pane" aria-label="关系图">
      <div className="graph-bar">
        <p>{spec.note}</p>
        <div className="graph-tools">
          <button type="button" onClick={() => setView((current) => ({ ...current, k: Math.min(2.2, current.k + 0.12) }))}>
            放大
          </button>
          <button type="button" onClick={() => setView((current) => ({ ...current, k: Math.max(0.7, current.k - 0.12) }))}>
            缩小
          </button>
          <button type="button" onClick={() => setView({ x: 0, y: 0, k: 1 })}>
            复位
          </button>
        </div>
      </div>
      <div
        className="graph-frame"
        ref={frame}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('.graph-node')) return
          drag.current = { x: event.clientX, y: event.clientY, px: view.x, py: view.y }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          setView((current) => ({
            ...current,
            x: drag.current!.px + event.clientX - drag.current!.x,
            y: drag.current!.py + event.clientY - drag.current!.y,
          }))
        }}
        onPointerUp={() => {
          drag.current = null
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="graph-svg"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          role="img"
          aria-label={`${spec.title} 的关系图`}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.2 L 8 5 L 0 8.8 z" className="graph-arrow" />
            </marker>
          </defs>
          {layout.edges.map((edge, index) => (
            <line
              key={`${edge.x1}-${edge.y1}-${index}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              className={edge.dashed ? 'graph-edge is-dashed' : 'graph-edge'}
              markerEnd={`url(#${markerId})`}
            />
          ))}
          {layout.nodes.map((placed) => {
            const { w, h } = boxSize(placed.node.label, placed.tier)
            const hot = active === placed.node.id
            const on = samePath(location.pathname, placed.node.to)
            return (
              <g
                key={placed.node.id}
                className={`graph-node tone-${placed.node.tone} tier-${placed.tier}${hot ? ' is-hot' : ''}${on ? ' is-on' : ''}`}
                onMouseEnter={() => point(placed.node.id)}
                onMouseLeave={() => point(null)}
                onFocus={() => point(placed.node.id)}
                onBlur={() => point(null)}
                onClick={() => navigate({ pathname: placed.node.to, search: location.search })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.stopPropagation()
                    navigate({ pathname: placed.node.to, search: location.search })
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <rect x={placed.x - w / 2} y={placed.y - h / 2} width={w} height={h} rx={2} />
                <text x={placed.x} y={placed.y - (placed.node.hint && placed.tier !== 'leaf' ? 8 : 0)} textAnchor="middle" dominantBaseline="middle">
                  {placed.node.label}
                </text>
                {placed.tier !== 'leaf' && placed.node.hint ? (
                  <text x={placed.x} y={placed.y + 14} textAnchor="middle" dominantBaseline="middle" className="graph-hint">
                    {placed.node.hint.slice(0, 14)}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
        {hovered ? (
          <p className="graph-float">
            {hovered.label}
            <span>{hovered.hint}</span>
          </p>
        ) : null}
      </div>
    </section>
  )
}
