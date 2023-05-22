import {
  ArgumentsHost,
  ForbiddenException,
  HttpException,
  HttpServer,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { mockDeep } from 'jest-mock-extended';
import { AllExceptionFilter } from './all-exception.filter';

describe('AllExceptionFilter', () => {
  const exceptionFilter = new AllExceptionFilter(mockDeep<HttpServer>());
  const argumentsHost = mockDeep<ArgumentsHost>();

  jest.spyOn(console, 'log').mockImplementation(() => {});

  it('should return internal server error for unknown error', () => {
    const baseFilterSpy = jest.spyOn(BaseExceptionFilter.prototype, 'catch');
    exceptionFilter.catch(new Error(), argumentsHost);

    expect(baseFilterSpy).toBeCalledWith(
      new InternalServerErrorException(),
      argumentsHost,
    );
  });
  it('should return proper errpr for known errors', () => {
    const baseFilterSpy = jest.spyOn(BaseExceptionFilter.prototype, 'catch');
    exceptionFilter.catch(
      new PrismaClientKnownRequestError('', {
        code: 'P2003',
        clientVersion: '',
      }),
      argumentsHost,
    );

    expect(baseFilterSpy).toBeCalledWith(
      new ForbiddenException(),
      argumentsHost,
    );
  });
  it('should call super if it is http exception', () => {
    const baseFilterSpy = jest.spyOn(BaseExceptionFilter.prototype, 'catch');
    exceptionFilter.catch(new UnauthorizedException(), argumentsHost);

    expect(baseFilterSpy).toBeCalledWith(
      new UnauthorizedException(),
      argumentsHost,
    );
  });

  exceptionFilter;
});
