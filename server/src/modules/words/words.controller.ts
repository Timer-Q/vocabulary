import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SplitWordDto } from './dto/split-word.dto';
import { WordsService } from './words.service';
import { SplitWordResult, WordDetail } from './words.types';

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get('lookup')
  lookup(@Query('q') query: string): Promise<SplitWordResult> {
    return this.wordsService.split(query);
  }

  @Get(':spelling')
  getDetail(@Param('spelling') spelling: string): Promise<WordDetail> {
    return this.wordsService.getDetail(spelling);
  }

  @Post('split')
  split(@Body() dto: SplitWordDto): Promise<SplitWordResult> {
    return this.wordsService.split(dto.spelling);
  }
}
