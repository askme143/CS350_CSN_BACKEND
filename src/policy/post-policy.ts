import { PrismaService } from 'src/prisma/prisma.service';
import {
  Action,
  isAuthorOfComment,
  isAuthorOfPost,
  isUserAdminOfClub,
  isUserAdminOfClubOfPost,
  isUserAdminOfClubOfPostOfComment,
  isUserMemberOfClub,
  TrivialAction,
} from './policy.service';

// post policies
export class CreateClubPost implements Action {
  constructor(
    private readonly clubId: string,
    private readonly type: 'INTERNAL' | 'PUBLIC',
  ) {}

  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    if (this.type === 'INTERNAL') {
      return await isUserMemberOfClub(userId, this.clubId, prismaService);
    } else {
      return await isUserAdminOfClub(userId, this.clubId, prismaService);
    }
  }
}
export class ReadPublicPost extends TrivialAction {}
export class ReadClubPost extends TrivialAction {}
export class ReadPost implements Action {
  constructor(private readonly postId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    const result = await prismaService.post.findFirst({
      where: {
        id: this.postId,
        isDeleted: false,
        OR: [
          { isPublic: true },
          {
            club: {
              memberships: {
                some: {
                  userId,
                  isDeleted: false,
                },
              },
            },
          },
        ],
      },
    });

    return result !== null;
  }
}
export class UpdatePost implements Action {
  constructor(private readonly postId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    return await isAuthorOfPost(userId, this.postId, prismaService);
  }
}
export class DeletePost implements Action {
  constructor(private readonly postId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    return (
      (await isAuthorOfPost(userId, this.postId, prismaService)) ||
      (await isUserAdminOfClubOfPost(userId, this.postId, prismaService))
    );
  }
}

// comment policies
export class CommentToPost extends ReadPost {}
export class ReadCommentOfPost extends ReadPost {}
export class UpdateComment implements Action {
  constructor(private readonly commentId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    return await isAuthorOfComment(userId, this.commentId, prismaService);
  }
}
export class DeleteComment implements Action {
  constructor(private readonly commentId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    return (
      (await isAuthorOfComment(userId, this.commentId, prismaService)) ||
      (await isUserAdminOfClubOfPostOfComment(
        userId,
        this.commentId,
        prismaService,
      ))
    );
  }
}

// like policies
export class LikeOrUnlikePost extends ReadPost {}
