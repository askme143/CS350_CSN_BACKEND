import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { KakaoApiService } from './kakao-api/kakao-api.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    HttpModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoApiService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
