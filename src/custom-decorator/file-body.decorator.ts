import {
  assignMetadata,
  createParamDecorator,
  ExecutionContext,
  FileTypeValidator,
  ParseFileOptions,
  ParseFilePipe,
  ValidationPipe,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';

export class ParseFileBodyPipe extends ParseFilePipe {
  constructor(private readonly key: string, options?: ParseFileOptions) {
    super(options);
  }

  async transform(value: any): Promise<any> {
    try {
      await super.transform(value[this.key]);
      return value;
    } catch (e) {
      throw e;
    }
  }
}

const FileBodyInner = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;
    body[key] = request.file;

    return body;
  },
);

export const FileBody =
  (data: string) => (target: any, key: string | symbol, index: number) => {
    const pipes = [
      new ValidationPipe({
        validateCustomDecorators: true,
        transform: true,
        whitelist: true,
      }),
      new ParseFileBodyPipe(data, {
        fileIsRequired: false,
        validators: [
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    ];
    const args =
      Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};

    Reflect.defineMetadata(
      ROUTE_ARGS_METADATA,
      assignMetadata(args, RouteParamtypes.BODY, index, undefined, ...pipes),
      target.constructor,
      key,
    );

    FileBodyInner(data)(target, key, index);
  };
