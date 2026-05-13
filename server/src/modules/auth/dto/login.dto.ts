import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum LoginPlatform {
  Weapp = 'weapp',
  Tt = 'tt',
}

export class LoginDto {
  @IsEnum(LoginPlatform)
  platform!: LoginPlatform;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  encryptedData?: string;

  @IsOptional()
  @IsString()
  iv?: string;
}
