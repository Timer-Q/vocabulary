import { Module } from '@nestjs/common';
import { ExamplesModule } from '../examples/examples.module';
import { MindmapModule } from '../mindmap/mindmap.module';
import { RootsController } from './roots.controller';
import { RootsService } from './roots.service';

@Module({
  imports: [ExamplesModule, MindmapModule],
  controllers: [RootsController],
  providers: [RootsService],
  exports: [RootsService],
})
export class RootsModule {}
