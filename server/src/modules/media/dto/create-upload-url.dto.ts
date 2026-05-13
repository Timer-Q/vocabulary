import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9/_-]+$/)
  ownerKey!: string;

  @IsIn(['image', 'gif', 'video', 'audio'])
  type!: 'image' | 'gif' | 'video' | 'audio';

  @IsString()
  @MaxLength(16)
  extension!: string;
}
