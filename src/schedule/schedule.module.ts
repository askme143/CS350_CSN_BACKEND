import { Module } from '@nestjs/common';
import { PolicyModule } from 'src/policy/policy.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ClubService } from 'src/club/club.service';

@Module({
  imports: [PolicyModule, StorageModule, PrismaModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, ClubService],
})
export class ScheduleModule {}
