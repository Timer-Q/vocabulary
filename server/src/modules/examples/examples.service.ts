import { Injectable } from '@nestjs/common';
import { ContentStatus, ExampleLevel } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { CreateExampleDto } from './dto/create-example.dto';
import { ExampleItem, ExampleSubmissionResult } from './examples.types';

@Injectable()
export class ExamplesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByWord(wordId: number, levels?: ExampleLevel[]): Promise<ExampleItem[]> {
    const examples = await this.prisma.example.findMany({
      where: {
        wordId: BigInt(wordId),
        status: ContentStatus.published,
        level: levels?.length ? { in: levels } : undefined,
      },
      orderBy: [{ level: 'asc' }, { likes: 'desc' }],
    });

    return examples.map((example) => ({
      id: example.id.toString(),
      wordId: example.wordId.toString(),
      level: example.level,
      source: example.source,
      sourceMeta: example.sourceMeta,
      sentence: example.sentence,
      translation: example.translation,
      audioUkUrl: example.audioUkUrl,
      audioUsUrl: example.audioUsUrl,
      audioSlowUrl: example.audioSlowUrl,
      highlightSpans: example.highlightSpans,
      grammarTags: example.grammarTags,
      likes: example.likes,
    }));
  }

  async listByWordIds(wordIds: bigint[], limit = 5): Promise<ExampleItem[]> {
    if (wordIds.length === 0) {
      return [];
    }
    const examples = await this.prisma.example.findMany({
      where: {
        wordId: { in: wordIds },
        status: ContentStatus.published,
      },
      orderBy: [{ likes: 'desc' }, { level: 'asc' }],
      take: limit,
    });

    return examples.map((example) => ({
      id: example.id.toString(),
      wordId: example.wordId.toString(),
      level: example.level,
      source: example.source,
      sourceMeta: example.sourceMeta,
      sentence: example.sentence,
      translation: example.translation,
      audioUkUrl: example.audioUkUrl,
      audioUsUrl: example.audioUsUrl,
      audioSlowUrl: example.audioSlowUrl,
      highlightSpans: example.highlightSpans,
      grammarTags: example.grammarTags,
      likes: example.likes,
    }));
  }

  async listByRoot(rootId: number, limit = 3): Promise<ExampleItem[]> {
    const examples = await this.prisma.example.findMany({
      where: {
        targetRootId: BigInt(rootId),
        status: ContentStatus.published,
      },
      orderBy: { likes: 'desc' },
      take: limit,
    });

    return examples.map((example) => ({
      id: example.id.toString(),
      wordId: example.wordId.toString(),
      level: example.level,
      source: example.source,
      sourceMeta: example.sourceMeta,
      sentence: example.sentence,
      translation: example.translation,
      audioUkUrl: example.audioUkUrl,
      audioUsUrl: example.audioUsUrl,
      audioSlowUrl: example.audioSlowUrl,
      highlightSpans: example.highlightSpans,
      grammarTags: example.grammarTags,
      likes: example.likes,
    }));
  }

  async submit(dto: CreateExampleDto): Promise<ExampleSubmissionResult> {
    const example = await this.prisma.example.create({
      data: {
        wordId: BigInt(dto.wordId),
        sentence: dto.sentence,
        translation: dto.translation,
        level: ExampleLevel.basic,
        source: dto.source,
        status: ContentStatus.pending,
        createdBy: 'user_pending',
      },
    });

    return {
      submissionId: example.id.toString(),
      status: 'pending',
    };
  }
}
