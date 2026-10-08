import { useSyncExternalStore } from 'react'
import { calculateNextReview, failedReview, type ReviewResult } from './sm2'

export type CardState = {
  easeFactor: number
  intervalDays: number
  reviewCount: number
  lapses: number
  mastery: number
  dueAt: number
  lastReviewedAt: number
  chunk: string
}

type Persisted = {
  cards: Record<string, CardState>
  doneRoots: string[]
  lastRoot: string | null
  dailyNew: number
  dailyReview: number
  day: string
  newToday: number
  reviewedToday: number
}

const KEY = 'vocabulary-web-progress-v1'

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function emptyState(): Persisted {
  return {
    cards: {},
    doneRoots: [],
    lastRoot: null,
    dailyNew: 8,
    dailyReview: 20,
    day: todayKey(),
    newToday: 0,
    reviewedToday: 0,
  }
}

function rollDay(state: Persisted): Persisted {
  const day = todayKey()
  if (state.day === day) return state
  return { ...state, day, newToday: 0, reviewedToday: 0 }
}

function read(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return rollDay({ ...emptyState(), ...parsed, cards: parsed.cards || {}, doneRoots: parsed.doneRoots || [] })
  } catch {
    return emptyState()
  }
}

let memory = read()
const listeners = new Set<() => void>()

function persist(next: Persisted): void {
  memory = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Persisted {
  const rolled = rollDay(memory)
  if (rolled !== memory) persist(rolled)
  return memory
}

export function useProgress(): Persisted {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function dueEntries(state: Persisted, now = Date.now()): { spelling: string; card: CardState }[] {
  return Object.entries(state.cards)
    .filter(([, card]) => card.reviewCount > 0 && card.dueAt <= now)
    .map(([spelling, card]) => ({ spelling, card }))
}

export function dueCount(state: Persisted, now = Date.now()): number {
  return Object.values(state.cards).filter((card) => card.reviewCount > 0 && card.dueAt <= now).length
}

export function gradeCard(
  spelling: string,
  chunk: string,
  result: ReviewResult,
  responseMs: number,
  bucket: 'new' | 'review',
): void {
  const current = rollDay(memory)
  const prev = current.cards[spelling] ?? {
    easeFactor: 2.5,
    intervalDays: 0,
    reviewCount: 0,
    lapses: 0,
    mastery: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    chunk,
  }
  const isFirst = prev.reviewCount === 0
  const next = calculateNextReview(prev, result, responseMs)
  const dueAt = failedReview(next) ? Date.now() + 10 * 60 * 1000 : Date.now() + next.intervalDays * 86400000
  persist({
    ...current,
    newToday: current.newToday + (bucket === 'new' && isFirst ? 1 : 0),
    reviewedToday: current.reviewedToday + (bucket === 'review' || !isFirst ? 1 : 0),
    cards: {
      ...current.cards,
      [spelling]: {
        ...next,
        dueAt,
        lastReviewedAt: Date.now(),
        chunk,
      },
    },
  })
}

export function rememberRoot(id: string): void {
  if (memory.lastRoot === id) return
  persist({ ...rollDay(memory), lastRoot: id })
}

export function markRootDone(id: string): void {
  const current = rollDay(memory)
  const doneRoots = current.doneRoots.includes(id) ? current.doneRoots : [...current.doneRoots, id]
  persist({ ...current, doneRoots, lastRoot: id })
}

export function setDailyGoals(dailyNew: number, dailyReview: number): void {
  persist({
    ...rollDay(memory),
    dailyNew: Math.min(30, Math.max(4, dailyNew)),
    dailyReview: Math.min(60, Math.max(5, dailyReview)),
  })
}

export function resetProgress(): void {
  persist(emptyState())
}

export function seenCount(state: Persisted): number {
  return Object.values(state.cards).filter((card) => card.reviewCount > 0).length
}

export function masteredCount(state: Persisted): number {
  return Object.values(state.cards).filter((card) => card.mastery >= 4).length
}
