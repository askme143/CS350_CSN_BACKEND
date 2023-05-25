import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';

export enum GetClubPostListEnum {
  Announcement = 'ANNOUNCEMENT',
  Ordinary = 'ORDINARY',
}

export class GetClubPostListDto {
  @IsUUID()
  clubId: string;

  @IsEnum(GetClubPostListEnum)
  postType: GetClubPostListEnum;

  @IsOptional()
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsUUID()
  lastPostId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastCreatedAt?: Date;
}
