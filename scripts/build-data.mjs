import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const seedDir = path.join(root, 'seed')
const outDir = path.join(root, 'public', 'data')

const GENERIC = new Set(['前缀', '后缀', '词根', '名词', '动词', '形容词', '副词'])

function load(name) {
  return readFile(path.join(seedDir, name), 'utf8').then((text) => JSON.parse(text))
}

async function loadOptional(name) {
  try {
    return await load(name)
  } catch (error) {
    if (error && error.code === 'ENOENT') return []
    throw error
  }
}

function normForm(form) {
  return String(form || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function morphemeId(kind, form) {
  return `${kind}/${normForm(form)}`
}

function cleanText(value) {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/[\u0000-\u0008]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGenericMeaning(meaning) {
  const text = cleanText(meaning)
  if (!text || text === '见词族') return true
  if (GENERIC.has(text)) return true
  if (/^(前缀|后缀|词根|词干)/.test(text)) return true
  if (/^(名词|动词|形容词|副词)?(前缀|后缀)$/.test(text)) return true
  if (text.includes('-=')) return true
  return false
}

function glossOf(word) {
  const parts = Array.isArray(word.pos) ? word.pos : []
  const senses = []
  for (const part of parts) {
    let text = cleanText(part?.meaning || '')
    text = text.replace(/^\[[^\]]+\]\s*/, '')
    text = text.replace(/^[a-z][a-z./]*\.?\s+/i, '')
    text = text.replace(/[（(]解读[\s\S]*$/, '').trim()
    text = text.replace(/[，,]\s*$/, '')
    if (text) senses.push(text)
  }
  return senses.join('；') || '暂无简明释义'
}

function meaningFromStory(story) {
  if (!story) return ''
  const matched =
    story.match(/本义「([^」]{1,32})」/) ||
    story.match(/多表示「([^」]{1,32})」/) ||
    story.match(/常表达「([^」]{1,32})」/) ||
    story.match(/「([^」]{1,24})」/)
  return matched ? matched[1] : ''
}

/** Short gloss only, from the fixed affix-story shapes. Not the long story, not 本义. */
function affixStoryGloss(story) {
  if (!story) return ''
  const matched = story.match(/多表示「([^」]*)」/) || story.match(/常表达「([^」]*)」/)
  if (!matched) return ''
  const gloss = cleanText(matched[1])
  return gloss && !isGenericMeaning(gloss) ? gloss : ''
}

function cleanPhon(value) {
  return cleanText(value)
    .replace(/^[\/\[]+|[\/\]]+$/g, '')
    .trim()
}

function phoneticsOf(word) {
  if (!word) return { phonetic: '', phoneticUs: '' }
  let uk = cleanPhon(word.phoneticUk || '')
  let us = cleanPhon(word.phoneticUs || '')
  if (uk && us && uk === us) us = ''
  if (!uk && us) {
    uk = us
    us = ''
  }
  return { phonetic: uk, phoneticUs: us }
}

function bridgeOf(word) {
  const text = cleanText(word?.bridge || '')
  return text ? text.slice(0, 240) : null
}

function exampleScore(example) {
  const en = cleanText(example.sentence)
  const zh = cleanText(example.translation)
  if (!en || !zh) return -1
  if (/carries the idea|shifts the word|承载「/.test(`${en}${zh}`)) return -1
  let score = 0
  if (en.includes(' ') && en.length >= 16 && en.length <= 180) score += 5
  if (/[a-z]/i.test(en) && /[\u4e00-\u9fff]/.test(zh)) score += 2
  if (en.length < 8) score -= 2
  return score
}

async function main() {
  const [
    derivedWords,
    links,
    stories,
    lectureWords,
    lectureExamples,
    lectureNotes,
    sections,
  ] = await Promise.all([
    load('derived-words.json'),
    load('derived-morpheme-links.json'),
    load('derived-morpheme-stories.json'),
    load('lecture-words.json'),
    load('lecture-examples.json'),
    load('lecture-word-notes.json'),
    load('lecture-sections.json'),
  ])
  const [externalGlosses, externalMorphemes, externalExamples] = await Promise.all([
    loadOptional('external-glosses.json'),
    loadOptional('external-morphemes.json'),
    loadOptional('external-examples.json'),
  ])

  const storyById = new Map()
  const affixByForm = new Map()
  for (const story of stories) {
    storyById.set(morphemeId(story.kind, story.normalizedForm), story.story)
    if (story.kind !== 'prefix' && story.kind !== 'suffix') continue
    const gloss = affixStoryGloss(story.story)
    const form = normForm(story.normalizedForm)
    if (!gloss || !form || affixByForm.has(form)) continue
    affixByForm.set(form, { kind: story.kind, gloss })
  }

  const externalById = new Map()
  for (const row of [...externalGlosses, ...externalMorphemes]) {
    const kind = row.kind
    const form = normForm(row.normalizedForm || row.form)
    const gloss = cleanText(row.zh || '')
    if (!kind || !form || !gloss || isGenericMeaning(gloss)) continue
    const id = `${kind}/${form}`
    if (externalById.has(id)) continue
    const storyGloss = meaningFromStory(storyById.get(id))
    if (storyGloss && !isGenericMeaning(storyGloss)) continue
    if (kind === 'prefix' || kind === 'suffix') {
      const storyAffix = affixByForm.get(form)
      if (storyAffix && storyAffix.kind === kind) continue
    }
    externalById.set(id, gloss)
  }

  function externalGlossForToken(type, form) {
    const norm = normForm(form)
    if (!norm) return ''
    if (type !== 'prefix' && type !== 'suffix' && type !== 'root' && type !== 'combining_form') return ''
    const exact = externalById.get(`${type}/${norm}`)
    if (exact) return exact
    if (type === 'suffix' && norm.length > 1 && norm.endsWith('s')) {
      return externalById.get(`suffix/${norm.slice(0, -1)}`) || ''
    }
    return ''
  }

  const fallbackSeen = new Set()
  const fallbackGain = { prefix: 0, suffix: 0 }

  function affixGlossForToken(type, form) {
    if (type !== 'prefix' && type !== 'suffix') return ''
    const norm = normForm(form)
    if (!norm) return ''
    const exact = affixByForm.get(norm)
    if (exact && exact.kind === type) return exact.gloss
    if (type === 'suffix' && norm.length > 1 && norm.endsWith('s')) {
      const stem = norm.slice(0, -1)
      const hit = affixByForm.get(stem)
      if (hit && hit.kind === 'suffix') return hit.gloss
    }
    return ''
  }

  function withAffixFallback(spelling, type, form, meaning) {
    if (meaning) return meaning
    const gloss = affixGlossForToken(type, form)
    if (!gloss) return ''
    const key = `${spelling}|${type}|${normForm(form)}`
    if (!fallbackSeen.has(key)) {
      fallbackSeen.add(key)
      fallbackGain[type] += 1
    }
    return gloss
  }

  const linksBySpelling = new Map()
  const displayForm = new Map()
  const meaningVotes = new Map()
  for (const link of links) {
    const id = morphemeId(link.morphemeKind, link.morphemeForm)
    const list = linksBySpelling.get(link.spelling) || []
    list.push(link)
    linksBySpelling.set(link.spelling, list)
    const prev = displayForm.get(id)
    if (!prev || link.morphemeForm.length > prev.length) displayForm.set(id, link.morphemeForm)
  }

  const derivedBySpelling = new Map(derivedWords.map((word) => [word.spelling, word]))
  const lectureBySpelling = new Map(lectureWords.map((word) => [word.spelling, word]))

  for (const word of [...derivedWords, ...lectureWords]) {
    for (const part of word.splitPattern || []) {
      const meaning = cleanText(part.meaning)
      if (isGenericMeaning(meaning)) continue
      const id = morphemeId(part.type, part.rootForm || part.form)
      const bag = meaningVotes.get(id) || new Map()
      bag.set(meaning, (bag.get(meaning) || 0) + 1)
      meaningVotes.set(id, bag)
    }
  }

  function meaningOf(id) {
    const bag = meaningVotes.get(id)
    let best = ''
    let bestCount = 0
    if (bag) {
      for (const [meaning, count] of bag) {
        if (isGenericMeaning(meaning)) continue
        if (count > bestCount || (count === bestCount && meaning.length > best.length)) {
          best = meaning
          bestCount = count
        }
      }
    }
    if (best) return best
    const fromStory = meaningFromStory(storyById.get(id))
    if (fromStory && !isGenericMeaning(fromStory)) return fromStory
    return ''
  }

  const sectionBySpelling = new Map()
  const hubOf = new Map()
  for (const section of sections) {
    hubOf.set(section.sectionId, section.hub)
    for (const spelling of section.members) sectionBySpelling.set(spelling, section.sectionId)
  }

  const notesBySpelling = new Map()
  for (const note of lectureNotes) {
    const text = cleanText(note.etymology)
    if (text) notesBySpelling.set(note.spelling, text.slice(0, 220))
  }

  const examplesBySpelling = new Map()
  for (const example of lectureExamples) {
    if (exampleScore(example) < 2) continue
    const list = examplesBySpelling.get(example.spelling) || []
    list.push({
      en: cleanText(example.sentence).slice(0, 220),
      zh: cleanText(example.translation).slice(0, 220),
      score: exampleScore(example),
    })
    examplesBySpelling.set(example.spelling, list)
  }
  for (const [spelling, list] of examplesBySpelling) {
    list.sort((a, b) => b.score - a.score || a.en.length - b.en.length)
    examplesBySpelling.set(
      spelling,
      list.slice(0, 2).map(({ en, zh }) => ({ en, zh })),
    )
  }
  const externalExampleBag = new Map()
  for (const example of externalExamples) {
    const spelling = cleanText(example.spelling)
    if (!spelling || examplesBySpelling.has(spelling)) continue
    if (exampleScore(example) < 2) continue
    const en = cleanText(example.sentence)
    const zh = cleanText(example.translation)
    if (!en || !zh || en.length > 180) continue
    const list = externalExampleBag.get(spelling) || []
    list.push({
      en: en.slice(0, 220),
      zh: zh.slice(0, 220),
      source: cleanText(example.source) || 'Tatoeba',
      url: cleanText(example.url),
      score: exampleScore(example),
    })
    externalExampleBag.set(spelling, list)
  }
  for (const [spelling, list] of externalExampleBag) {
    list.sort((a, b) => b.score - a.score || a.en.length - b.en.length)
    examplesBySpelling.set(
      spelling,
      list.slice(0, 2).map(({ en, zh, source, url }) => ({ en, zh, source, url })),
    )
  }

  function partsOf(spelling) {
    const derived = derivedBySpelling.get(spelling)
    const lecture = lectureBySpelling.get(spelling)
    const source = derived?.splitPattern?.length ? derived : lecture
    const parts = []
    const seen = new Set()
    for (const part of source?.splitPattern || []) {
      const type = part.type
      if (!type) continue
      const id = morphemeId(type, part.rootForm || part.form)
      if (seen.has(id)) continue
      seen.add(id)
      const form = displayForm.get(id) || part.form
      const voted = meaningOf(id)
      const own = cleanText(part.meaning)
      const ownOk = isGenericMeaning(own) ? '' : own
      const external = ownOk ? '' : externalGlossForToken(type, part.form)
      const baseMeaning = ownOk ? voted || ownOk : voted || external
      parts.push({
        form,
        type,
        id,
        meaning: withAffixFallback(spelling, type, part.form, baseMeaning),
      })
    }
    if (parts.length === 0) {
      for (const link of linksBySpelling.get(spelling) || []) {
        const id = morphemeId(link.morphemeKind, link.morphemeForm)
        if (seen.has(id)) continue
        seen.add(id)
        const linkForm = link.displayForm || link.morphemeForm
        parts.push({
          form: linkForm,
          type: link.morphemeKind,
          id,
          meaning: withAffixFallback(
            spelling,
            link.morphemeKind,
            linkForm,
            meaningOf(id) || externalGlossForToken(link.morphemeKind, linkForm),
          ),
        })
      }
    }
    return parts
  }

  function morphemeIdsOf(spelling) {
    const ids = []
    const seen = new Set()
    for (const link of linksBySpelling.get(spelling) || []) {
      const id = morphemeId(link.morphemeKind, link.morphemeForm)
      if (seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
    return ids
  }

  function primaryId(spelling) {
    const list = linksBySpelling.get(spelling) || []
    const picked =
      list.find((link) => link.morphemeKind === 'root' || link.position === 'root') ||
      list.find((link) => link.morphemeKind === 'combining_form') ||
      list[0]
    return picked ? morphemeId(picked.morphemeKind, picked.morphemeForm) : null
  }

  function buildWord(spelling) {
    const derived = derivedBySpelling.get(spelling)
    const lecture = lectureBySpelling.get(spelling)
    const base = lecture || derived
    if (!base) return null
    const section = sectionBySpelling.get(spelling) || null
    const parts = partsOf(spelling)
    const morphemes = []
    const seen = new Set()
    for (const id of [...parts.map((part) => part.id), ...morphemeIdsOf(spelling)]) {
      if (!id || seen.has(id)) continue
      seen.add(id)
      morphemes.push(id)
    }
    const phon = phoneticsOf(lecture || derived)
    return {
      spelling,
      phonetic: phon.phonetic,
      phoneticUs: phon.phoneticUs,
      gloss: glossOf(base),
      bridge: bridgeOf(lecture) || bridgeOf(derived),
      levels: Array.isArray(base.level) ? base.level : [],
      poses: [
        ...new Set(
          (Array.isArray(base.pos) ? base.pos : [])
            .map((item) => cleanText(item?.pos))
            .filter((item) => item && item.length <= 12),
        ),
      ].slice(0, 6),
      frequency: Number(base.frequency) || 0,
      lectureRank: lecture && Number(lecture.frequency) > 0 ? Number(lecture.frequency) : null,
      parts,
      morphemes,
      examples: examplesBySpelling.get(spelling) || [],
      note: notesBySpelling.get(spelling) || null,
      section,
      hub: section ? hubOf.get(section) === spelling : false,
    }
  }

  const morphemeWords = new Map()
  for (const word of derivedWords) {
    const id = primaryId(word.spelling)
    if (!id) continue
    const list = morphemeWords.get(id) || []
    list.push(word.spelling)
    morphemeWords.set(id, list)
  }

  const kindOrder = { root: 0, prefix: 1, suffix: 2, combining_form: 3 }
  const morphemeMeta = []
  for (const [id, spellings] of morphemeWords) {
    const [kind, slug] = id.split('/')
    const form = displayForm.get(id) || slug
    morphemeMeta.push({
      id,
      form,
      kind,
      meaning: meaningOf(id) || externalById.get(id) || '',
      count: spellings.length,
    })
  }
  morphemeMeta.sort((a, b) => {
    const byKind = (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9)
    if (byKind !== 0) return byKind
    if (b.count !== a.count) return b.count - a.count
    return a.form.localeCompare(b.form)
  })

  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const catalog = []
  let exampleCount = 0

  for (const meta of morphemeMeta) {
    const spellings = morphemeWords.get(meta.id) || []
    const words = spellings
      .map((spelling) => buildWord(spelling))
      .filter(Boolean)
      .sort(compareWords)
    for (const word of words) exampleCount += word.examples.length
    const chunk = {
      id: meta.id,
      form: meta.form,
      kind: meta.kind,
      meaning: meta.meaning,
      story: storyById.get(meta.id) || '',
      words,
    }
    const rel = `m/${meta.id}.json`
    await writeJson(path.join(outDir, rel), chunk)
    for (const word of words) {
      catalog.push([word.spelling, word.gloss, `m/${meta.id}`, word.section || ''])
    }
  }

  const sectionMeta = []
  for (const section of sections) {
    const words = section.members
      .map((spelling) => buildWord(spelling))
      .filter(Boolean)
    const hubWord = words.find((word) => word.spelling === section.hub)
    const title = `${section.sectionId} · ${section.hub}`
    sectionMeta.push({
      id: section.sectionId,
      hub: section.hub,
      hubGloss: hubWord?.gloss || '',
      count: words.length,
      title,
    })
    await writeJson(path.join(outDir, `s/${section.sectionId}.json`), {
      id: section.sectionId,
      hub: section.hub,
      title,
      words,
    })
    for (const spelling of section.members) {
      if (derivedBySpelling.has(spelling)) continue
      const word = words.find((item) => item.spelling === spelling)
      if (!word) continue
      exampleCount += word.examples.length
      catalog.push([word.spelling, word.gloss, `s/${section.sectionId}`, section.sectionId])
    }
  }

  const placed = new Set(catalog.map((row) => row[0]))
  const orphans = lectureWords
    .map((word) => word.spelling)
    .filter((spelling) => !placed.has(spelling))
    .map((spelling) => buildWord(spelling))
    .filter(Boolean)
    .sort(compareWords)
  if (orphans.length) {
    await writeJson(path.join(outDir, 'w/orphans.json'), { words: orphans })
    for (const word of orphans) {
      exampleCount += word.examples.length
      catalog.push([word.spelling, word.gloss, 'w/orphans', ''])
    }
  }

  catalog.sort((a, b) => a[0].localeCompare(b[0]))
  const byLetter = new Map()
  for (const row of catalog) {
    const letter = /^[a-z]/.test(row[0]) ? row[0][0] : '_'
    const list = byLetter.get(letter) || []
    list.push(row)
    byLetter.set(letter, list)
  }
  for (const [letter, rows] of byLetter) {
    await writeJson(path.join(outDir, `catalog/${letter}.json`), rows)
  }

  const lectureOnly = catalog.filter((item) => item[2].startsWith('s/')).length
  const index = {
    stats: {
      morphemes: morphemeMeta.length,
      words: catalog.length,
      derivedWords: derivedWords.length,
      lectureWords: lectureWords.length,
      lectureOnly,
      lectureSections: sectionMeta.length,
      examples: exampleCount,
    },
    morphemes: morphemeMeta,
    sections: sectionMeta,
  }

  await writeJson(path.join(outDir, 'index.json'), index)

  const sizes = await dirSizes(outDir)
  const affix = { prefix: { filled: 0, blank: 0 }, suffix: { filled: 0, blank: 0 } }
  const affixIds = { prefix: new Map(), suffix: new Map() }
  const seenAffix = new Set()
  function noteAffix(word) {
    for (const part of word.parts || []) {
      if (part.type !== 'prefix' && part.type !== 'suffix') continue
      const key = `${word.spelling}|${part.id}`
      if (seenAffix.has(key)) continue
      seenAffix.add(key)
      const bucket = affix[part.type]
      const ids = affixIds[part.type]
      const prev = ids.get(part.id) || { filled: 0, blank: 0, form: part.form }
      if (part.meaning) {
        bucket.filled += 1
        prev.filled += 1
      } else {
        bucket.blank += 1
        prev.blank += 1
      }
      ids.set(part.id, prev)
    }
  }
  for (const meta of morphemeMeta) {
    for (const spelling of morphemeWords.get(meta.id) || []) {
      const word = buildWord(spelling)
      if (word) noteAffix(word)
    }
  }
  for (const section of sections) {
    for (const spelling of section.members) {
      if (derivedBySpelling.has(spelling)) continue
      const word = buildWord(spelling)
      if (word) noteAffix(word)
    }
  }
  for (const word of orphans) noteAffix(word)
  function blankIds(kind) {
    return [...affixIds[kind].entries()]
      .filter(([, info]) => info.filled === 0)
      .sort((a, b) => b[1].blank - a[1].blank)
      .slice(0, 12)
      .map(([id, info]) => `${id}×${info.blank}`)
  }
  console.log(JSON.stringify({ index: index.stats, files: sizes.files, bytes: sizes.bytes, affix, fallbackGain, blankPrefix: blankIds('prefix'), blankSuffix: blankIds('suffix') }, null, 2))
  if (index.stats.words < 8000 || index.stats.morphemes < 200) {
    throw new Error('seed build produced too little data')
  }
}

function compareWords(a, b) {
  const aHyphen = a.spelling.includes('-') ? 1 : 0
  const bHyphen = b.spelling.includes('-') ? 1 : 0
  if (aHyphen !== bHyphen) return aHyphen - bHyphen
  if (b.frequency !== a.frequency) return b.frequency - a.frequency
  return a.spelling.localeCompare(b.spelling)
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(data))
}

async function dirSizes(dir) {
  const { readdir, stat } = await import('node:fs/promises')
  let files = 0
  let bytes = 0
  const buckets = {}
  async function walk(current, bucket) {
    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const next = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(next, bucket || entry.name)
      } else {
        const info = await stat(next)
        files += 1
        bytes += info.size
        const key = bucket || 'root'
        buckets[key] = buckets[key] || { files: 0, bytes: 0 }
        buckets[key].files += 1
        buckets[key].bytes += info.size
      }
    }
  }
  await walk(dir, '')
  return { files, bytes, buckets }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
