import { IsUUID } from 'class-validator';
import { UserEntity } from '../entities/user.entity';

export class UserDto extends UserEntity {}

export class GetUserDto {
    @IsUUID()
    id: string;
}