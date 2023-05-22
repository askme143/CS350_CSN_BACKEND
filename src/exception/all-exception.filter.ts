import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  HttpException,
  HttpServer,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  constructor(applicationRef?: HttpServer) {
    super(applicationRef);
  }

  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof HttpException) return super.catch(exception, host);

    console.log('exception handler (start)-----------');
    console.log(new Date().toString());
    console.log(exception);
    console.log('exception handler (end)-----------');

    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2003') {
        return super.catch(new ForbiddenException(), host);
      }
    }

    return super.catch(new InternalServerErrorException(), host);
  }
}
