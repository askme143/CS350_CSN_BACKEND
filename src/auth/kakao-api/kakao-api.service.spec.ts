import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { Subject } from 'rxjs';
import { KakaoApiService } from './kakao-api.service';

describe('KakaoApiService', () => {
  let kakaoApiService: KakaoApiService;
  let httpService: HttpService;

  const accessToken = 'accessToken';
  const kakaoId = 'kakaoId';
  const kakaoNickname = 'kakaoNickname';
  const kakaoUserInfo = { kakaoId, nickname: kakaoNickname };

  const validTokenResponse = { data: { access_token: accessToken } };
  const invalidTokenResponse = {};
  const validUserInfoResponse = {
    data: {
      id: kakaoId,
      kakao_account: { profile: { nickname: kakaoNickname } },
    },
  };

  const requestMockHttpService = (request: any, responses: any[]) => {
    return new Promise(async (resolve, reject) => {
      const mockSubjects = responses.map((_) => new Subject());

      for (const mockSubject of mockSubjects) {
        jest
          .spyOn(httpService, 'request')
          .mockImplementationOnce((_: any) => mockSubject as any);
      }
      request().then(resolve).catch(reject);

      for (let i = 0; i < responses.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        mockSubjects[i].next(responses[i]);
      }
    });
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [KakaoApiService],
    })
      .useMocker((token) => {
        if (token === HttpService) {
          return mockDeep<HttpService>();
        }
      })
      .compile();

    kakaoApiService = moduleRef.get(KakaoApiService);
    httpService = moduleRef.get(HttpService);
  });

  describe('requestKakaoAccessToken', () => {
    it('should return kakao access token if authcode is valid', async () => {
      expect(
        await requestMockHttpService(
          () => kakaoApiService['requestKakaoAccessToken']('authCode'),
          [validTokenResponse],
        ),
      ).toEqual(accessToken);
    });
    it('should throw unauthorized exception if authcode is invalud', async () => {
      expect(() =>
        requestMockHttpService(
          () => kakaoApiService['requestKakaoAccessToken']('authCode'),
          [invalidTokenResponse],
        ),
      ).rejects.toThrow(new UnauthorizedException());
    });
  });

  describe('requestKakaoUserInfo', () => {
    it('should return kakao user info if access token is valid', async () => {
      expect(
        await requestMockHttpService(
          () => kakaoApiService['requestKakaoUserInfo'](accessToken),
          [validUserInfoResponse],
        ),
      ).toEqual(kakaoUserInfo);
    });

    it('should throw unauthorized exception if access token is invalud or not able to get info', async () => {
      expect(
        requestMockHttpService(
          () => kakaoApiService['requestKakaoUserInfo'](accessToken),
          [{}],
        ),
      ).rejects.toThrow(new UnauthorizedException());
      expect(
        requestMockHttpService(
          () => kakaoApiService['requestKakaoUserInfo'](accessToken),
          [{ kakaoId }],
        ),
      ).rejects.toThrow(new UnauthorizedException());
    });
  });

  describe('getKakaoUserInfo', () => {
    it('should return kakao user info', async () => {
      expect(
        await requestMockHttpService(
          () => kakaoApiService.getKakaoUserInfo('authCode'),
          [validTokenResponse, validUserInfoResponse],
        ),
      ).toEqual(kakaoUserInfo);
    });
  });
});
