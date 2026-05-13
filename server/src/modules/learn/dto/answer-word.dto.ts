import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum AnswerResult {
  Unknown = 'unknown',
  Vague = 'vague',
  Known = 'known',
  Mastered = 'mastered',
}

export class AnswerWordDto {
  @IsInt()
  wordId!: number;

  @IsEnum(AnswerResult)
  result!: AnswerResult;

  @IsInt()
  @Min(0)
  responseMs!: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  exerciseType?: string;
}
