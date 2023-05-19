import { ApiHideProperty } from '@nestjs/swagger';
import { Club as IClub } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class ClubEntity implements IClub {
  @IsUUID()
  id: string;

  @IsUrl()
  imageUrl: string;

  @IsNotEmpty()
  clubname: string;

  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @Type(() => Boolean)
  canApply: boolean;

  @IsDateString()
  createdAt: Date;

  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}
