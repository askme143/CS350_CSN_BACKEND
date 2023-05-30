import { Test } from '@nestjs/testing';
import { Member, Post } from '@prisma/client';
import { instanceToPlain } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostType } from './dto/get-club-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryBuilder } from './post-query-builder';
import { PostService } from './post.service';

describe('PostService', () => {
  let postService: PostService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PostService],
    })
      .useMocker((token) => {
        switch (token) {
          case PostQueryBuilder:
            return mockDeep<PostQueryBuilder>();
          case PrismaService:
            return mockDeep<PrismaService>();
          case StorageService:
            return mockDeep<StorageService>();
        }
      })
      .compile();

    postService = moduleRef.get(PostService);
    prismaService = moduleRef.get(PrismaService);
    storageService = moduleRef.get(StorageService);
  });

  describe('getResultLimit', () => {
    it('should return limit gereater than 0 and not greater than 30', () => {
      expect(postService['getResultLimit'](undefined)).toEqual(30);
      expect(postService['getResultLimit'](-1)).toEqual(30);
      expect(postService['getResultLimit'](31)).toEqual(30);
      expect(postService['getResultLimit'](15)).toEqual(15);
    });
  });

  describe('getPostImagePath', () => {
    it('should return correct format', () => {
      const image = mockDeep<Express.Multer.File>();
      image.originalname = 'image';

      expect(postService['getPostImagePath'](image)).toMatch(
        new RegExp('post/\\d{13}-' + 'image'),
      );
    });
  });

  describe('isUserMemberOfClub', () => {
    it('should return false if there is no membership', async () => {
      const membership = mockDeep<Member>();
      membership.isDeleted = true;

      jest
        .spyOn(prismaService.member, 'findUnique')
        .mockResolvedValue(membership);
      expect(
        await postService['isUserMemberOfClub']('userId', 'clubId'),
      ).toEqual(false);

      jest.spyOn(prismaService.member, 'findUnique').mockResolvedValue(null);
      expect(
        await postService['isUserMemberOfClub']('userId', 'clubId'),
      ).toEqual(false);
    });
    it('should return true if there is a membership', async () => {
      const membership = mockDeep<Member>();
      membership.isDeleted = false;

      jest
        .spyOn(prismaService.member, 'findUnique')
        .mockResolvedValue(membership);
      expect(
        await postService['isUserMemberOfClub']('userId', 'clubId'),
      ).toEqual(true);
    });
  });

  describe('getClubPostList', () => {
    it('Should return list of PostInfoDto', async () => {
      const postInfoDtoArray = [instanceToPlain(mockDeep<PostInfoDto>())];

      const clubId = 'clubId';

      jest
        .spyOn(prismaService, '$queryRaw')
        .mockResolvedValue(postInfoDtoArray);

      // Member
      jest
        .spyOn(postService as any, 'isUserMemberOfClub')
        .mockResolvedValue(false);

      let result = await postService.getClubPostList('userId', clubId, {
        postType: PostType.Announcement,
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));

      result = await postService.getClubPostList('userId', clubId, {
        postType: PostType.Ordinary,
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));

      // Non meber
      jest
        .spyOn(postService as any, 'isUserMemberOfClub')
        .mockResolvedValue(true);
      result = await postService.getClubPostList('userId', clubId, {
        postType: PostType.Announcement,
        lastPostId: 'postId',
        lastCreatedAt: new Date(),
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));
    });
  });

  describe('getPublicPostList', () => {
    it('should return list of PostInfoDto', async () => {
      const postInfoDtoArray = [instanceToPlain(mockDeep<PostInfoDto>())];

      jest
        .spyOn(prismaService, '$queryRaw')
        .mockResolvedValue(postInfoDtoArray);

      const result = await postService.getPublicPostList('userId', {});
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));
    });
  });

  describe('getPost', () => {
    it('should return PostInfoDto', async () => {
      const postInfoDtoArray = [instanceToPlain(mockDeep<PostInfoDto>())];

      jest
        .spyOn(prismaService, '$queryRaw')
        .mockResolvedValue(postInfoDtoArray);

      const result = await postService.getPost('userId', 'postId');
      expect(result).toBeInstanceOf(PostInfoDto);
    });
    it('should return null', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([]);

      const result = await postService.getPost('userId', 'postId');
      expect(result).toBeNull();
    });
  });

  describe('createClubPost', () => {
    it('should return PostInfoDto', async () => {
      const post = mockDeep<Post>();
      const image = mockDeep<Express.Multer.File>();
      image.originalname = 'image';
      const createPostDto = mockDeep<CreatePostDto>();
      createPostDto.images = [image];

      jest.spyOn(storageService, 'upload').mockResolvedValue('url');
      jest.spyOn(prismaService.post, 'create').mockResolvedValue(post);

      const result = await postService.createClubPost(
        'userId',
        'clubId',
        createPostDto,
      );

      expect(result).toBeInstanceOf(PostInfoDto);
    });
  });

  describe('updatePost', () => {
    it('should return PostInfoDto', async () => {
      const post = mockDeep<Post>();
      const image = mockDeep<Express.Multer.File>();
      image.originalname = 'image';
      const updatePostDto = mockDeep<UpdatePostDto>();
      updatePostDto.images = [image];

      jest.spyOn(storageService, 'upload').mockResolvedValue('url');
      jest.spyOn(prismaService.post, 'update').mockResolvedValue(post);
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([post]);

      const result = await postService.updatePost(
        'userId',
        'postId',
        updatePostDto,
      );

      expect(result).toBeInstanceOf(PostInfoDto);
    });
    it('should return PostInfoDto (without images)', async () => {
      const post = mockDeep<Post>();
      const updatePostDto = mockDeep<UpdatePostDto>();
      updatePostDto.images = undefined;

      jest.spyOn(prismaService.post, 'update').mockResolvedValue(post);
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([post]);

      const result = await postService.updatePost(
        'userId',
        'postId',
        updatePostDto,
      );

      expect(result).toBeInstanceOf(PostInfoDto);
    });
  });

  describe('deletePost', () => {
    it('should call update', async () => {
      const updateSpy = jest.spyOn(prismaService.post, 'update');
      const deleteSpy = jest.spyOn(prismaService.post, 'delete');

      await postService.deletePost('postId');

      expect(updateSpy).toBeCalledTimes(1);
      expect(deleteSpy).toBeCalledTimes(0);
    });
  });
});
