import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AnswerWordDto } from './dto/answer-word.dto';
import { UpsertPlanDto } from './dto/upsert-plan.dto';
import { AnswerResultPayload, TodayLearningPayload } from './learn.types';
import { mapWordToTodayBrief } from './learn-word.mapper';
import { calculateNextReview } from './sm2';

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: number): Promise<TodayLearningPayload> {
    const plan = await this.prisma.userPlan.findUnique({
      where: { userId: BigInt(userId) },
    });

    const reviewWords = await this.prisma.userWordProgress.findMany({
      where: {
        userId: BigInt(userId),
        dueAt: { lte: new Date() },
      },
      include: { word: true },
      take: plan?.dailyReview ?? 20,
      orderBy: { dueAt: 'asc' },
    });

    const newWords = await this.prisma.word.findMany({
      take: plan?.dailyNew ?? 10,
      orderBy: { frequency: 'asc' },
    });

    return {
      newWords: newWords.map(mapWordToTodayBrief),
      reviewWords: reviewWords.map((item) => mapWordToTodayBrief(item.word)),
      plan: plan
        ? {
            dailyNew: plan.dailyNew,
            dailyReview: plan.dailyReview,
            examType: plan.examType,
            examDate: plan.examDate?.toISOString() ?? null,
          }
        : null,
    };
  }

  async answer(userId: number, dto: AnswerWordDto): Promise<AnswerResultPayload> {
    const current = await this.prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId: BigInt(userId),
          wordId: BigInt(dto.wordId),
        },
      },
    });

    const next = calculateNextReview(
      {
        easeFactor: current ? Number(current.easeFactor) : 2.5,
        intervalDays: current?.intervalDays ?? 0,
        reviewCount: current?.reviewCount ?? 0,
        lapses: current?.lapses ?? 0,
      },
      dto.result,
      dto.responseMs,
    );

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + next.intervalDays);

    await this.prisma.userWordProgress.upsert({
      where: {
        userId_wordId: {
          userId: BigInt(userId),
          wordId: BigInt(dto.wordId),
        },
      },
      update: {
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        dueAt,
        reviewCount: next.reviewCount,
        lapses: next.lapses,
        mastery: next.mastery,
        lastReviewedAt: new Date(),
        lastResponseMs: dto.responseMs,
      },
      create: {
        userId: BigInt(userId),
        wordId: BigInt(dto.wordId),
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        dueAt,
        reviewCount: next.reviewCount,
        lapses: next.lapses,
        mastery: next.mastery,
        lastReviewedAt: new Date(),
        lastResponseMs: dto.responseMs,
      },
    });

    return {
      nextDueAt: dueAt.toISOString(),
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      mastery: next.mastery,
    };
  }

  async upsertPlan(userId: number, dto: UpsertPlanDto): Promise<void> {
    await this.prisma.userPlan.upsert({
      where: { userId: BigInt(userId) },
      update: {
        examType: dto.examType,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        dailyNew: dto.dailyNew,
        dailyReview: dto.dailyReview,
      },
      create: {
        userId: BigInt(userId),
        examType: dto.examType,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        dailyNew: dto.dailyNew,
        dailyReview: dto.dailyReview,
      },
    });
  }
}
