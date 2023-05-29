import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { ScheduleEntity } from '../entities/schedule.entity';
import { IsDefined, IsEnum, IsInt } from 'class-validator';

export enum ScheduleType {
  JOINED = 'JOINED',
  SUBSCRIBED = 'SUBSCRIBED',
}

export class ScheduleDto extends OmitType(ScheduleEntity, ['isDeleted']) {}

export class ScheduleCreateDto extends PickType(ScheduleEntity, [
  'clubId',
  'authorId',
  'name',
  'description',
  'startDttm',
  'endDttm',
  'isPublic',
]) {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsDefined()
  images: Express.Multer.File[];
}

export class ScheduleUpdateDto extends PartialType(ScheduleCreateDto) {}
export class ScheduleGetDto {
  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsInt()
  month: number;
}
