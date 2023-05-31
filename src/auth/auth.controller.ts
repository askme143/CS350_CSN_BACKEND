import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginKakaoDto } from './dto/login-kakao.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtTokenEntity } from './entities/jwt-token.entity';
import { Public } from './public.decorator';

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('test')
  async getTestToken(): Promise<JwtTokenEntity> {
    return await this.authService.issueToken({
      username: 'test',
      userId: '8e320339-7498-4873-b9fc-9b6681e2020f',
    });
  }

  /**
   * Sign in or sign up a user. Used by a web application
   * Receives a kakao authCode from client.
   * This may be called by a redirection made by kakao server.
   */
  @Get('kakao/rest')
  async loginKakaoRest(
    @Query() { code }: LoginKakaoDto,
  ): Promise<JwtTokenEntity> {
    try {
      return await this.authService.issueTokenKakaoWithAuthCode(code);
    } catch {
      throw new UnauthorizedException();
    }
  }

  /**
   * Sign in or sign up a user. Used by a native application
   * Receives a kakao authToken from client
   */
  @Get('kakao/native')
  async loginKakaoNative(
    @Query() { code }: LoginKakaoDto,
  ): Promise<JwtTokenEntity> {
    try {
      return await this.authService.issueTokenWithKakaoAuthToken(code);
    } catch {
      throw new UnauthorizedException();
    }
  }

  @Post('refresh-token')
  async refreshToken(
    @Body() { refreshToken }: RefreshTokenDto,
  ): Promise<JwtTokenEntity> {
    try {
      return await this.authService.reissueToken(refreshToken);
    } catch {
      throw new BadRequestException();
    }
  }
}
