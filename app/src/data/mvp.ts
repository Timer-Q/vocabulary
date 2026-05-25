import type { ExampleItem, WordDetail } from '@/services/api/types';
import type {
  LearningCardBundle,
  LearningReport,
  PlanSummary,
  RootDetailData,
} from '@/types/learning';

/** 默认计划展示（远端无 plan 时使用） */
export const MVP_DEFAULT_PLAN: PlanSummary = {
  dailyNew: 10,
  dailyReview: 20,
  examType: 'cet6',
  examDate: null,
};

const WORD_DEFAULTS: Pick<
  WordDetail,
  | 'phoneticUk'
  | 'phoneticUs'
  | 'audioUkUrl'
  | 'audioUsUrl'
  | 'audioSlowUrl'
  | 'frequency'
  | 'difficulty'
  | 'level'
  | 'pos'
  | 'scenes'
  | 'media'
> = {
  phoneticUk: null,
  phoneticUs: null,
  audioUkUrl: null,
  audioUsUrl: null,
  audioSlowUrl: null,
  frequency: null,
  difficulty: null,
  level: [],
  pos: [],
  scenes: [],
  media: [],
};

const w = (partial: Partial<WordDetail> & Pick<WordDetail, 'id' | 'spelling' | 'splitPattern'>): WordDetail => ({
  ...WORD_DEFAULTS,
  ...partial,
});

const examplesReconstruction: ExampleItem[] = [
  {
    id: 'e-r-1',
    wordId: '1',
    level: 'basic',
    source: 'cet4',
    sourceMeta: { note: '词组级' },
    sentence: 'The city needs reconstruction after the flood.',
    translation: '洪水过后这座城市需要重建。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 19, end: 33, type: 'target' }],
    grammarTags: null,
    likes: 12,
  },
  {
    id: 'e-r-2',
    wordId: '1',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2023, section: 'reading' },
    sentence: 'The reconstruction of the bridge took three years.',
    translation: '这座桥的重建花了三年时间。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 4, end: 17, type: 'target' }],
    grammarTags: ['名词短语'],
    likes: 128,
  },
  {
    id: 'e-r-3',
    wordId: '1',
    level: 'classic',
    source: 'ted',
    sourceMeta: { title: 'Urban renewal talk' },
    sentence: 'Reconstruction begins with honest dialogue.',
    translation: '重建始于坦诚的对话。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 0, end: 14, type: 'target' }],
    grammarTags: null,
    likes: 56,
  },
  {
    id: 'e-r-4',
    wordId: '1',
    level: 'advanced',
    source: 'other',
    sourceMeta: { context: '学术' },
    sentence: 'Post-war reconstruction policies reshaped the economy.',
    translation: '战后重建政策重塑了经济格局。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 10, end: 24, type: 'target' }],
    grammarTags: null,
    likes: 9,
  },
  {
    id: 'e-r-5',
    wordId: '1',
    level: 'root_transfer',
    source: 'other',
    sourceMeta: { root: 'struct' },
    sentence: 'They will construct a new dam upstream.',
    translation: '他们将在上游建造一座新水坝。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 10, end: 19, type: 'target' }],
    grammarTags: null,
    likes: 22,
  },
];

const examplesStructure: ExampleItem[] = [
  {
    id: 'e-s-1',
    wordId: '2',
    level: 'basic',
    source: 'cet4',
    sourceMeta: null,
    sentence: 'The tree has a solid structure.',
    translation: '这棵树结构很结实。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 22, end: 31, type: 'target' }],
    grammarTags: null,
    likes: 8,
  },
  {
    id: 'e-s-2',
    wordId: '2',
    level: 'exam',
    source: 'cet6',
    sourceMeta: { year: 2022, section: 'translation' },
    sentence: 'The structure of the essay is clear and logical.',
    translation: '这篇文章结构清晰且合乎逻辑。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 4, end: 13, type: 'target' }],
    grammarTags: null,
    likes: 201,
  },
  {
    id: 'e-s-3',
    wordId: '2',
    level: 'classic',
    source: 'movie',
    sourceMeta: { title: '科幻影片', scene: '基地全景' },
    sentence: 'Beneath the ice, an alien structure pulsed with light.',
    translation: '冰层之下，一座外星结构体闪烁着光。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 28, end: 37, type: 'target' }],
    grammarTags: null,
    likes: 44,
  },
  {
    id: 'e-s-4',
    wordId: '2',
    level: 'advanced',
    source: 'other',
    sourceMeta: null,
    sentence: 'Crystal structure analysis confirmed the alloy phase.',
    translation: '晶体结构分析证实了合金相。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 0, end: 16, type: 'target' }],
    grammarTags: null,
    likes: 7,
  },
  {
    id: 'e-s-5',
    wordId: '2',
    level: 'root_transfer',
    source: 'other',
    sourceMeta: { root: 'struct' },
    sentence: 'Engineers must construct supports before paving.',
    translation: '工程师必须在铺路前建好支撑。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 16, end: 25, type: 'target' }],
    grammarTags: null,
    likes: 15,
  },
];

