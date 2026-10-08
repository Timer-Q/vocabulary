export type MorphemeKind = 'root' | 'prefix' | 'suffix' | 'combining_form'

export type Part = {
  form: string
  type: MorphemeKind
  id: string
  meaning: string
}

export type Example = {
  en: string
  zh: string
  source?: string
  url?: string
}

export type WordAudio = {
  url: string
  license: string
  attribution: string
}

export type Word = {
  spelling: string
  phonetic: string
  phoneticUs: string
  gloss: string
  bridge: string | null
  levels: string[]
  poses: string[]
  frequency: number
  /** Ordinal in the 5500 lecture list. Null when the word is not in that list. */
  lectureRank: number | null
  parts: Part[]
  morphemes: string[]
  examples: Example[]
  audio: WordAudio | null
  note: string | null
  section: string | null
  hub: boolean
}

export type MorphemeChunk = {
  id: string
  form: string
  kind: MorphemeKind
  meaning: string
  story: string
  words: Word[]
}

export type SectionChunk = {
  id: string
  hub: string
  title: string
  words: Word[]
}

export type MorphemeSummary = {
  id: string
  form: string
  kind: MorphemeKind
  meaning: string
  count: number
}

export type SectionSummary = {
  id: string
  hub: string
  hubGloss: string
  count: number
  title: string
}

export type IndexData = {
  stats: {
    morphemes: number
    words: number
    derivedWords: number
    lectureWords: number
    lectureOnly: number
    lectureSections: number
    examples: number
  }
  morphemes: MorphemeSummary[]
  sections: SectionSummary[]
}

export type CatalogRow = [string, string, string, string]

export const KIND_LABEL: Record<MorphemeKind, string> = {
  root: '词根',
  prefix: '前缀',
  suffix: '后缀',
  combining_form: '组合',
}

const LEVEL_LABEL: Record<string, string> = {
  cet4: '四级',
  cet6: '六级',
  kaoyan: '考研',
  ielts: '雅思',
  toefl: '托福',
}

export function levelLabel(level: string): string {
  return LEVEL_LABEL[level] || level
}

export function isMorphemeKind(value: string): value is MorphemeKind {
  return value === 'root' || value === 'prefix' || value === 'suffix' || value === 'combining_form'
}

/** Hide type-labels that were stored in place of a gloss. Real glosses pass through. */
export function glossText(meaning: string | null | undefined): string {
  const text = (meaning || '').trim()
  if (!text || text === '见词族' || text === '前缀' || text === '后缀' || text === '词根' || text === '词干') return ''
  if (/^(名词|动词|形容词|副词)?(前缀|后缀)$/.test(text)) return ''
  if (/^(前缀|后缀|词根|词干)/.test(text) && text.length <= 8) return ''
  return text
}
