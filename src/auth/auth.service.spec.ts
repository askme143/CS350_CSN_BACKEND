import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { User } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from './auth.constants';
import { AuthService } from './auth.service';
import { JwtPayloadEntity } from './entities/jwt-payload.entity';
import { KakaoApiService } from './kakao-api/kakao-api.service';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let kakaoApiService: KakaoApiService;
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, JwtService],
    })
      .useMocker((token) => {
        switch (token) {
          case KakaoApiService:
            return mockDeep<KakaoApiService>();
          case UserService:
            return mockDeep<UserService>();
        }
      })
      .compile();
    authService = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
    kakaoApiService = moduleRef.get(KakaoApiService);
    userService = moduleRef.get(UserService);
  });

  const userId = 'userId';
  const username = 'username';

  const payload = {
    userId,
    username,
  };

  describe('issueToken', () => {
    it('should return jwt token entity', async () => {
      const tokenEntity = await authService.issueToken(payload);

      expect(tokenEntity.accessToken).toBeDefined();
      expect(tokenEntity.refreshToken).toBeDefined();
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.accessToken,
          {
            secret: jwtConstants.accessTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.refreshToken,
          {
            secret: jwtConstants.refreshTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
    });
  });

  describe('issueTokenKakao', () => {
    it('should return jwt token entity', async () => {
      jest
        .spyOn(kakaoApiService, 'getKakaoUserInfo')
        .mockResolvedValue({ kakaoId: 0, nickname: 'nickname' });

      const user = mockDeep<User>();
      user.id = userId;
      user.username = username;

      jest
        .spyOn(userService, 'findOrCreateUserByKakaoId')
        .mockResolvedValue(user);

      const tokenEntity = await authService.issueTokenKakao('authCode');

      expect(tokenEntity.accessToken).toBeDefined();
      expect(tokenEntity.refreshToken).toBeDefined();
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.accessToken,
          {
            secret: jwtConstants.accessTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.refreshToken,
          {
            secret: jwtConstants.refreshTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
    });
  });

  describe('reissueToken', () => {
    it('should return jwt token entity', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest
        .spyOn(userService, 'findUserById')
        .mockResolvedValue(mockDeep<User>());

      const tokenEntity = await authService.reissueToken('refresh token');
      expect(tokenEntity.accessToken).toBeDefined();
      expect(tokenEntity.refreshToken).toBeDefined();
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.accessToken,
          {
            secret: jwtConstants.accessTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
      expect(
        await jwtService.verifyAsync<JwtPayloadEntity>(
          tokenEntity.refreshToken,
          {
            secret: jwtConstants.refreshTokenSecret,
          },
        ),
      ).toEqual(expect.objectContaining(payload));
    });
    it('should throw bad request exception for invalid token', async () => {
      expect(
        async () => await authService.reissueToken('refresh token'),
      ).rejects.toThrow(new BadRequestException());
    });
    it('should throw bad request exception for bad token of non-user', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(userService, 'findUserById').mockResolvedValue(null);
      expect(
        async () => await authService.reissueToken('refresh token'),
      ).rejects.toThrow(new BadRequestException());
    });
  });
});
