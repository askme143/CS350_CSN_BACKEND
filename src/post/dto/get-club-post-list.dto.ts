import { IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { PostPaginationDto } from './post-pagination.dto';

export enum GetClubPostListEnum {
  Announcement = 'ANNOUNCEMENT',
  Ordinary = 'ORDINARY',
}

export class GetClubPostListDto extends PostPaginationDto {
  @IsUUID()
  clubId: string;

  @IsEnum(GetClubPostListEnum)
  postType: GetClubPostListEnum;

  @IsOptional()
  @IsInt()
  limit?: number;
}
