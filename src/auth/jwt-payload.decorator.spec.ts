import { Get } from '@nestjs/common';
import { JwtPayloadEntity } from './entities/jwt-payload.entity';
import { JwtPayload } from './jwt-payload.decorator';
import * as httpMock from 'node-mocks-http';
import { mockDeep } from 'jest-mock-extended';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('JwtPayload decorator', () => {
  class TestController {
    @Get()
    test(@JwtPayload() _jwtPayload: JwtPayloadEntity) {
      //
    }
  }

  const testController = new TestController();

  const jwtPayload = mockDeep<JwtPayloadEntity>();
  const request = httpMock.createRequest();
  request['jwtPayload'] = jwtPayload;
  const response = httpMock.createResponse();
  const ctx = new ExecutionContextHost(
    [request, response],
    TestController,
    testController.test,
  );

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  );
  const factory = metadata[Object.keys(metadata)[0]].factory;

  it('should return jwt payload', () => {
    expect(factory(null, ctx)).toBeDefined();
    expect(factory(null, ctx)).toEqual(jwtPayload);
  });
});
