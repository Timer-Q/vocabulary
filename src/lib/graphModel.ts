import type { MorphemeChunk, MorphemeKind, SectionChunk, Word } from '../types'
import { KIND_LABEL } from '../types'

export type GraphTone = MorphemeKind | 'word' | 'hub'

export type GNode = {
  id: string
  label: string
  hint: string
  tone: GraphTone
  to: string
}

export type GraphGroup = {
  via: GNode
  children: GNode[]
  viaLabel: string
  childLabel: string
  dashed?: boolean
}

export type GraphListItem = {
  id: string
  to: string
  label: string
  hint: string
}

export type GraphSpec = {
  title: string
  subtitle: string
  mode: 'star' | 'groups'
  focus: GNode
  edgeLabel: string
  leaves: GNode[]
  groups: GraphGroup[]
  listTitle: string
  list: GraphListItem[]
  note: string | null
}

const STAR_CAP = 18

function wordNode(word: Word): GNode {
  return {
    id: `w:${word.spelling}`,
    label: word.spelling,
    hint: word.gloss,
    tone: word.hub ? 'hub' : 'word',
    to: `/words/${encodeURIComponent(word.spelling)}`,
  }
}

function morphNode(id: string, form: string, kind: MorphemeKind, meaning: string): GNode {
  return {
    id: `m:${id}`,
    label: form,
    hint: meaning,
    tone: kind,
    to: `/roots/${id}`,
  }
}

function listFrom(words: Word[]): GraphListItem[] {
  return words.map((word) => ({
    id: word.spelling,
    to: `/words/${encodeURIComponent(word.spelling)}`,
    label: word.spelling,
    hint: word.gloss,
  }))
}

export function starFromMorpheme(chunk: MorphemeChunk): GraphSpec {
  const shown = chunk.words.slice(0, STAR_CAP)
  return {
    title: chunk.form,
    subtitle: `${KIND_LABEL[chunk.kind]} · ${chunk.meaning}`,
    mode: 'star',
    focus: morphNode(chunk.id, chunk.form, chunk.kind, chunk.meaning),
    edgeLabel: '派生',
    leaves: shown.map(wordNode),
    groups: [],
    listTitle: `这一族 ${chunk.words.length} 个词`,
    list: listFrom(chunk.words),
    note:
      chunk.words.length > shown.length
        ? `图上先展开 ${shown.length} 个，剩下的在列表里。点词进入详情。`
        : '每个词都从这一词素长出来。点词进入详情。',
  }
}

export function starFromSection(section: SectionChunk): GraphSpec {
  const hub = section.words.find((word) => word.spelling === section.hub) ?? section.words[0]
  const rest = section.words.filter((word) => word.spelling !== hub?.spelling)
  const shown = rest.slice(0, STAR_CAP)
  const focus = hub
    ? { ...wordNode(hub), tone: 'hub' as const, hint: hub.gloss || '本组中心' }
    : {
        id: `s:${section.id}`,
        label: section.id,
        hint: '讲义组',
        tone: 'hub' as const,
        to: `/sections/${section.id}`,
      }
  return {
    title: section.title,
    subtitle: '讲义同组 · 星形',
    mode: 'star',
    focus,
    edgeLabel: '同组',
    leaves: shown.map(wordNode),
    groups: [],
    listTitle: `同组 ${section.words.length} 个词`,
    list: listFrom(section.words),
    note: `讲义里的关系是星形：中心词 ${section.hub} 连着同组每一个词，词和词之间没有第二条边。图上展开 ${shown.length} 个，避免上百个节点叠在一起。`,
  }
}

export function groupsFromWord(word: Word, family: Word[], section: SectionChunk | null): GraphSpec {
  const groups: GraphGroup[] = []
  const primaryId = word.parts.find((part) => part.type === 'root')?.id || word.morphemes[0]
  const primary = word.parts.find((part) => part.id === primaryId)
  const siblings = family
    .filter((item) => item.spelling !== word.spelling && !item.spelling.includes('-'))
    .slice(0, 8)
  if (primary) {
    groups.push({
      via: morphNode(primary.id, primary.form, primary.type, primary.meaning),
      children: siblings.map(wordNode),
      viaLabel: '构成',
      childLabel: '同族',
    })
  }
  for (const part of word.parts.filter((item) => item.id !== primaryId).slice(0, 2)) {
    groups.push({
      via: morphNode(part.id, part.form, part.type, part.meaning),
      children: [],
      viaLabel: '构成',
      childLabel: '同族',
    })
  }
  if (section) {
    const peers = section.words
      .filter((item) => item.spelling !== word.spelling && item.spelling !== section.hub)
      .slice(0, 6)
    if (word.hub) {
      groups.push({
        via: {
          id: `s:${section.id}`,
          label: section.id,
          hint: '本组由它展开',
          tone: 'hub',
          to: `/sections/${section.id}`,
        },
        children: peers.map(wordNode),
        viaLabel: '中心',
        childLabel: '同组',
        dashed: true,
      })
    } else {
      const hub = section.words.find((item) => item.spelling === section.hub)
      if (hub) {
        groups.push({
          via: { ...wordNode(hub), tone: 'hub', hint: '本组中心' },
          children: peers.map(wordNode),
          viaLabel: '同章',
          childLabel: '同组',
          dashed: true,
        })
      }
    }
  }
  const list = family.length > 0 ? family : section?.words || []
  return {
    title: word.spelling,
    subtitle: word.gloss,
    mode: groups.length > 0 ? 'groups' : 'star',
    focus: wordNode(word),
    edgeLabel: '相关',
    leaves: [],
    groups,
    listTitle: family.length > 0 ? '同族词' : '同组词',
    list: listFrom(list.filter((item) => item.spelling !== word.spelling).slice(0, 40)),
    note:
      groups.length === 0
        ? '这个词在词库里没有词素拆分，也没有讲义同组。'
        : '内圈是构词成分，外圈是同族或同章邻居。点节点打开对应的词或词素。',
  }
}
