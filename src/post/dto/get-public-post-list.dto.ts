import { IsInt, IsOptional } from 'class-validator';
import { PostPaginationDto } from './post-pagination.dto';

export class GetPublicPostListDto extends PostPaginationDto {
  @IsOptional()
  @IsInt()
  limit?: number;
}
