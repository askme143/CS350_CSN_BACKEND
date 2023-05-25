import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

export class PostPaginationDto {
  @IsOptional()
  @IsUUID()
  lastPostId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastCreatedAt?: Date;
}