const examplesConstruct: ExampleItem[] = [
  {
    id: 'e-c-1',
    wordId: '3',
    level: 'basic',
    source: 'cet4',
    sourceMeta: null,
    sentence: 'They plan to construct a new library.',
    translation: '他们计划建一座新图书馆。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 14, end: 23, type: 'target' }],
    grammarTags: null,
    likes: 30,
  },
  {
    id: 'e-c-2',
    wordId: '3',
    level: 'exam',
    source: 'cet4',
    sourceMeta: { year: 2021, section: 'cloze' },
    sentence: 'Workers construct roads before winter arrives.',
    translation: '工人们赶在冬天到来前修路。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 7, end: 16, type: 'target' }],
    grammarTags: null,
    likes: 88,
  },
  {
    id: 'e-c-3',
    wordId: '3',
    level: 'classic',
    source: 'book',
    sourceMeta: { title: '工程随笔' },
    sentence: 'To construct meaning, we connect fragments of memory.',
    translation: '为了建构意义，我们把记忆碎片连接起来。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 3, end: 12, type: 'target' }],
    grammarTags: null,
    likes: 61,
  },
  {
    id: 'e-c-4',
    wordId: '3',
    level: 'advanced',
    source: 'other',
    sourceMeta: null,
    sentence: 'The model constructs a causal graph from observational data.',
    translation: '该模型从观测数据建构出因果图。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 10, end: 19, type: 'target' }],
    grammarTags: null,
    likes: 5,
  },
  {
    id: 'e-c-5',
    wordId: '3',
    level: 'root_transfer',
    source: 'other',
    sourceMeta: { root: 'struct' },
    sentence: 'The structure of DNA was revolutionary.',
    translation: 'DNA 的结构是革命性的。',
    audioUkUrl: null,
    audioUsUrl: null,
    audioSlowUrl: null,
    highlightSpans: [{ start: 4, end: 13, type: 'target' }],
    grammarTags: null,
    likes: 40,
  },
];

const wordReconstruction: WordDetail = w({
  id: '1',
  spelling: 'reconstruction',
  phoneticUk: '/ˌriːkənˈstrʌkʃn/',
  phoneticUs: '/ˌriːkənˈstrʌkʃn/',
  frequency: 4200,
  difficulty: 3,
  level: ['cet4', 'cet6'],
  scenes: [
    { title: '灾后重建', description: '城市基础设施修复与恢复' },
    { title: '历史修复', description: '古建筑与文化遗产的复原工程' },
  ],
  pos: [{ pos: 'n', meaning: '重建；改造' }],
  splitPattern: [
    { form: 're-', type: 'prefix', meaning: '再', rootId: null },
    { form: 'con-', type: 'prefix', meaning: '共同', rootId: null },
    { form: 'struct', type: 'root', meaning: '建造', rootId: '13' },
    { form: '-ion', type: 'suffix', meaning: '名词后缀', rootId: null },
  ],
  media: [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=60',
    },
  ],
});

