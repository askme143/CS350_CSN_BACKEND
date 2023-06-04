import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsString } from 'class-validator';
import { PostEntity } from '../entities/post.entity';

export class PostInfoDto extends OmitType(PostEntity, ['isDeleted']) {
  @IsBoolean()
  isAuthor: boolean;

  @IsString()
  authorname: string;

  @IsBoolean()
  liked: boolean;

  @IsInt()
  @Type(() => Number)
  likeCount: number;

  @IsInt()
  @Type(() => Number)
  commentCount: number;
}
