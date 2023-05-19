import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
  HttpException,
  HttpServer,
  InternalServerErrorException,
  NotFoundException,
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

    console.error('exception handler (start)-----------');
    console.error(new Date().toString());
    console.error(exception);
    console.error('exception handler (end)-----------');

    if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2003') {
        return super.catch(new ForbiddenException(), host);
      }
    }

    return super.catch(new InternalServerErrorException(), host);
  }
}
