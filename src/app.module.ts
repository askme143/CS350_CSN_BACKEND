import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';

@Module({
  imports: [AuthModule, ClubModule],
})
export class AppModule {}
