import { Schedule } from '@prisma/client';
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

  @IsString()
  startDttm: Date;

  @IsString()
  endDttm: Date;

  @IsArray()
  @IsUrl({ protocols: ['https'] }, { each: true })
  imageUrls: string[];

  @IsBoolean()
  isPublic: boolean;

  @IsDate()
  createdAt: Date;

  @IsBoolean()
  isDeleted: boolean;
}