const wordStructure: WordDetail = w({
  id: '2',
  spelling: 'structure',
  phoneticUk: '/ˈstrʌktʃə(r)/',
  phoneticUs: '/ˈstrʌktʃər/',
  frequency: 2800,
  difficulty: 2,
  level: ['cet4', 'cet6'],
  scenes: [{ title: '建筑结构', description: '描述物体或系统的组成方式' }],
  pos: [{ pos: 'n', meaning: '结构；建筑物' }, { pos: 'v', meaning: '组织；安排' }],
  splitPattern: [
    { form: 'struct', type: 'root', meaning: '建造', rootId: '13' },
    { form: '-ure', type: 'suffix', meaning: '名词后缀', rootId: null },
  ],
  media: [],
});

const wordConstruct: WordDetail = w({
  id: '3',
  spelling: 'construct',
  phoneticUk: '/kənˈstrʌkt/',
  phoneticUs: '/kənˈstrʌkt/',
  frequency: 5100,
  difficulty: 2,
  level: ['cet4'],
  scenes: [{ title: '工程施工', description: '建造、搭建实体或抽象概念' }],
  pos: [{ pos: 'v', meaning: '建造；构思' }],
  splitPattern: [
    { form: 'con-', type: 'prefix', meaning: '共同', rootId: null },
    { form: 'struct', type: 'root', meaning: '建造', rootId: '13' },
  ],
  media: [],
});

const bundles: LearningCardBundle[] = [
  { word: wordReconstruction, examples: examplesReconstruction },
  { word: wordStructure, examples: examplesStructure },
  { word: wordConstruct, examples: examplesConstruct },
];

export function getMvpBundles(): LearningCardBundle[] {
  return bundles.map((b) => ({
    word: { ...b.word, splitPattern: b.word.splitPattern.map((s) => ({ ...s })) },
    examples: b.examples.map((e) => ({ ...e })),
  }));
}

export function getMvpBundleBySpelling(spelling: string): LearningCardBundle | undefined {
  const key = spelling.trim().toLowerCase();
  return getMvpBundles().find((b) => b.word.spelling.toLowerCase() === key);
}

/** 词根 id（MVP 静态）→ 词根形态，用于拆字段跳转 */
export const MVP_ROOT_ID_TO_FORM: Record<string, string> = {
  '13': 'struct',
};

const MVP_ROOT_DICT: RootDetailData = {
  id: '14',
  kind: 'root',
  level: 'core',
  form: 'dict',
  originKey: 'latin',
  originLabel: '拉丁语 dicere',
  meaning: '说、讲',
  extendedMeaning: '字典记录「说法」，预测是「预先说出」。',
  story: 'dict 是四六级高频词根，与言说、记录密切相关。',
  derivatives: [
    { spelling: 'dictionary', gloss: '字典' },
    { spelling: 'predict', gloss: '预测' },
    { spelling: 'contradict', gloss: '反驳' },
  ],
  examples: [],
};

const MVP_ROOT_PORT: RootDetailData = {
  id: '15',
  kind: 'root',
  level: 'core',
  form: 'port',
  originKey: 'latin',
  originLabel: '拉丁语 portare',
  meaning: '携带、运输',
  extendedMeaning: '出口是把货物「带出去」，机会是「带到面前」。',
  story: 'port 家族与贸易、交通密切相关。',
  derivatives: [
    { spelling: 'transport', gloss: '运输' },
    { spelling: 'export', gloss: '出口' },
    { spelling: 'opportunity', gloss: '机会' },
  ],
  examples: [],
};

const MVP_PREFIX_RE: RootDetailData = {
  id: 'mvp-prefix-re',
  kind: 'prefix',
  level: 'core',
  form: 're-',
  originKey: 'latin',
  originLabel: '拉丁前缀',
  meaning: '再、回',
  extendedMeaning: 'rewrite、return、rebuild 表示再次或返回。',
  derivatives: [
    { spelling: 'rewrite', gloss: '重写' },
    { spelling: 'reconstruction', gloss: '重建' },
    { spelling: 'predict', gloss: '预测' },
  ],
  examples: [],
};

const MVP_PREFIX_PRE: RootDetailData = {
  id: 'mvp-prefix-pre',
  kind: 'prefix',
  level: 'core',
  form: 'pre-',
  originKey: 'latin',
  originLabel: '拉丁前缀',
  meaning: '预先、在前',
  extendedMeaning: 'predict、preview、prepare 表示提前。',
  derivatives: [
    { spelling: 'predict', gloss: '预测' },
    { spelling: 'preparation', gloss: '准备' },
  ],
  examples: [],
};

