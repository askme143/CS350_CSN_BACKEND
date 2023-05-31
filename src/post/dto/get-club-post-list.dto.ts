import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PostPaginationDto } from './post-pagination.dto';

export enum PostType {
  Announcement = 'ANNOUNCEMENT',
  Ordinary = 'ORDINARY',
}

export class GetClubPostListDto extends PostPaginationDto {
  @IsEnum(PostType)
  postType: PostType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
