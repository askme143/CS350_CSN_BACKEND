import { IsBoolean, IsInt } from 'class-validator';
import { ClubEntity } from '../entities/club.entity';
import { Club as IClub } from '@prisma/client';

export class ClubInfoDto extends ClubEntity implements IClub {
  @IsBoolean()
  isAdmin: boolean;

  @IsBoolean()
  subscribed: boolean;

  @IsInt()
  memberCount: number;
}
