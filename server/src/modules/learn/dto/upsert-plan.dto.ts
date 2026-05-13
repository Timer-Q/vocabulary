import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertPlanDto {
  @IsString()
  examType!: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsInt()
  @Min(1)
  dailyNew!: number;

  @IsInt()
  @Min(1)
  dailyReview!: number;
}
