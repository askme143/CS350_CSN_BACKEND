import { ApiHideProperty } from '@nestjs/swagger';
import { User as IUser } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UserEntity implements IUser {
  @IsUUID()
  id: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsOptional()
  starredClubId: string | null;

  @IsDate()
  createdAt: Date;

  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}
