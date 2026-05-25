import type { MorphemeKind, WordRootPosition } from '@prisma/client';
import {
  mergeDerivedMorphemeWordLinks,
  mergeSeedExamples,
  mergeSeedRoots,
  mergeSeedWords,
  mergeWordRootLinks,
} from './seed/catalog-seed-merge';

import type {
  SeedExample,
  SeedRoot,
  SeedRootRelation,
  SeedWord,
  SeedWordMorphemeLink,
  SeedWordRelation,
  SeedWordRootLink,
} from './seed-types';

export type {
  SeedExample,
  SeedPos,
  SeedRoot,
  SeedRootRelation,
  SeedSplitSegment,
  SeedWord,
  SeedWordMorphemeLink,
  SeedWordRelation,
  SeedWordRootLink,
} from './seed-types';

const MANUAL_SEED_ROOTS: SeedRoot[] = [
  {
    form: 'struct',
    origin: 'latin',
    meaning: '建造、堆积',
    extendedMeaning: '引申为结构、构造、建构等抽象概念。',
    story: '从物理上的「堆起砖石」到思维上的「建构论证」，struct 家族贯穿工程与语言。',
  },
  {
    form: 'dict',
    origin: 'latin',
    meaning: '说、讲',
    extendedMeaning: '字典记录「说法」，预测是「预先说出」。',
    story: 'dict 来自拉丁语 dicere（说），是四六级高频词根之一。',
  },
  {
    form: 'port',
    origin: 'latin',
    meaning: '携带、运输',
    extendedMeaning: '出口是把货物「带出去」，机会是「带到面前」。',
    story: 'port 家族与贸易、交通密切相关，CET 真题中常见。',
  },
];

