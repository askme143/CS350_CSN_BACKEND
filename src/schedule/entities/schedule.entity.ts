import { ApiHideProperty } from '@nestjs/swagger';
import { MySchedule, Schedule } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class ScheduleEntity implements Schedule {
  @IsUUID()
  id: string;

  @IsUUID()
  clubId: string;

  @IsUUID()
  authorId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsDate()
  @Type(() => Date)
  startDttm: Date;

  @IsDate()
  @Type(() => Date)
  endDttm: Date;

  @IsArray()
  @IsUrl({ protocols: ['https'] }, { each: true })
  imageUrls: string[];

  @IsBoolean()
  @Type(() => Boolean)
  isPublic: boolean;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsBoolean()
  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}

export class MyScheduleEntity implements MySchedule {
  @IsUUID()
  userId: string;

  @IsUUID()
  scheduleId: string;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsBoolean()
  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}
