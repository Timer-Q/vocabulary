import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

export interface MiniProgramAuthIdentity {
  platform: 'weapp' | 'tt';
  openId: string;
}

export interface SupabaseSessionResult {
  supabaseUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SignedUploadResult {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

@Injectable()
export class SupabaseService {
  private readonly publicClient: SupabaseClient;
  private readonly adminClient: SupabaseClient;
  private readonly bridgeSecret: string;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.bridgeSecret = config.getOrThrow<string>('MINI_AUTH_BRIDGE_SECRET');
    this.publicClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    this.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async signInMiniProgramUser(identity: MiniProgramAuthIdentity): Promise<SupabaseSessionResult> {
    const email = this.buildBridgeEmail(identity);
    const password = this.buildBridgePassword(identity);

    await this.ensureAuthUser(email, password, identity);

    const { data, error } = await this.publicClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw error ?? new Error('supabase_session_missing');
    }

    return {
      supabaseUserId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async uploadObject(bucket: string, path: string, body: Buffer, contentType: string): Promise<string> {
    const { error } = await this.adminClient.storage.from(bucket).upload(path, body, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = this.adminClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async createSignedUploadUrl(bucket: string, path: string): Promise<SignedUploadResult> {
    const { data, error } = await this.adminClient.storage.from(bucket).createSignedUploadUrl(path);

    if (error) {
      throw error;
    }

    const publicUrl = this.adminClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return {
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl,
    };
  }

  private async ensureAuthUser(
    email: string,
    password: string,
    identity: MiniProgramAuthIdentity,
  ): Promise<User | null> {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: identity,
    });

    if (!error) {
      return data.user;
    }

    if (error.message.toLowerCase().includes('already')) {
      return null;
    }

    throw error;
  }

  private buildBridgeEmail(identity: MiniProgramAuthIdentity): string {
    const digest = createHmac('sha256', this.bridgeSecret)
      .update(`${identity.platform}:${identity.openId}`)
      .digest('hex')
      .slice(0, 32);

    return `${identity.platform}.${digest}@mini.local`;
  }

  private buildBridgePassword(identity: MiniProgramAuthIdentity): string {
    return createHmac('sha256', this.bridgeSecret)
      .update(`password:${identity.platform}:${identity.openId}`)
      .digest('base64url');
  }
}
