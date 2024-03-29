import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { PolicyService } from 'src/policy/policy.service';
import {
  CommentToPost,
  DeleteComment,
  DeletePost,
  LikeOrUnlikePost,
  ReadCommentOfPost,
  ReadPost,
  ReadPublicPost,
  UpdateComment,
  UpdatePost,
} from 'src/policy/post-policy';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetPublicPostListDto } from './dto/get-public-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@Controller('posts')
@ApiTags('posts')
@ApiSecurity('Authentication')
export class PostController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly postService: PostService,
  ) {}

  /// Posts

  /**
   * Get public posts from subscribed or joined clubs
   */
  @Get()
  async getPublicPosts(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() queryParams: GetPublicPostListDto,
  ): Promise<PostInfoDto[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadPublicPost());

    return await this.postService.getPublicPostList(
      jwtPayload.userId,
      queryParams,
    );
  }

  /**
   * Get detail of the post.
   */
  @Get(':postId')
  async getPost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadPost(postId));

    const result = await this.postService.getPost(jwtPayload.userId, postId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  /**
   * Edit a post. Only author can make this request.
   */
  @Patch(':postId')
  async updatePost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body()
    body: UpdatePostDto,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new UpdatePost(postId));
    return await this.postService.updatePost(jwtPayload.userId, postId, body);
  }

  /**
   * Delete a post.
   * Only author and amin of the club can make this request.
   */
  @Delete(':postId')
  @HttpCode(204)
  async deletePost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new DeletePost(postId));
    await this.postService.deletePost(postId);
  }

  /// Comments

  /**
   * Make a comment on a post.
   */
  @ApiTags('comments')
  @Post(':postId/comments')
  async createComment(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: CreateCommentDto,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new CommentToPost(postId));

    return await this.postService.createComment(
      jwtPayload.userId,
      postId,
      body,
    );
  }

  /**
   * Get list of a comment
   */
  @ApiTags('comments')
  @Get(':postId/comments')
  async getComments(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadCommentOfPost(postId));

    return await this.postService.getComments(jwtPayload.userId, postId);
  }

  /**
   * Update a comment. Only the author of the comment can make this request.
   */
  @ApiTags('comments')
  @Patch(':postId/comments/:commentId')
  async updateComment(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) _postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() body: UpdateCommentDto,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new UpdateComment(commentId));

    return await this.postService.updateComment(
      jwtPayload.userId,
      commentId,
      body,
    );
  }

  /**
   * Delete a comment. Only the author of the comment or the admin of the club can make this request.
   */
  @ApiTags('comments')
  @Delete(':postId/comments/:commentId')
  @HttpCode(204)
  async deleteComment(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) _postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new DeleteComment(commentId));

    return await this.postService.deleteComment(commentId);
  }

  /// Likes

  /**
   * Like a post.
   */
  @ApiTags('likes')
  @Put(':postId/likes')
  @HttpCode(201)
  async like(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new LikeOrUnlikePost(postId));

    await this.postService.like(jwtPayload.userId, postId);
  }

  /**
   * Unlike a post.
   */
  @ApiTags('likes')
  @Delete(':postId/likes')
  @HttpCode(204)
  async unlike(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new LikeOrUnlikePost(postId));

    await this.postService.unlike(jwtPayload.userId, postId);
  }
}