const MANUAL_SEED_WORDS: SeedWord[] = [
  {
    spelling: 'reconstruction',
    phoneticUk: '/ˌriːkənˈstrʌkʃn/',
    phoneticUs: '/ˌriːkənˈstrʌkʃn/',
    frequency: 10,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'n', meaning: '重建；改造' }],
    splitPattern: [
      { form: 're-', type: 'prefix', meaning: '再', rootForm: null },
      { form: 'con-', type: 'prefix', meaning: '共同', rootForm: null },
      { form: 'struct', type: 'root', meaning: '建造', rootForm: 'struct' },
      { form: '-ion', type: 'suffix', meaning: '名词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'structure',
    phoneticUk: '/ˈstrʌktʃə(r)/',
    phoneticUs: '/ˈstrʌktʃər/',
    frequency: 20,
    level: ['cet4', 'cet6'],
    pos: [
      { pos: 'n', meaning: '结构；建筑物' },
      { pos: 'v', meaning: '组织；安排' },
    ],
    splitPattern: [
      { form: 'struct', type: 'root', meaning: '建造', rootForm: 'struct' },
      { form: '-ure', type: 'suffix', meaning: '名词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'construct',
    phoneticUk: '/kənˈstrʌkt/',
    phoneticUs: '/kənˈstrʌkt/',
    frequency: 30,
    level: ['cet4'],
    pos: [{ pos: 'v', meaning: '建造；构思' }],
    splitPattern: [
      { form: 'con-', type: 'prefix', meaning: '共同', rootForm: null },
      { form: 'struct', type: 'root', meaning: '建造', rootForm: 'struct' },
    ],
  },
  {
    spelling: 'destructive',
    phoneticUk: '/dɪˈstrʌktɪv/',
    phoneticUs: '/dɪˈstrʌktɪv/',
    frequency: 40,
    level: ['cet6'],
    pos: [{ pos: 'adj', meaning: '破坏性的' }],
    splitPattern: [
      { form: 'de-', type: 'prefix', meaning: '向下、破坏', rootForm: null },
      { form: 'struct', type: 'root', meaning: '建造', rootForm: 'struct' },
      { form: '-ive', type: 'suffix', meaning: '形容词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'dictionary',
    phoneticUk: '/ˈdɪkʃənri/',
    phoneticUs: '/ˈdɪkʃəneri/',
    frequency: 50,
    level: ['cet4'],
    pos: [{ pos: 'n', meaning: '字典' }],
    splitPattern: [
      { form: 'dict', type: 'root', meaning: '说', rootForm: 'dict' },
      { form: '-ion', type: 'suffix', meaning: '名词后缀', rootForm: null },
      { form: '-ary', type: 'suffix', meaning: '场所/物', rootForm: null },
    ],
  },
  {
    spelling: 'predict',
    phoneticUk: '/prɪˈdɪkt/',
    phoneticUs: '/prɪˈdɪkt/',
    frequency: 60,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'v', meaning: '预测' }],
    splitPattern: [
      { form: 'pre-', type: 'prefix', meaning: '预先', rootForm: null },
      { form: 'dict', type: 'root', meaning: '说', rootForm: 'dict' },
    ],
  },
  {
    spelling: 'contradict',
    phoneticUk: '/ˌkɒntrəˈdɪkt/',
    phoneticUs: '/ˌkɑːntrəˈdɪkt/',
    frequency: 70,
    level: ['cet6'],
    pos: [{ pos: 'v', meaning: '反驳；矛盾' }],
    splitPattern: [
      { form: 'contra-', type: 'prefix', meaning: '相反', rootForm: null },
      { form: 'dict', type: 'root', meaning: '说', rootForm: 'dict' },
    ],
  },
  {
    spelling: 'transport',
    phoneticUk: '/ˈtrænspɔːt/',
    phoneticUs: '/ˈtrænspɔːrt/',
    frequency: 80,
    level: ['cet4'],
    pos: [{ pos: 'v', meaning: '运输' }, { pos: 'n', meaning: '运输；交通工具' }],
    splitPattern: [
      { form: 'trans-', type: 'prefix', meaning: '跨越', rootForm: null },
      { form: 'port', type: 'root', meaning: '携带', rootForm: 'port' },
    ],
  },
  {
    spelling: 'export',
    phoneticUk: '/ˈekspɔːt/',
    phoneticUs: '/ˈekspɔːrt/',
    frequency: 90,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'v', meaning: '出口' }, { pos: 'n', meaning: '出口' }],
    splitPattern: [
      { form: 'ex-', type: 'prefix', meaning: '向外', rootForm: null },
      { form: 'port', type: 'root', meaning: '携带', rootForm: 'port' },
    ],
  },
  {
    spelling: 'opportunity',
    phoneticUk: '/ˌɒpəˈtjuːnəti/',
    phoneticUs: '/ˌɑːpərˈtuːnəti/',
    frequency: 100,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'n', meaning: '机会' }],
    splitPattern: [
      { form: 'op-', type: 'prefix', meaning: '朝向', rootForm: null },
      { form: 'port', type: 'root', meaning: '携带', rootForm: 'port' },
      { form: '-unity', type: 'suffix', meaning: '名词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'building',
    phoneticUk: '/ˈbɪldɪŋ/',
    phoneticUs: '/ˈbɪldɪŋ/',
    frequency: 110,
    level: ['cet4'],
    pos: [{ pos: 'n', meaning: '建筑物' }],
    splitPattern: [{ form: 'build', type: 'root', meaning: '建造', rootForm: null }],
  },
  {
    spelling: 'international',
    phoneticUk: '/ˌɪntəˈnæʃnəl/',
    phoneticUs: '/ˌɪntərˈnæʃnəl/',
    frequency: 120,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'adj', meaning: '国际的' }],
    splitPattern: [
      { form: 'inter-', type: 'prefix', meaning: '之间、互相', rootForm: null },
      { form: 'nation', type: 'root', meaning: '国家', rootForm: null },
      { form: '-al', type: 'suffix', meaning: '形容词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'rewrite',
    phoneticUk: '/ˌriːˈraɪt/',
    phoneticUs: '/ˌriːˈraɪt/',
    frequency: 130,
    level: ['cet4'],
    pos: [{ pos: 'v', meaning: '重写' }],
    splitPattern: [
      { form: 're-', type: 'prefix', meaning: '再', rootForm: null },
      { form: 'write', type: 'root', meaning: '写', rootForm: null },
    ],
  },
  {
    spelling: 'invisible',
    phoneticUk: '/ɪnˈvɪzəbl/',
    phoneticUs: '/ɪnˈvɪzəbl/',
    frequency: 140,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'adj', meaning: '看不见的' }],
    splitPattern: [
      { form: 'in-', type: 'prefix', meaning: '不、非', rootForm: null },
      { form: 'vis', type: 'root', meaning: '看', rootForm: null },
      { form: '-ible', type: 'suffix', meaning: '可……的', rootForm: null },
    ],
  },
  {
    spelling: 'disagree',
    phoneticUk: '/ˌdɪsəˈɡriː/',
    phoneticUs: '/ˌdɪsəˈɡriː/',
    frequency: 150,
    level: ['cet4'],
    pos: [{ pos: 'v', meaning: '不同意' }],
    splitPattern: [
      { form: 'dis-', type: 'prefix', meaning: '分开、否定', rootForm: null },
      { form: 'agree', type: 'root', meaning: '同意', rootForm: null },
    ],
  },
  {
    spelling: 'preparation',
    phoneticUk: '/ˌprepəˈreɪʃn/',
    phoneticUs: '/ˌprepəˈreɪʃn/',
    frequency: 160,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'n', meaning: '准备' }],
    splitPattern: [
      { form: 'pre-', type: 'prefix', meaning: '预先', rootForm: null },
      { form: 'par', type: 'root', meaning: '准备', rootForm: null },
      { form: '-tion', type: 'suffix', meaning: '名词后缀', rootForm: null },
    ],
  },
  {
    spelling: 'helpful',
    phoneticUk: '/ˈhelpfl/',
    phoneticUs: '/ˈhelpfl/',
    frequency: 170,
    level: ['cet4'],
    pos: [{ pos: 'adj', meaning: '有帮助的' }],
    splitPattern: [
      { form: 'help', type: 'root', meaning: '帮助', rootForm: null },
      { form: '-ful', type: 'suffix', meaning: '充满……的', rootForm: null },
    ],
  },
  {
    spelling: 'construction',
    phoneticUk: '/kənˈstrʌkʃn/',
    phoneticUs: '/kənˈstrʌkʃn/',
    frequency: 180,
    level: ['cet4', 'cet6'],
    pos: [{ pos: 'n', meaning: '建造；建设' }],
    splitPattern: [
      { form: 'con-', type: 'prefix', meaning: '共同', rootForm: null },
      { form: 'struct', type: 'root', meaning: '建造', rootForm: 'struct' },
      { form: '-ion', type: 'suffix', meaning: '名词后缀', rootForm: null },
    ],
  },
];

