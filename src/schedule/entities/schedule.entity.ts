import { ApiHideProperty } from '@nestjs/swagger';
import { Schedule } from '@prisma/client';
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
    id: string

    @IsUUID()
    clubId: string

    @IsUUID()
    authorId: string

    @IsString()
    name: string

    @IsString()
    description: string

    // @IsDate()
    @IsString()
    startDttm: Date

    // @IsDate()
    @IsString()
    endDttm: Date

    @IsArray()
    @IsUrl({ protocols: ['https'] }, { each: true })
    imageUrls: string[]

    @IsBoolean()
    isPublic: boolean

    @IsDate()
    createdAt: Date

    @IsBoolean()
    isDeleted: boolean
}
