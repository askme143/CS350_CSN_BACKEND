import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginKakaoDto } from './dto/login-kakao.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtTokenEntity } from './entities/jwt-token.entity';
import { Public } from './public.decorator';

@Public()
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

  @Get('kakao')
  async loginKakao(@Query() { code }: LoginKakaoDto): Promise<JwtTokenEntity> {
    try {
      return await this.authService.issueTokenKakao(code);
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
