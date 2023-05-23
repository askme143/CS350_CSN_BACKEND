import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import * as httpMock from 'node-mocks-http';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtPayloadEntity } from './entities/jwt-payload.entity';
import { jwtConstants } from './auth.constants';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthGuard, JwtService, Reflector],
    }).compile();

    jwtConstants.accessTokenSecret = 'secret';

    authGuard = moduleRef.get(AuthGuard);
    jwtService = moduleRef.get(JwtService);
    reflector = moduleRef.get(Reflector);
  });

  describe('extractTokenFromHeader', () => {
    it('should return null if header does not include authorization token', () => {
      const request = httpMock.createRequest();
      request.headers.authorization = undefined;

      expect(authGuard['extractTokenFromHeader'](request)).toEqual(undefined);
    });
    it('should return null if token in header has invalid type', () => {
      const type = 'Basic';
      const token = 'token';

      const request = httpMock.createRequest();
      request.headers.authorization = `${type} ${token}`;

      expect(authGuard['extractTokenFromHeader'](request)).toEqual(undefined);
    });
    it('should return token if header contains token', () => {
      const type = 'Bearer';
      const token = 'token';

      const request = httpMock.createRequest();
      request.headers.authorization = `${type} ${token}`;

      expect(authGuard['extractTokenFromHeader'](request)).toEqual(token);
    });
  });

  describe('canActivate', () => {
    it('should return ture if the request has a valid token', async () => {
      const request = httpMock.createRequest();
      const response = httpMock.createResponse();
      const ctx = new ExecutionContextHost([request, response]);

      const payload: JwtPayloadEntity = {
        username: 'username',
        userId: 'userId',
      };
      const type = 'Bearer';
      const token = await jwtService.signAsync(payload, {
        secret: jwtConstants.accessTokenSecret,
        expiresIn: '15m',
      });

      request.headers.authorization = `${type} ${token}`;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(await authGuard.canActivate(ctx)).toEqual(true);
      expect(request['jwtPayload']).toEqual(expect.objectContaining(payload));
    });

    it('should return ture if context is public context', async () => {
      const request = httpMock.createRequest();
      const response = httpMock.createResponse();
      const ctx = new ExecutionContextHost([request, response]);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      expect(await authGuard.canActivate(ctx)).toEqual(true);
    });

    it('should throw unauthorizaed exception if there is no token', async () => {
      const request = httpMock.createRequest();
      const response = httpMock.createResponse();
      const ctx = new ExecutionContextHost([request, response]);

      const type = 'Basic';
      const token = '';

      request.headers.authorization = `${type} ${token}`;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(async () => await authGuard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException(),
      );
    });
    it('should throw unauthorizaed exception if token is invalid', async () => {
      const request = httpMock.createRequest();
      const response = httpMock.createResponse();
      const ctx = new ExecutionContextHost([request, response]);

      const type = 'Bearer';
      const token = 'token';

      request.headers.authorization = `${type} ${token}`;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(async () => await authGuard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException(),
      );
    });
  });
});
