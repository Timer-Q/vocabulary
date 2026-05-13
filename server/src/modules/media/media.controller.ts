import { Body, Controller, Post } from '@nestjs/common';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { MediaService } from './media.service';
import { MediaUploadUrl } from './media.types';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  createUploadUrl(@Body() dto: CreateUploadUrlDto): Promise<MediaUploadUrl> {
    return this.mediaService.createUploadUrl(dto);
  }
}
