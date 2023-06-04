import { IsBoolean, IsString } from 'class-validator';
import { CommentEntity } from '../entities/comment.entity';

export class CommentInfoDto extends CommentEntity {
  @IsBoolean()
  isAuthor: boolean;

  @IsString()
  authorname: string;
}
