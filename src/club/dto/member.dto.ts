import { Member as IMember } from '@prisma/client';
import { MemberEntity } from '../entities/member.entity';

export class MemberDto extends MemberEntity implements IMember {}
