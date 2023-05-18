import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export function ExposeApi(name: string) {
  return applyDecorators(Expose({ name }), ApiProperty({ name }));
}
