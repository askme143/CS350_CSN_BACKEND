import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import {
  GetClubPostListDto,
  GetClubPostListEnum,
} from './dto/get-club-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
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

  async getClubPostList(
    userId: string,
    { clubId, postType, limit, lastPostId, lastCreatedAt }: GetClubPostListDto,
  ): Promise<PostInfoDto[]> {
    const resultLimit = this.getResultLimit(limit);
    const isUserMember = await this.isUserMemberOfClub(clubId, userId);

    const isAnnouncementClause =
      postType === GetClubPostListEnum.Announcement
        ? Prisma.sql`AND p."isAnnouncement"`
        : Prisma.empty;
    const isPublicClause = isUserMember
      ? Prisma.empty
      : Prisma.sql`AND p."isPublic"`;
    const limitClause = Prisma.sql`LIMIT ${resultLimit}`;
    const paginationClause =
      lastPostId && lastCreatedAt
        ? Prisma.sql`
          AND (p."createdAt"::timestamp at time zone 'UTC', p.id) < 
          (${lastCreatedAt}::TIMESTAMP AT TIME ZONE 'KST', ${lastPostId}::uuid)`
        : Prisma.empty;

    const query = Prisma.sql`
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
        FROM service."Post" as p
        LEFT JOIN service."Like" as l
          ON l."postId" = p.id AND l."isDeleted" = false
        Left Join service."Comment" as c
          ON c."postId" = p.id AND c."isDeleted" = false
        WHERE "clubId"=${clubId}::uuid
          AND Not p."isDeleted" 
          ${isAnnouncementClause}
          ${isPublicClause}
          ${paginationClause}
      ) as p
      ORDER BY p."createdAt" DESC, p.id DESC
      ${limitClause}
    `;

    const postInfoList: PostInfoDto[] = await this.prismaService.$queryRaw(
      query,
    );

    return postInfoList.map((item: any) => plainToClass(PostInfoDto, item));
  }
}
