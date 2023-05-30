import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  user = (userId: string) => ({
    shouldBeAbleTo: async (action: Action) => {
      const can = await action.can(userId, this.prismaService);
      if (!can) throw new ForbiddenException();
    },
  });
}

export interface Action {
  can(userId: string, prismaService: PrismaService): Promise<boolean> | boolean;
}

export class TrivialAction implements Action {
  can(
    _userId: string,
    _prismaService: PrismaService,
  ): boolean | Promise<boolean> {
    return true;
  }
}
export class AdminAction implements Action {
  constructor(private readonly clubId: string) {}

  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    return await isUserAdminOfClub(userId, this.clubId, prismaService);
  }
}

export const isUserAdminOfClub = async (
  userId: string,
  clubId: string,
  prismaService: PrismaService,
) => {
  const membership = await prismaService.member.findFirst({
    where: {
      userId,
      clubId,
      isDeleted: false,
      isAdmin: true,
    },
  });

  return membership !== null;
};

export const isUserMemberOfClub = async (
  userId: string,
  clubId: string,
  prismaService: PrismaService,
) => {
  const membership = await prismaService.member.findFirst({
    where: {
      userId,
      clubId,
      isDeleted: false,
    },
  });

  return membership !== null;
};

export const isAuthorOfPost = async (
  userId: string,
  postId: string,
  prismaService: PrismaService,
): Promise<boolean> => {
  const result = await prismaService.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
      isDeleted: false,
    },
  });

  return result !== null;
};

export const isUserAdminOfClubOfPost = async (
  userId: string,
  postId: string,
  prismaService: PrismaService,
): Promise<boolean> => {
  const result = await prismaService.post.findFirst({
    where: {
      id: postId,

      isDeleted: false,
      club: {
        memberships: {
          some: {
            userId,
            isAdmin: true,
            isDeleted: false,
          },
        },
      },
    },
  });

  return result !== null;
};

export const isAuthorOfComment = async (
  userId: string,
  commentId: string,
  prismaService: PrismaService,
): Promise<boolean> => {
  const result = await prismaService.comment.findFirst({
    where: {
      commentId,
      authorId: userId,
      isDeleted: false,
    },
  });

  return result !== null;
};

export const isUserAdminOfClubOfPostOfComment = async (
  userId: string,
  commentId: string,
  prismaService: PrismaService,
): Promise<boolean> => {
  const result = await prismaService.comment.findFirst({
    where: {
      commentId,
      isDeleted: false,
      post: {
        club: {
          memberships: {
            some: {
              userId,
              isAdmin: true,
              isDeleted: false,
            },
          },
        },
      },
    },
  });

  return result !== null;
};
