import { IsString, Matches, MaxLength } from 'class-validator';

export class SplitWordDto {
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z-]+$/)
  spelling!: string;
}
