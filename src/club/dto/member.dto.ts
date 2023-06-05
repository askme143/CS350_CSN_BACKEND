import { IsBoolean, IsString } from 'class-validator';
import { MemberEntity } from '../entities/member.entity';

export class MemberDto extends MemberEntity {
  @IsString()
  username: string;

  @IsBoolean()
  isAdmin: boolean;
}
