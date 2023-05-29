import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PostType } from './dto/get-club-post-list.dto';
import { PostPaginationDto } from './dto/post-pagination.dto';

type ReadOnePostArg = {
  postId: string;
};

type ReadPostOfClubArg = PostPaginationDto & {
  isMember: boolean;
  clubId: string;
  postType: PostType;
  limit: number;
};

type ReadPublicPostArg = PostPaginationDto & {
  limit: number;
};

type ReadOnePostQueryTemplate = {
  fromTable: Prisma.Sql;
  postIdCondition: Prisma.Sql;
};

type ReadPostOfClubQueryTemplate = {
  fromTable: Prisma.Sql;
  clubIdCondition: Prisma.Sql;
  postTypeCondition: Prisma.Sql;
  isPublicCondition: Prisma.Sql;
  pageCondition: Prisma.Sql;
  limit: Prisma.Sql;
};

type ReadPublicPostQueryTemplate = {
  fromTable: Prisma.Sql;
  isPublicCondition: Prisma.Sql;
  pageCondition: Prisma.Sql;
  limit: Prisma.Sql;
};

type ReadPostQueryTemplate = ReadOnePostQueryTemplate &
  ReadPostOfClubQueryTemplate &
  ReadPublicPostQueryTemplate;

@Injectable()
export class PostQueryBuilder {
  private readonly BASE_TEMPLATE: ReadPostQueryTemplate = {
    fromTable: Prisma.empty,
    postIdCondition: Prisma.empty,
    clubIdCondition: Prisma.empty,
    postTypeCondition: Prisma.empty,
    isPublicCondition: Prisma.empty,
    pageCondition: Prisma.empty,
    limit: Prisma.empty,
  };
  buildReadOnePostQuery(userId: string, { postId }: ReadOnePostArg) {
    const template: ReadOnePostQueryTemplate = {
      fromTable: this.buildFromPostTable(),
      postIdCondition: this.buildPostIdCondition(postId),
    };
    return this.buildReadPostQuery(
      userId,
      Object.assign({}, this.BASE_TEMPLATE, template),
    );
  }
  buildReadPostOfClubQuery(
    userId: string,
    {
      clubId,
      isMember,
      postType,
      limit,
      lastPostId,
      lastCreatedAt,
    }: ReadPostOfClubArg,
  ) {
    const template: ReadPostOfClubQueryTemplate = {
      fromTable: this.buildFromPostTable(),
      isPublicCondition: isMember
        ? Prisma.empty
        : this.buildIsPublicCondition(),
      postTypeCondition: this.buildPostTypeCondition(postType),
      clubIdCondition: this.buildClubIdCondition(clubId),
      limit: this.buildLimitClause(limit),
      pageCondition:
        lastPostId && lastCreatedAt
          ? this.buildPageCondition(lastPostId, lastCreatedAt)
          : Prisma.empty,
    };
    return this.buildReadPostQuery(
      userId,
      Object.assign({}, this.BASE_TEMPLATE, template),
    );
  }
  buildReadPublicPostQuery(
    userId: string,
    { limit, lastPostId, lastCreatedAt }: ReadPublicPostArg,
  ) {
    const template: ReadPublicPostQueryTemplate = {
      fromTable: this.buildFromSubscribedOrJoinedTable(userId),
      isPublicCondition: this.buildIsPublicCondition(),
      pageCondition:
        lastPostId && lastCreatedAt
          ? this.buildPageCondition(lastPostId, lastCreatedAt)
          : Prisma.empty,
      limit: this.buildLimitClause(limit),
    };
    return this.buildReadPostQuery(
      userId,
      Object.assign({}, this.BASE_TEMPLATE, template),
    );
  }

  // Base Query Template
  private buildReadPostQuery(
    userId: string,
    template: ReadPostQueryTemplate,
  ): Prisma.Sql {
    return Prisma.sql`
      SELECT * FROM (
        SELECT Distinct on(p.id)
          p.*,
          count(l."authorId")
            OVER (Partition By p.id)
            As "likeCount",
          count(c."authorId")
            Over (Partition By p.id)
            As "commentCount",
          (count(l."authorId"=${userId}::uuid)
            Over (Partition By p.id)) > 0
            As liked
        ${template.fromTable} as p
        LEFT JOIN service."Like" as l
          ON l."postId" = p.id AND l."isDeleted" = false
        Left Join service."Comment" as c
          ON c."postId" = p.id AND c."isDeleted" = false
        WHERE 
          Not p."isDeleted"
          ${template.postIdCondition}
          ${template.clubIdCondition}
          ${template.postTypeCondition}
          ${template.isPublicCondition}
          ${template.pageCondition}
      ) as p
      ORDER BY p."createdAt" DESC, p.id DESC
      ${template.limit}
    `;
  }

  // From Table Clauses

  private buildFromPostTable() {
    return Prisma.sql`From service."Post"`;
  }

  private buildFromSubscribedOrJoinedTable(userId: string) {
    return Prisma.sql`
      From (
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
  }

  // Limit Clause

  private buildLimitClause(limit: number) {
    return Prisma.sql`Limit ${limit}`;
  }

  // Condition Clauses

  private buildPageCondition(lastPostId: string, lastCreatedAt: Date) {
    return Prisma.sql`
      AND (p."createdAt"::timestamp at time zone 'UTC', p.id) < 
      (${lastCreatedAt}::TIMESTAMP AT TIME ZONE 'KST', ${lastPostId}::uuid)
    `;
  }

  private buildIsPublicCondition() {
    return Prisma.sql`AND p."isPublic"`;
  }

  private buildPostTypeCondition(postType: PostType) {
    return postType === PostType.Announcement
      ? Prisma.sql`AND p."isAnnouncement"`
      : Prisma.sql`AND Not p."isAnnouncement"`;
  }

  private buildClubIdCondition(clubId: string) {
    return Prisma.sql`AND p."clubId"=${clubId}::uuid`;
  }
  private buildPostIdCondition(postId: string) {
    return Prisma.sql`AND p."id"=${postId}::uuid`;
  }
}
