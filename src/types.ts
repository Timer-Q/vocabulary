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
}

export type Word = {
  spelling: string
  phonetic: string
  gloss: string
  levels: string[]
  frequency: number
  parts: Part[]
  morphemes: string[]
  examples: Example[]
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
