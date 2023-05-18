import { User as IUser } from '@prisma/client';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

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

  @IsBoolean()
  isDeleted: boolean;
}
