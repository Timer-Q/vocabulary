import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { MediaUploadUrl } from './media.types';

@Injectable()
export class MediaService {
  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async createUploadUrl(dto: CreateUploadUrlDto): Promise<MediaUploadUrl> {
    const bucket = this.config.get<string>('SUPABASE_MEDIA_BUCKET', 'media');
    const normalizedExtension = dto.extension.replace(/^\./, '').toLowerCase();
    const path = `${dto.type}/${dto.ownerKey}/${randomUUID()}.${normalizedExtension}`;
    const result = await this.supabase.createSignedUploadUrl(bucket, path);

    return {
      bucket,
      path: result.path,
      token: result.token,
      signedUrl: result.signedUrl,
      publicUrl: result.publicUrl,
    };
  }
}
