import { Module } from '@nestjs/common';
import { ApplicationModule } from 'src/application/application.module';
import { ClubModule } from 'src/club/club.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ApplicationModule, ClubModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
