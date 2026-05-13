import { ExampleSource } from '@prisma/client';
import { IsEnum, IsInt, IsString, MaxLength } from 'class-validator';

export class CreateExampleDto {
  @IsInt()
  wordId!: number;

  @IsString()
  @MaxLength(1000)
  sentence!: string;

  @IsString()
  @MaxLength(1000)
  translation!: string;

  @IsEnum(ExampleSource)
  source!: ExampleSource;
}
