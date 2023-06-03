import { OmitType, PartialType, PickType } from '@nestjs/swagger';
import { MyScheduleEntity, ScheduleEntity } from '../entities/schedule.entity';
import { IsEnum, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ScheduleType {
  JOINED = 'JOINED',
  SUBSCRIBED = 'SUBSCRIBED',
}

export class ScheduleDto extends OmitType(ScheduleEntity, ['isDeleted']) {
  @IsString()
  authorname: string;
}

export class ScheduleCreateDto extends PickType(ScheduleEntity, [
  'clubId',
  'authorId',
  'name',
  'description',
  'startDttm',
  'endDttm',
  'isPublic',
  'imageUrls',
]) {}

export class ScheduleUpdateDto extends PartialType(ScheduleCreateDto) {}
export class ScheduleGetDto {
  @IsEnum(ScheduleType)
  type: ScheduleType;

  @IsInt()
  @Type(() => Number)
  month: number;
}

export class MyScheduleDto extends OmitType(MyScheduleEntity, ['isDeleted']) {}
export class MyScheduleCreateDto extends PickType(MyScheduleEntity, [
  'scheduleId',
]) {}
