import { useEffect, useState } from 'react'
import type { CatalogRow, IndexData, MorphemeChunk, SectionChunk, Word } from '../types'

const memory = new Map<string, Promise<unknown>>()

function url(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`
}

async function fetchJson<T>(path: string): Promise<T> {
  const key = url(path)
  let pending = memory.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = fetch(key).then(async (response) => {
      if (!response.ok) throw new Error(path)
      return (await response.json()) as T
    })
    memory.set(key, pending)
  }
  return pending
}

export function loadIndex(): Promise<IndexData> {
  return fetchJson<IndexData>('index.json')
}

export function loadMorpheme(id: string): Promise<MorphemeChunk> {
  return fetchJson<MorphemeChunk>(`m/${id}.json`)
}

export function loadSection(id: string): Promise<SectionChunk> {
  return fetchJson<SectionChunk>(`s/${id}.json`)
}

export function loadOrphans(): Promise<{ words: Word[] }> {
  return fetchJson<{ words: Word[] }>('w/orphans.json')
}

export async function loadLetter(letter: string): Promise<CatalogRow[]> {
  const key = /^[a-z]$/.test(letter) ? letter : '_'
  try {
    return await fetchJson<CatalogRow[]>(`catalog/${key}.json`)
  } catch {
    return []
  }
}

export async function lookupWord(spelling: string): Promise<CatalogRow | null> {
  const normalized = spelling.toLowerCase()
  const rows = await loadLetter(normalized[0] || '_')
  return rows.find((row) => row[0] === normalized) ?? null
}

export async function searchWords(query: string): Promise<CatalogRow[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  if (/[\u4e00-\u9fff]/.test(q)) {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const rows = (await Promise.all(letters.map((letter) => loadLetter(letter)))).flat()
    return rows.filter((row) => row[1].includes(q)).slice(0, 30)
  }
  const rows = await loadLetter(q[0] || '_')
  const starts = rows.filter((row) => row[0].startsWith(q))
  const contains = rows.filter((row) => !row[0].startsWith(q) && row[0].includes(q))
  return [...starts, ...contains].slice(0, 30)
}

export function useIndex(): { data?: IndexData; error?: string } {
  const [state, setState] = useState<{ data?: IndexData; error?: string }>({})
  useEffect(() => {
    let live = true
    loadIndex()
      .then((data) => {
        if (live) setState({ data })
      })
      .catch(() => {
        if (live) setState({ error: '词库索引加载失败' })
      })
    return () => {
      live = false
    }
  }, [])
  return state
}

export function studyWords(words: Word[]): Word[] {
  const clean = words.filter((word) => !word.spelling.includes('-') || word.examples.length > 0)
  return clean.length > 0 ? clean : words
}

export function chunkOf(row: CatalogRow): string {
  return row[2]
}
