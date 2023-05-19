import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';
import { UserModule } from './user/user.module';
import { PolicyModule } from './policy/policy.module';

@Module({
  imports: [AuthModule, UserModule, ClubModule, PolicyModule],
})
export class AppModule {}
