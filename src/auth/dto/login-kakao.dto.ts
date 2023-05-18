import { IsNotEmpty } from 'class-validator';

export class LoginKakaoDto {
  @IsNotEmpty()
  code: string;
}
