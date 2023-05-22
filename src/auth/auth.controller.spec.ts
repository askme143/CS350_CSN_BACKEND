import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenEntity } from './entities/jwt-token.entity';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthController],
    })
      .useMocker((token) => {
        switch (token) {
          case AuthService:
            return mockDeep<AuthService>();
        }
      })
      .compile();

    authController = moduleRef.get(AuthController);
    authService = moduleRef.get(AuthService);
  });

  const jwtTokenEntity = mockDeep<JwtTokenEntity>();

  describe('getTestToken', () => {
    it('should return jwt token entity', async () => {
      jest.spyOn(authService, 'issueToken').mockResolvedValue(jwtTokenEntity);
      expect(await authController.getTestToken()).toEqual(jwtTokenEntity);
    });
  });
  describe('loginKakao', () => {
    it('should return jwt token entity', async () => {
      jest
        .spyOn(authService, 'issueTokenKakao')
        .mockResolvedValue(jwtTokenEntity);
      expect(await authController.loginKakao({ code: 'code' })).toEqual(
        jwtTokenEntity,
      );
    });
    it('should throw unauthorized exception for invalid code', async () => {
      jest.spyOn(authService, 'issueTokenKakao').mockRejectedValue(new Error());
      expect(
        async () => await authController.loginKakao({ code: 'code' }),
      ).rejects.toThrow(new UnauthorizedException());
    });
  });
  describe('refreshToken', () => {
    it('should return reissue token', async () => {
      jest.spyOn(authService, 'reissueToken').mockResolvedValue(jwtTokenEntity);
      expect(
        await authController.refreshToken({ refreshToken: 'refreshToken' }),
      ).toEqual(jwtTokenEntity);
    });
    it('should throw bad request exception for invalid token', async () => {
      jest.spyOn(authService, 'reissueToken').mockRejectedValue(new Error());
      expect(
        async () =>
          await authController.refreshToken({ refreshToken: 'refreshToken' }),
      ).rejects.toThrow(new BadRequestException());
    });
  });
});
