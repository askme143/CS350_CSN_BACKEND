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
import { FileType } from './use-file.decorator';

type FileBodyOption<T> = {
  filePropertyKey: keyof T;
  type: FileType<T>;
};

const FileBodyInner = <T>() =>
  createParamDecorator((option: FileBodyOption<T>, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (option.type === 'FILE') {
      body[option.filePropertyKey] = request.file;
    } else if (option.type === 'FILES') {
      body[option.filePropertyKey] = request.files;
    }

    return body;
  });

export class ParseFileBodyPipe<T> extends ParseFilePipe {
  constructor(
    private readonly option: FileBodyOption<T>,
    options?: ParseFileOptions,
  ) {
    super(options);
  }

  async transform(value: any): Promise<any> {
    try {
      await super.transform(value[this.option.filePropertyKey]);
      return value;
    } catch (e) {
      throw e;
    }
  }
}

export const FileBody =
  <T>(_constructor: new () => T, option: FileBodyOption<T>) =>
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

    FileBodyInner<T>()(option)(target, key, index);
  };
