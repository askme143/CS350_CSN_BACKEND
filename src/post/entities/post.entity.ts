import { ApiHideProperty } from '@nestjs/swagger';
import { Post } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class PostEntity implements Post {
  @IsUUID()
  id: string;

  @IsUUID()
  authorId: string;

  @IsUUID()
  clubId: string;

  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsUrl({ protocols: ['https'] }, { each: true })
  imageUrls: string[];

  @IsBoolean()
  @Type(() => Boolean)
  isAnnouncement: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  isPublic: boolean;

  @IsDate()
  createdAt: Date;

  @ApiHideProperty()
  @Exclude()
  isDeleted: boolean;
}
