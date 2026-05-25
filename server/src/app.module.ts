import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AdsModule } from './modules/ads/ads.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExamplesModule } from './modules/examples/examples.module';
import { LearnModule } from './modules/learn/learn.module';
import { MediaModule } from './modules/media/media.module';
import { PrismaModule } from './common/prisma.module';
import { ReviewModule } from './modules/review/review.module';
import { StatsModule } from './modules/stats/stats.module';
import { MindmapModule } from './modules/mindmap/mindmap.module';
import { RootsModule } from './modules/roots/roots.module';
import { WordsModule } from './modules/words/words.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    WordsModule,
    RootsModule,
    MindmapModule,
    ExamplesModule,
    LearnModule,
    ReviewModule,
    MediaModule,
    AiModule,
    AdsModule,
    StatsModule,
  ],
})
export class AppModule {}
