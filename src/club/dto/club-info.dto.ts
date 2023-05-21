import { ArrayNotEmpty, IsArray, IsInt, IsUUID } from 'class-validator';
import { ClubEntity } from '../entities/club.entity';
import { Club as IClub } from '@prisma/client';

export class ClubInfoDto extends ClubEntity implements IClub {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  adminIds: string[];

  @IsInt()
  memberCount: number;
}
