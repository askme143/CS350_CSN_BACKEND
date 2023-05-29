import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';

export type FileType<T> = {
  [P in keyof T]: T[P] extends Express.Multer.File
    ? 'FILE'
    : T[P] extends Express.Multer.File | undefined
    ? 'FILE'
    : T[P] extends Express.Multer.File[]
    ? 'FILES'
    : T[P] extends Express.Multer.File[] | undefined
    ? 'FILES'
    : never;
}[keyof T];

export function UseFile<T>(
  _dto_constructor: new () => T,
  filePropertyKey: Extract<keyof T, string>,
  type: FileType<T>,
) {
  if (type === 'FILE') {
    return applyDecorators(
      UseInterceptors(FileInterceptor(filePropertyKey)),
      ApiConsumes('multipart/form-data'),
    );
  } else {
    return applyDecorators(
      UseInterceptors(FilesInterceptor(filePropertyKey)),
      ApiConsumes('multipart/form-data'),
    );
  }
}
