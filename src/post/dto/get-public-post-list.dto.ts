import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PostPaginationDto } from './post-pagination.dto';

export class GetPublicPostListDto extends PostPaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
