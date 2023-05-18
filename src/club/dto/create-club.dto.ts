import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { ClubEntity } from '../entities/club.entity';

export class CreateClubDto extends PickType(ClubEntity, [
  'clubname',
  'description',
  'canApply',
] as const) {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsDefined()
  image: Express.Multer.File;
}
