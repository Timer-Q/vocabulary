import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto } from './dto/login.dto';

export interface LoginUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  platform: string;
  isNew: boolean;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: LoginUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const openId = await this.exchangeCodeForOpenId(dto.platform, dto.code);
    const session = await this.supabase.signInMiniProgramUser({
      platform: dto.platform,
      openId,
    });

    const existingUser = await this.prisma.user.findUnique({
      where: { platform_openId: { platform: dto.platform, openId } },
    });

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { supabaseUserId: session.supabaseUserId },
        })
      : await this.prisma.user.create({
          data: {
            platform: dto.platform,
            openId,
            supabaseUserId: session.supabaseUserId,
            status: 0,
          },
        });

    return {
      token: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: {
        id: user.id.toString(),
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        platform: user.platform,
        isNew: existingUser === null,
      },
    };
  }

  private async exchangeCodeForOpenId(platform: string, code: string): Promise<string> {
    // MVP 阶段先保留平台登录边界；接入微信/抖音 OpenAPI 后只替换这里。
    return `${platform}_${code}`;
  }
}
