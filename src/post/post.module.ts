import { Module } from '@nestjs/common';
import { PolicyModule } from 'src/policy/policy.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';
import { PostQueryBuilder } from './post-query-builder';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [StorageModule, PrismaModule, PolicyModule],
  controllers: [PostController],
  providers: [PostService, PostQueryBuilder],
  exports: [PostService],
})
export class PostModule {}
