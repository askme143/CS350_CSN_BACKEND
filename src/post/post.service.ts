import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { GetClubPostListDto } from './dto/get-club-post-list.dto';
import { GetPublicPostListDto } from './dto/get-public-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentEntity } from './entities/comment.entity';
import { PostQueryBuilder } from './post-query-builder';

@Injectable()
export class PostService {
  constructor(
    private readonly queryBuilder: PostQueryBuilder,
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getClubPostList(
    userId: string,
    clubId: string,
    args: GetClubPostListDto,
  ): Promise<PostInfoDto[]> {
    const isMember = await this.isUserMemberOfClub(userId, clubId);
    const query = this.queryBuilder.buildReadPostOfClubQuery(userId, {
      ...args,
      clubId,
      isMember,
      limit: this.getResultLimit(args.limit),
    });

    const postInfoList: PostInfoDto[] = await this.prismaService.$queryRaw(
      query,
    );

    return plainToInstance(PostInfoDto, postInfoList);
  }

  async getPublicPostList(
    userId: string,
    args: GetPublicPostListDto,
  ): Promise<PostInfoDto[]> {
    const query = this.queryBuilder.buildReadPublicPostQuery(userId, {
      ...args,
      limit: this.getResultLimit(args.limit),
    });

    const postInfoList: PostInfoDto[] = await this.prismaService.$queryRaw(
      query,
    );

    return plainToInstance(PostInfoDto, postInfoList);
  }

  async getPost(userId: string, postId: string): Promise<PostInfoDto | null> {
    const query = this.queryBuilder.buildReadOnePostQuery(userId, {
      postId,
    });

    const result = (await this.prismaService.$queryRaw(query)) as PostInfoDto[];

    return result.length ? plainToInstance(PostInfoDto, result[0]) : null;
  }

  async createClubPost(userId: string, clubId: string, args: CreatePostDto) {
    const { images, ...postArgs } = args;
    const imageUrls = await Promise.all(
      images.map((image) =>
        this.storageService.upload(
          this.getPostImagePath(image),
          image.buffer,
          [{}],
          image.mimetype,
        ),
      ),
    );

    const post = await this.prismaService.post.create({
      data: {
        ...postArgs,
        clubId,
        authorId: userId,
        imageUrls,
      },
    });
    const postInfo: PostInfoDto = {
      ...post,
      likeCount: 0,
      liked: false,
      commentCount: 0,
    };
    return plainToInstance(PostInfoDto, postInfo);
  }

  async updatePost(userId: string, postId: string, args: UpdatePostDto) {
    const { images, ...postArgs } = args;
    const imageUrls = images
      ? await Promise.all(
          images.map((image) =>
            this.storageService.upload(
              this.getPostImagePath(image),
              image.buffer,
              [{}],
              image.mimetype,
            ),
          ),
        )
      : undefined;

    await this.prismaService.post.update({
      where: { id: postId },
      data: {
        imageUrls,
        ...postArgs,
      },
    });

    return await this.getPost(userId, postId);
  }

  async deletePost(postId: string): Promise<void> {
    const isDeletedUpdate = {
      updateMany: {
        where: {
          postId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
        },
      },
    };

    await this.prismaService.post.update({
      where: {
        id: postId,
      },
      data: {
        isDeleted: true,
        comments: isDeletedUpdate,
        likes: isDeletedUpdate,
      },
    });
  }

  // Comments

  async createComment(
    authorId: string,
    postId: string,
    { content }: CreateCommentDto,
  ): Promise<CommentEntity> {
    const result = await this.prismaService.comment.create({
      data: {
        authorId,
        postId,
        content,
      },
    });

    return plainToInstance(CommentEntity, result);
  }

  async getComments(postId: string): Promise<CommentEntity[]> {
    const result = await this.prismaService.comment.findMany({
      where: {
        postId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return plainToInstance(CommentEntity, result);
  }

  async updateComment(
    commentId: string,
    args: UpdateCommentDto,
  ): Promise<CommentEntity> {
    return await this.prismaService.comment.update({
      where: { commentId },
      data: { ...args },
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.prismaService.comment.update({
      where: {
        commentId,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async like(authorId: string, postId: string): Promise<void> {
    await this.prismaService.like.upsert({
      create: {
        authorId,
        postId,
      },
      update: {
        isDeleted: true,
      },
      where: {
        authorId_postId: {
          authorId,
          postId,
        },
      },
    });
  }

  async unlike(authorId: string, postId: string): Promise<void> {
    await this.prismaService.like.update({
      where: {
        authorId_postId: {
          authorId,
          postId,
        },
      },
      data: {
        isDeleted: true,
      },
    });
  }

  // private functions

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
  }

  private getPostImagePath(image: Express.Multer.File): string {
    return 'post/' + Date.now() + '-' + image.originalname;
  }

  private async isUserMemberOfClub(
    userId: string,
    clubId: string,
  ): Promise<boolean> {
    const membership = await this.prismaService.member.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    return membership?.isDeleted === false;
  }
}
