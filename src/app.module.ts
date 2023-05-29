import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [AuthModule, ClubModule, ScheduleModule],
})
export class AppModule {}