/** 从拆词模式生成词素-单词关联（与目录 form 一致） */
export function buildMorphemeLinksFromWords(words: SeedWord[]): SeedWordMorphemeLink[] {
  const links: SeedWordMorphemeLink[] = [];
  for (const word of words) {
    word.splitPattern.forEach((seg, order) => {
      if (seg.rootForm) {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'root',
          morphemeForm: seg.rootForm,
          position: 'root',
          order,
          displayForm: seg.form,
        });
      } else if (seg.type === 'prefix') {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'prefix',
          morphemeForm: seg.form,
          position: 'prefix',
          order,
          displayForm: seg.form,
        });
      } else if (seg.type === 'suffix') {
        links.push({
          spelling: word.spelling,
          morphemeKind: 'suffix',
          morphemeForm: seg.form,
          position: 'suffix',
          order,
          displayForm: seg.form,
        });
      }
    });
  }
  return links;
}

const MANUAL_SEED_WORD_ROOT_LINKS: SeedWordRootLink[] = [
  { spelling: 'reconstruction', rootForm: 'struct', position: 'root', order: 0, displayForm: 'struct' },
  { spelling: 'structure', rootForm: 'struct', position: 'root', order: 0, displayForm: 'struct' },
  { spelling: 'construct', rootForm: 'struct', position: 'root', order: 0, displayForm: 'struct' },
  { spelling: 'destructive', rootForm: 'struct', position: 'root', order: 0, displayForm: 'struct' },
  { spelling: 'dictionary', rootForm: 'dict', position: 'root', order: 0, displayForm: 'dict' },
  { spelling: 'predict', rootForm: 'dict', position: 'root', order: 0, displayForm: 'dict' },
  { spelling: 'contradict', rootForm: 'dict', position: 'root', order: 0, displayForm: 'dict' },
  { spelling: 'transport', rootForm: 'port', position: 'root', order: 0, displayForm: 'port' },
  { spelling: 'export', rootForm: 'port', position: 'root', order: 0, displayForm: 'port' },
  { spelling: 'opportunity', rootForm: 'port', position: 'root', order: 0, displayForm: 'port' },
  { spelling: 'construction', rootForm: 'struct', position: 'root', order: 0, displayForm: 'struct' },
];

export const SEED_ROOT_RELATIONS: SeedRootRelation[] = [
  { from: 'struct', to: 'port', kind: 'similar_form' },
  { from: 'dict', to: 'port', kind: 'cognate' },
];

