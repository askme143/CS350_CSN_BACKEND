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

type FileBodyOption = {
  bodyKey: string;
  type: 'FILE' | 'FILES';
};

const FileBodyInner = createParamDecorator(
  (option: FileBodyOption, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (option.type === 'FILE') {
      body[option.bodyKey] = request.file;
    } else if (option.type === 'FILES') {
      body[option.bodyKey] = request.files;
    }

    return body;
  },
);

export class ParseFileBodyPipe extends ParseFilePipe {
  constructor(
    private readonly option: FileBodyOption,
    options?: ParseFileOptions,
  ) {
    super(options);
  }

  async transform(value: any): Promise<any> {
    try {
      await super.transform(value[this.option.bodyKey]);
      return value;
    } catch (e) {
      throw e;
    }
  }
}

export const FileBody =
  (option: FileBodyOption) =>
  (target: any, key: string | symbol, index: number) => {
    const pipes = [
      new ValidationPipe({
        validateCustomDecorators: true,
        transform: true,
        whitelist: true,
      }),
      new ParseFileBodyPipe(option, {
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

    FileBodyInner(option)(target, key, index);
  };