const MVP_PREFIX_DIS: RootDetailData = {
  id: 'mvp-prefix-dis',
  kind: 'prefix',
  level: 'core',
  form: 'dis-',
  originKey: 'latin',
  originLabel: '拉丁前缀',
  meaning: '分开、否定',
  extendedMeaning: 'disagree、disconnect 表示分离或否定。',
  derivatives: [
    { spelling: 'disagree', gloss: '不同意' },
    { spelling: 'destructive', gloss: '破坏性的' },
  ],
  examples: [],
};

const MVP_SUFFIX_ION: RootDetailData = {
  id: 'mvp-suffix-ion',
  kind: 'suffix',
  level: 'core',
  form: '-ion',
  originKey: 'latin',
  originLabel: '拉丁后缀',
  meaning: '行为、结果',
  extendedMeaning: 'action、construction 表示动作或结果。',
  derivatives: [
    { spelling: 'reconstruction', gloss: '重建' },
    { spelling: 'construction', gloss: '建设' },
    { spelling: 'dictionary', gloss: '字典' },
  ],
  examples: [],
};

export const MVP_MORPHEME_LIBRARY: Record<string, RootDetailData> = {
  're-': MVP_PREFIX_RE,
  'pre-': MVP_PREFIX_PRE,
  'dis-': MVP_PREFIX_DIS,
  '-ion': MVP_SUFFIX_ION,
};

export const MVP_ROOT_LIBRARY: Record<string, RootDetailData> = {
  struct: {
    id: '13',
    kind: 'root',
    level: 'core',
    form: 'struct',
    originKey: 'latin',
    originLabel: '拉丁语 struere',
    meaning: '建造、堆积',
    extendedMeaning: '引申为结构、构造、建构等抽象概念。',
    story: '从物理上的「堆起砖石」到思维上的「建构论证」，struct 家族贯穿工程与语言。',
    derivatives: [
      { spelling: 'reconstruction', gloss: '重建' },
      { spelling: 'structure', gloss: '结构' },
      { spelling: 'construct', gloss: '建造' },
      { spelling: 'destructive', gloss: '破坏性的' },
    ],
    examples: [
      {
        id: 'root-ex-1',
        wordId: '0',
        level: 'classic',
        source: 'other',
        sourceMeta: null,
        sentence: 'We structure our day around deep work blocks.',
        translation: '我们以深度工作块来安排一天结构。',
        audioUkUrl: null,
        audioUsUrl: null,
        audioSlowUrl: null,
        highlightSpans: [{ start: 3, end: 11, type: 'target' }],
        grammarTags: null,
        likes: 0,
      },
      {
        id: 'root-ex-2',
        wordId: '0',
        level: 'exam',
        source: 'cet6',
        sourceMeta: { year: 2020 },
        sentence: 'Social structure influences individual choices.',
        translation: '社会结构影响个人选择。',
        audioUkUrl: null,
        audioUsUrl: null,
        audioSlowUrl: null,
        highlightSpans: [{ start: 7, end: 15, type: 'target' }],
        grammarTags: null,
        likes: 0,
      },
    ],
  },
  dict: MVP_ROOT_DICT,
  port: MVP_ROOT_PORT,
};

export const MVP_REPORT: LearningReport = {
  title: '学习报告',
  subtitle: '近 7 日 · 成长曲线',
  weekLabels: ['一', '二', '三', '四', '五', '六', '日'],
  dailyMinutes: [12, 18, 8, 22, 15, 20, 14],
  accuracyPct: 86,
  wordsLearned: 64,
  reviewDone: 132,
  streakDays: 5,
  rootCoverage: [
    { form: 'struct', percent: 72 },
    { form: 'dict', percent: 24 },
    { form: 'port', percent: 18 },
  ],
  achievements: [
    { title: '词根推理者', description: '连续 5 天完成拆词学习' },
    { title: '真题语境', description: '累计精读 40 条真题句' },
    { title: '节奏稳定', description: '本周日均 15 分钟' },
  ],
};
