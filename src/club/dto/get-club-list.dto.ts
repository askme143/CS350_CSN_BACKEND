import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export enum GetClubListEnum {
  Subscribed = 'SUBSCRIBED',
  Joined = 'JOINED',
  Managing = 'MANAGING',
  Starred = 'STARRED',
  Search = 'SEARCH',
}

export class GetClubListDto {
  @IsEnum(GetClubListEnum)
  type: GetClubListEnum;

  @IsOptional()
  @IsNotEmpty()
  lastClubName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
