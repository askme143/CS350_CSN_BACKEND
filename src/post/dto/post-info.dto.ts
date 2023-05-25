import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt } from 'class-validator';
import { PostEntity } from '../entities/post.entity';

export class PostInfoDto extends OmitType(PostEntity, ['isDeleted']) {
  @IsBoolean()
  liked: boolean;

  @IsInt()
  @Type(() => Number)
  likeCount: number;

  @IsInt()
  @Type(() => Number)
  commentCount: number;
}
