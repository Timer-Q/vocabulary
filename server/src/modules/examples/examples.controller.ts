import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExampleLevel } from '@prisma/client';
import { CreateExampleDto } from './dto/create-example.dto';
import { ExamplesService } from './examples.service';
import { ExampleItem, ExampleSubmissionResult } from './examples.types';

@Controller('examples')
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  listByWord(
    @Query('wordId') wordId: string,
    @Query('levels') levels?: string,
  ): Promise<ExampleItem[]> {
    return this.examplesService.listByWord(Number(wordId), this.parseLevels(levels));
  }

  @Get('by-root')
  listByRoot(@Query('rootId') rootId: string, @Query('limit') limit?: string): Promise<ExampleItem[]> {
    return this.examplesService.listByRoot(Number(rootId), limit ? Number(limit) : 3);
  }

  @Post()
  submit(@Body() dto: CreateExampleDto): Promise<ExampleSubmissionResult> {
    return this.examplesService.submit(dto);
  }

  private parseLevels(levels?: string): ExampleLevel[] | undefined {
    if (!levels) {
      return undefined;
    }

    const values = new Set(Object.values(ExampleLevel));
    return levels
      .split(',')
      .map((level) => level.trim())
      .filter((level): level is ExampleLevel => values.has(level as ExampleLevel));
  }
}
