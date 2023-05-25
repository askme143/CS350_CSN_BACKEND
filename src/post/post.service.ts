import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import {
  GetClubPostListDto,
  GetClubPostListEnum,
} from './dto/get-club-post-list.dto';
import { GetPublicPostListDto } from './dto/get-public-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { PostPaginationDto } from './dto/post-pagination.dto';

interface IGetPostQuery {
  fromTableClause: Prisma.Sql;
  clubIdClause: Prisma.Sql;
  isAnnouncementClause: Prisma.Sql;
  isPublicClause: Prisma.Sql;
  paginationClause: Prisma.Sql;
  userId: string;
  limit: number;
}

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
  }

  private getPostImagePath(image: Express.Multer.File): string {
    return 'post/' + Date.now() + '-' + image.originalname;
  }

  private async isUserMemberOfClub(
    clubId: string,
    userId: string,
  ): Promise<boolean> {
    const membership = await this.prismaService.member.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    return membership?.isDeleted === false;
  }

  private buildClubIdClause(clubId: string) {
    return Prisma.sql`AND "clubId"=${clubId}::uuid`;
  }
  private buildIsAnnouncementClause(postType: GetClubPostListEnum) {
    return postType === GetClubPostListEnum.Announcement
      ? Prisma.sql`AND p."isAnnouncement"`
      : Prisma.empty;
  }
  private buildIsPublicClause(isUserMember: boolean) {
    return isUserMember ? Prisma.empty : Prisma.sql`AND p."isPublic"`;
  }
  private buildPaginationClause({
    lastPostId,
    lastCreatedAt,
  }: PostPaginationDto) {
    return lastPostId && lastCreatedAt
      ? Prisma.sql`
          AND (p."createdAt"::timestamp at time zone 'UTC', p.id) < 
          (${lastCreatedAt}::TIMESTAMP AT TIME ZONE 'KST', ${lastPostId}::uuid)`
      : Prisma.empty;
  }
  private buildGetPostQuery({
    limit,
    userId,
    fromTableClause,
    clubIdClause,
    isPublicClause,
    isAnnouncementClause,
    paginationClause,
  }: IGetPostQuery): Prisma.Sql {
    return Prisma.sql`
      SELECT * FROM (
        SELECT Distinct on(p.id)
          p.*,
          count(l."authorId")
            OVER (Partition By p.id)
            As likeCount,
          count(c."authorId")
            Over (Partition By p.id)
            As commentCount,
          (count(l."authorId"=${userId}::uuid)
            Over (Partition By p.id)) > 0
            As liked
        FROM ${fromTableClause} as p
        LEFT JOIN service."Like" as l
          ON l."postId" = p.id AND l."isDeleted" = false
        Left Join service."Comment" as c
          ON c."postId" = p.id AND c."isDeleted" = false
        WHERE 
          Not p."isDeleted"
          ${clubIdClause}
          ${isAnnouncementClause}
          ${isPublicClause}
          ${paginationClause}
      ) as p
      ORDER BY p."createdAt" DESC, p.id DESC
      LIMIT ${limit}
    `;
  }

  async getClubPostList(
    userId: string,
    { clubId, postType, limit, lastPostId, lastCreatedAt }: GetClubPostListDto,
  ): Promise<PostInfoDto[]> {
    const isUserMember = await this.isUserMemberOfClub(clubId, userId);

    const query = this.buildGetPostQuery({
      limit: this.getResultLimit(limit),
      userId,
      fromTableClause: Prisma.sql`service."Post"`,
      clubIdClause: this.buildClubIdClause(clubId),
      isAnnouncementClause: this.buildIsAnnouncementClause(postType),
      isPublicClause: this.buildIsPublicClause(isUserMember),
      paginationClause: this.buildPaginationClause({
        lastPostId,
        lastCreatedAt,
      }),
    });

    const postInfoList: PostInfoDto[] = await this.prismaService.$queryRaw(
      query,
    );

    return postInfoList.map((item: any) => plainToClass(PostInfoDto, item));
  }

  async createClubPost(
    userId: string,
    { clubId, content, isAnnouncement, isPublic, images }: CreatePostDto,
  ) {
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
        authorId: userId,
        clubId: clubId,
        content,
        isAnnouncement,
        isPublic,
        imageUrls,
      },
    });

    const postInfo: PostInfoDto = {
      ...post,
      likeCount: 0,
      liked: false,
      commentCount: 0,
    };

    return plainToClass(PostInfoDto, postInfo);
  }

  async getPublicPostList(
    userId: string,
    { limit, lastCreatedAt, lastPostId }: GetPublicPostListDto,
  ): Promise<PostInfoDto[]> {
    const fromTableClause = Prisma.sql`
      (
        Select p.*
        From (
          Select "clubId"
          From service."Subscription" As s
          Where s."userId" = ${userId}::uuid
            And Not s."isDeleted"
          Union All
          Select "clubId"
          From service."Member" As m
          Where m."userId" = ${userId}::uuid
            And Not m."isDeleted"
        ) As c
        Left Join service."Post" As p
          On p."clubId" = c."clubId"
            And p."isPublic"
            And Not p."isDeleted"
      )
    `;
    const query = this.buildGetPostQuery({
      limit: this.getResultLimit(limit),
      userId,
      fromTableClause,
      clubIdClause: Prisma.empty,
      isAnnouncementClause: Prisma.empty,
      isPublicClause: Prisma.sql`AND p."isPublic"`,
      paginationClause: this.buildPaginationClause({
        lastPostId,
        lastCreatedAt,
      }),
    });

    const postInfoList: PostInfoDto[] = await this.prismaService.$queryRaw(
      query,
    );

    return postInfoList.map((item: any) => plainToClass(PostInfoDto, item));
  }
}
