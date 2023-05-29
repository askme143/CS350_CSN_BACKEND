import { ApiHideProperty } from '@nestjs/swagger';
import { Comment } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsUUID } from 'class-validator';
export class CommentEntity implements Comment {
  @IsUUID()
  commentId: string;

  @IsUUID()
  postId: string;

  @IsUUID()
  authorId: string;

  @IsNotEmpty()
  content: string;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsBoolean()
  @Exclude()
  @ApiHideProperty()
  isDeleted: boolean;
}
