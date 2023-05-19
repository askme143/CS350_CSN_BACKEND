import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { PolicyModule } from 'src/policy/policy.module';

@Module({
  imports: [PolicyModule],
  controllers: [ClubController],
  providers: [ClubService, PrismaService, StorageService],
})
export class ClubModule {}
