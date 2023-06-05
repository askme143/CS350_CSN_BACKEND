import { ApiHideProperty } from '@nestjs/swagger';
import { Member as IMember } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsUUID } from 'class-validator';

export class MemberEntity implements IMember {
  @IsUUID()
  userId: string;

  @IsUUID()
  clubId: string;

  @IsBoolean()
  @Type(() => Boolean)
  isAdmin: boolean;

  @IsDateString()
  createdAt: Date;

  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}
