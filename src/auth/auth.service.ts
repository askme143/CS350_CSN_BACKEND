import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from './auth.constants';
import { JwtPayloadEntity } from './entities/jwt-payload.entity';
import { JwtTokenEntity } from './entities/jwt-token.entity';
import { KakaoApiService } from './kakao-api/kakao-api.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly kakaoApiService: KakaoApiService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async issueToken(payload: JwtPayloadEntity): Promise<JwtTokenEntity> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtConstants.accessTokenSecret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: jwtConstants.refreshTokenSecret,
      expiresIn: '30 days',
    });

    return new JwtTokenEntity(accessToken, refreshToken);
  }

  async issueTokenKakao(authCode: string): Promise<JwtTokenEntity> {
    const { kakaoId, nickname } = await this.kakaoApiService.getKakaoUserInfo(
      authCode,
    );
    const { username, id } = await this.userService.findOrCreateUserByKakaoId(
      kakaoId,
      nickname,
    );

    const payload = { username, userId: id };

    return await this.issueToken(payload);
  }

  async reissueToken(refreshToken: string): Promise<JwtTokenEntity> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayloadEntity>(
        refreshToken,
        {
          secret: jwtConstants.refreshTokenSecret,
        },
      );

      const id = payload.userId;

      if (await this.userService.findUserById(id)) {
        return await this.issueToken(payload);
      } else {
        throw new BadRequestException();
      }
    } catch {
      throw new BadRequestException();
    }
  }
}
