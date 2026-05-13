import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnswerWordDto } from './dto/answer-word.dto';
import { UpsertPlanDto } from './dto/upsert-plan.dto';
import { LearnService } from './learn.service';
import { AnswerResultPayload, TodayLearningPayload } from './learn.types';

@Controller('learn')
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('today')
  getToday(@Query('userId') userId = '1'): Promise<TodayLearningPayload> {
    return this.learnService.getToday(Number(userId));
  }

  @Post('answer')
  answer(
    @Body() dto: AnswerWordDto,
    @Query('userId') userId = '1',
  ): Promise<AnswerResultPayload> {
    return this.learnService.answer(Number(userId), dto);
  }

  @Post('plan')
  async upsertPlan(@Body() dto: UpsertPlanDto, @Query('userId') userId = '1'): Promise<{ ok: true }> {
    await this.learnService.upsertPlan(Number(userId), dto);
    return { ok: true };
  }
}
