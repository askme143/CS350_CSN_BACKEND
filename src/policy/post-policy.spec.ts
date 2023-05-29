import { Member, Post } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClubPost,
  DeletePost,
  ReadClubPost,
  ReadPost,
  ReadPublicPost,
  UpdatePost,
} from './post-policy';

describe('PostPolicy', () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = mockDeep<PrismaService>();
  });

  const userId = 'userId';

  describe('CreateClubPost', () => {
    it('should allow all members to write internal post', async () => {
      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValue(mockDeep<Member>());
      const action = new CreateClubPost('clubId', 'INTERNAL');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should allow all admins to write public post', async () => {
      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValue(mockDeep<Member>());
      const action = new CreateClubPost('clubId', 'PUBLIC');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should not allow all non-members to post', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue(null);
      const action = new CreateClubPost('clubId', 'INTERNAL');
      expect(await action.can(userId, prismaService)).toBeFalsy();
    });
    it('should not allow non-admins to create public post', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue(null);
      const action = new CreateClubPost('clubId', 'PUBLIC');
      expect(await action.can(userId, prismaService)).toBeFalsy();
    });
  });

  describe('ReadPublicPost', () => {
    it('should allow', async () => {
      const action = new ReadPublicPost();
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
  });

  describe('ReadClubPost', () => {
    it('should allow', async () => {
      const action = new ReadClubPost();
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
  });

  describe('ReadPost', () => {
    it('should allow all users to see public post', async () => {
      jest
        .spyOn(prismaService.post, 'findFirst')
        .mockResolvedValue(mockDeep<Post>());

      const action = new ReadPost('postId');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should allow all members to see club post', async () => {
      jest
        .spyOn(prismaService.post, 'findFirst')
        .mockResolvedValue(mockDeep<Post>());

      const action = new ReadPost('postId');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should not allow non-members to see internal post', async () => {
      jest.spyOn(prismaService.post, 'findFirst').mockResolvedValue(null);

      const action = new ReadPost('postId');
      expect(await action.can(userId, prismaService)).toBeFalsy();
    });
  });

  describe('UpdatePost', () => {
    it('should allow the author to update post', async () => {
      jest
        .spyOn(prismaService.post, 'findFirst')
        .mockResolvedValue(mockDeep<Post>());

      const action = new UpdatePost('postId');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should not allow non-authors to update post', async () => {
      jest.spyOn(prismaService.post, 'findFirst').mockResolvedValue(null);

      const action = new UpdatePost('postId');
      expect(await action.can(userId, prismaService)).toBeFalsy();
    });
  });

  describe('DeletePost', () => {
    it('should allow the author to delete post', async () => {
      jest
        .spyOn(prismaService.post, 'findFirst')
        .mockResolvedValue(mockDeep<Post>());

      const action = new DeletePost('postId');
      expect(await action.can(userId, prismaService)).toBeTruthy();
    });
    it('should not allow non-admin, non-author users to delete post', async () => {
      jest.spyOn(prismaService.post, 'findFirst').mockResolvedValue(null);

      const action = new DeletePost('postId');
      expect(await action.can(userId, prismaService)).toBeFalsy();
    });
  });
});
