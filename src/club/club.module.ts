import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { PolicyModule } from 'src/policy/policy.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostModule } from 'src/post/post.module';

@Module({
  imports: [PolicyModule, StorageModule, PrismaModule, PostModule],
  controllers: [ClubController],
  providers: [ClubService],
})
export class ClubModule {}
