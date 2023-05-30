import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class GetClubListDto {
  @IsOptional()
  @IsNotEmpty()
  lastClubName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
