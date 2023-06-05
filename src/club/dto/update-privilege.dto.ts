import { IsBoolean } from 'class-validator';

export class UpdatePrivilegeDto {
  @IsBoolean()
  adminPrivilege: boolean;
}
