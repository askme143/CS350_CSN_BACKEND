import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { PostEntity } from '../entities/post.entity';

export class CreatePostDto extends PickType(PostEntity, [
  'content',
  'isAnnouncement',
  'isPublic',
]) {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsDefined()
  images: Express.Multer.File;
}
