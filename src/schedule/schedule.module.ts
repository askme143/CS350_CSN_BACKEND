import { Module } from '@nestjs/common';
import { PolicyModule } from 'src/policy/policy.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ClubModule } from 'src/club/club.module';

@Module({
  imports: [
    PolicyModule,
    StorageModule,
    PrismaModule,
    ClubModule,
    ScheduleModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