export const SEED_WORD_RELATIONS: SeedWordRelation[] = [
  { from: 'structure', to: 'building', kind: 'synonym' },
  { from: 'construct', to: 'building', kind: 'synonym' },
  { from: 'destructive', to: 'construct', kind: 'antonym' },
  { from: 'predict', to: 'contradict', kind: 'antonym' },
  { from: 'export', to: 'transport', kind: 'synonym' },
  { from: 'rewrite', to: 'predict', kind: 'synonym' },
  { from: 'invisible', to: 'predict', kind: 'antonym' },
  { from: 'disagree', to: 'contradict', kind: 'synonym' },
];

const MANUAL_SEED_EXAMPLES: SeedExample[] = [
  {
    spelling: 'reconstruction',
    targetRootForm: 'struct',
    sentence: 'The reconstruction of the bridge took three years.',
    translation: '这座桥的重建花了三年时间。',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2023, section: 'reading' },
  },
  {
    spelling: 'structure',
    targetRootForm: 'struct',
    sentence: 'Social structure influences individual choices.',
    translation: '社会结构影响个人选择。',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2020 },
  },
  {
    spelling: 'dictionary',
    targetRootForm: 'dict',
    sentence: 'Keep a dictionary nearby when you read CET passages.',
    translation: '阅读四六级文章时，手边放一本字典。',
    level: 'basic',
    source: 'cet4',
  },
  {
    spelling: 'transport',
    targetRootForm: 'port',
    sentence: 'Public transport reduces urban congestion.',
    translation: '公共交通缓解城市拥堵。',
    level: 'exam',
    source: 'cet4',
    sourceMeta: { year: 2022 },
  },
  {
    spelling: 'predict',
    targetRootForm: 'dict',
    sentence: 'Scientists predict rainfall patterns with new models.',
    translation: '科学家用新模型预测降雨模式。',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2021 },
  },
  {
    spelling: 'construct',
    targetRootForm: 'struct',
    sentence: 'They plan to construct a new library downtown.',
    translation: '他们计划在市中心建一座新图书馆。',
    level: 'basic',
    source: 'cet4',
  },
  {
    spelling: 'international',
    sentence: 'International cooperation is essential for climate action.',
    translation: '国际合作对气候行动至关重要。',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2022 },
  },
  {
    spelling: 'rewrite',
    sentence: 'Please rewrite the introduction before submission.',
    translation: '提交前请重写引言部分。',
    level: 'basic',
    source: 'cet4',
  },
  {
    spelling: 'invisible',
    sentence: 'The gas is invisible to the naked eye.',
    translation: '这种气体肉眼看不见。',
    level: 'exam',
    source: 'cet4',
  },
  {
    spelling: 'disagree',
    sentence: 'The committee members disagree on the budget.',
    translation: '委员会成员在预算问题上意见不一。',
    level: 'basic',
    source: 'cet4',
  },
  {
    spelling: 'preparation',
    sentence: 'Exam preparation requires consistent daily practice.',
    translation: '备考需要每天坚持练习。',
    level: 'exam',
    source: 'cet6',
  },
  {
    spelling: 'helpful',
    sentence: 'Your feedback was very helpful during revision.',
    translation: '复习时你的反馈非常有帮助。',
    level: 'basic',
    source: 'cet4',
  },
  {
    spelling: 'construction',
    targetRootForm: 'struct',
    sentence: 'The construction of the stadium will finish next year.',
    translation: '体育场建设将于明年完工。',
    level: 'exam',
    source: 'cet6',
  },
];

export const SEED_ROOTS: SeedRoot[] = mergeSeedRoots(MANUAL_SEED_ROOTS);
export const SEED_WORDS: SeedWord[] = mergeSeedWords(MANUAL_SEED_WORDS);
export const SEED_WORD_MORPHEME_LINKS: SeedWordMorphemeLink[] = mergeDerivedMorphemeWordLinks(
  buildMorphemeLinksFromWords(SEED_WORDS),
);
export const SEED_WORD_ROOT_LINKS: SeedWordRootLink[] = mergeWordRootLinks(
  MANUAL_SEED_WORD_ROOT_LINKS,
  SEED_WORDS,
);
export const SEED_EXAMPLES: SeedExample[] = mergeSeedExamples(MANUAL_SEED_EXAMPLES);
