import { IsString } from 'class-validator';
import { CommentEntity } from '../entities/comment.entity';

export class CommentInfoDto extends CommentEntity {
  @IsString()
  authorname: string;
}
