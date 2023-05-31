import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { PolicyModule } from 'src/policy/policy.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostModule } from 'src/post/post.module';
import { ApplicationModule } from 'src/application/application.module';

@Module({
  imports: [PolicyModule, PrismaModule, PostModule, ApplicationModule],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
