import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { ClubModule } from 'src/club/club.module';
import { PolicyModule } from 'src/policy/policy.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScheduleModule } from 'src/schedule/schedule.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ApplicationModule, ClubModule, PolicyModule, ScheduleModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
