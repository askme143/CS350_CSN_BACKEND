import { PickType } from '@nestjs/swagger';
import { ClubEntity } from '../entities/club.entity';

export class CreateClubDto extends PickType(ClubEntity, [
  'clubname',
  'description',
  'canApply',
  'imageUrl',
] as const) {}
