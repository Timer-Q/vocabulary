import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { getMvpBundleBySpelling, getMvpBundles, MVP_DEFAULT_PLAN } from '@/data/mvp';
import { api } from '@/services/api';
import { partitionBundlesFromToday } from '@/services/learn-hydrate';
import { calculateNextReview } from '@/services/sm2';
import type { AnswerGrade, LearningCardBundle, PlanSummary, SessionMode } from '@/types/learning';

interface WordProgressMemory {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  lapses: number;
}

export interface LearningStore {
  sessionMode: SessionMode;
  sessionFinished: boolean;
  lastSessionKind: 'new' | 'review' | null;
  queue: LearningCardBundle[];
  newBundles: LearningCardBundle[];
  reviewBundles: LearningCardBundle[];
  currentIndex: number;
  planSummary: PlanSummary | null;
  wordMastery: Record<string, number>;
  wordProgress: Record<string, WordProgressMemory>;
  favorites: Record<string, boolean>;
  flipped: boolean;
  cardOpenedAt: number;
  todayLearned: number;
  sessionAnswered: number;
  sessionQualitySum: number;
  hydrated: boolean;
  hydrateToday: () => Promise<void>;
  startSession: (mode: 'new' | 'review') => void;
  submitGrade: (grade: AnswerGrade) => Promise<void>;
  advance: () => void;
  toggleFavorite: (wordId: string) => void;
  setFlipped: (next: boolean) => void;
  loadWordDetail: (spelling: string) => Promise<LearningCardBundle | null>;
  dismissCompletion: () => void;
  replaySession: () => void;
}

const defaultProgress = (): WordProgressMemory => ({
  easeFactor: 2.5,
  intervalDays: 0,
  reviewCount: 0,
  lapses: 0,
});

function qualityForGrade(grade: AnswerGrade): number {
  if (grade === 'mastered' || grade === 'known') {
    return 1;
  }
  if (grade === 'vague') {
    return 0.5;
  }
  return 0;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  sessionMode: 'idle',
  sessionFinished: false,
  lastSessionKind: null,
  queue: [],
  newBundles: getMvpBundles(),
  reviewBundles: getMvpBundles(),
  currentIndex: 0,
  planSummary: MVP_DEFAULT_PLAN,
  wordMastery: {},
  wordProgress: {},
  favorites: {},
  flipped: false,
  cardOpenedAt: Date.now(),
  todayLearned: 0,
  sessionAnswered: 0,
  sessionQualitySum: 0,
  hydrated: false,

  hydrateToday: async () => {
    // 先用 MVP 展示，避免开发者工具/游客模式下长时间等待后端
    set({ hydrated: true });
    try {
      const remote = await api.learn.today(1);
      const { newBundles, reviewBundles } = partitionBundlesFromToday(remote);
      const plan: PlanSummary = remote.plan
        ? {
            dailyNew: remote.plan.dailyNew,
            dailyReview: remote.plan.dailyReview,
            examType: remote.plan.examType,
            examDate: remote.plan.examDate,
          }
        : MVP_DEFAULT_PLAN;
      set({ newBundles, reviewBundles, planSummary: plan });
    } catch {
      /* 保持初始 MVP 词表与计划 */
    }
  },

  startSession: (mode) => {
    const { newBundles, reviewBundles } = get();
    const queue = mode === 'new' ? newBundles : reviewBundles;
    set({
      sessionMode: mode,
      sessionFinished: false,
      lastSessionKind: mode,
      queue: queue.map((b) => ({
        word: { ...b.word, splitPattern: b.word.splitPattern.map((s) => ({ ...s })) },
        examples: b.examples.map((e) => ({ ...e })),
      })),
      currentIndex: 0,
      flipped: false,
      cardOpenedAt: Date.now(),
      sessionAnswered: 0,
      sessionQualitySum: 0,
    });
  },

  submitGrade: async (grade) => {
    const { queue, currentIndex, wordProgress, cardOpenedAt } = get();
    const bundle = queue[currentIndex];
    if (!bundle || get().sessionFinished) {
      return;
    }
    const wordId = bundle.word.id;
    const responseMs = Math.min(120_000, Math.max(0, Date.now() - cardOpenedAt));

    try {
      const res = await api.learn.answer(
        {
          wordId: Number(wordId),
          result: grade,
          responseMs,
          exerciseType: 'tap',
        },
        1,
      );
      set((state) => ({
        wordMastery: { ...state.wordMastery, [wordId]: res.mastery },
      }));
    } catch {
      const prev = wordProgress[wordId] ?? defaultProgress();
      const next = calculateNextReview(prev, grade, responseMs);
      set((state) => ({
        wordProgress: {
          ...state.wordProgress,
          [wordId]: {
            easeFactor: next.easeFactor,
            intervalDays: next.intervalDays,
            reviewCount: next.reviewCount,
            lapses: next.lapses,
          },
        },
        wordMastery: { ...state.wordMastery, [wordId]: next.mastery },
      }));
    }

    set((state) => ({
      sessionAnswered: state.sessionAnswered + 1,
      sessionQualitySum: state.sessionQualitySum + qualityForGrade(grade),
      todayLearned: state.todayLearned + 1,
    }));

    get().advance();
  },

  advance: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) {
      return;
    }
    if (currentIndex >= queue.length - 1) {
      set({ sessionFinished: true, sessionMode: 'idle', flipped: false });
      Taro.showToast({ title: '今日小步前进 ✓', icon: 'none', duration: 2000 });
      return;
    }
    set({
      currentIndex: currentIndex + 1,
      flipped: false,
      cardOpenedAt: Date.now(),
    });
  },

  toggleFavorite: (wordId) => {
    set((state) => ({
      favorites: { ...state.favorites, [wordId]: !state.favorites[wordId] },
    }));
  },

  setFlipped: (next) => {
    set({ flipped: next });
  },

  dismissCompletion: () => {
    set({
      sessionFinished: false,
      sessionMode: 'idle',
      currentIndex: 0,
      flipped: false,
      queue: [],
    });
  },

  replaySession: () => {
    const kind = get().lastSessionKind ?? 'new';
    get().startSession(kind);
  },

  loadWordDetail: async (spelling) => {
    const key = spelling.trim().toLowerCase();
    try {
      const word = await api.words.detail(key);
      const examples = await api.examples.list(word.id);
      return { word, examples };
    } catch {
      return getMvpBundleBySpelling(key) ?? null;
    }
  },
}));
