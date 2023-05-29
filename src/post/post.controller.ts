import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { UseFile } from 'src/custom-decorator/use-file.decorator';
import { GetPublicPostListDto } from './dto/get-public-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@Controller('posts')
@ApiTags('posts')
@ApiSecurity('Authentication')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPublicPosts(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() queryParams: GetPublicPostListDto,
  ): Promise<PostInfoDto[]> {
    return await this.postService.getPublicPostList(
      jwtPayload.userId,
      queryParams,
    );
  }

  @Get(':postId')
  async getPost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    const result = await this.postService.getPost(jwtPayload.userId, postId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  @Patch(':postId')
  @UseFile(UpdatePostDto, 'images', 'FILES')
  async updatePost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
    @FileBody(UpdatePostDto, { filePropertyKey: 'images', type: 'FILES' })
    body: UpdatePostDto,
  ) {
    return await this.postService.updatePost(jwtPayload.userId, postId, body);
  }

  @Delete(':postId')
  @HttpCode(204)
  async deletePost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    await this.postService.deletePost(postId);
  }
}
