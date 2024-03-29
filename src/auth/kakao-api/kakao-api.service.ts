import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { firstValueFrom, map } from 'rxjs';
import { KakaoUserInfoEntity } from './entities/kakao-user-info.entity';

@Injectable()
export class KakaoApiService {
  constructor(private httpService: HttpService) {}

  async requestKakaoUserInfo(
    accessToken: string,
  ): Promise<KakaoUserInfoEntity> {
    const options = {
      method: 'GET',
      url: 'https://kapi.kakao.com/v2/user/me',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const responseObservable = this.httpService
      .request(options)
      .pipe(
        map((response) => [
          response.data?.['id'],
          response.data?.['kakao_account']?.['profile']?.['nickname'],
        ]),
      );

    const [kakaoId, nickname] = await firstValueFrom(responseObservable);

    if (kakaoId === undefined || nickname === undefined)
      throw new UnauthorizedException();

    return plainToClass(KakaoUserInfoEntity, { kakaoId, nickname });
  }

  async requestKakaoAccessToken(authCode: string): Promise<string> {
    const options = {
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        grant_type: 'authorization_code',
        client_id: '88c8f10f0ffa1e6a133b6b7f83dc3b78',
        redirect_uri: 'http://localhost:3000/auth/kakao',
        code: authCode,
      },
    };

    const accessToken = await firstValueFrom(
      this.httpService
        .request(options)
        .pipe(map((response) => response.data?.['access_token'])),
    );
    if (accessToken === undefined) throw new UnauthorizedException();

    return accessToken;
  }
}
