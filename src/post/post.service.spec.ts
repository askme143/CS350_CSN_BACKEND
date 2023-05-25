import { Test } from '@nestjs/testing';
import { Member } from '@prisma/client';
import { instanceToPlain } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import {
  GetClubPostListDto,
  GetClubPostListEnum,
} from './dto/get-club-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
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

  describe('getClubPostList', () => {
    it('Should return list of PostInfoDto', async () => {
      const postInfoDtoArray = [instanceToPlain(mockDeep<PostInfoDto>())];

      const clubId = 'clubId';

      jest
        .spyOn(prismaService, '$queryRaw')
        .mockResolvedValue(postInfoDtoArray);

      let result = await postService.getClubPostList('userId', {
        clubId,
        postType: GetClubPostListEnum.Announcement,
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));

      result = await postService.getClubPostList('userId', {
        clubId,
        postType: GetClubPostListEnum.Ordinary,
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));

      const mockMember = mockDeep<Member>();
      mockMember.isDeleted = false;
      jest
        .spyOn(prismaService.member, 'findUnique')
        .mockResolvedValue(mockMember);
      result = await postService.getClubPostList('userId', {
        clubId,
        postType: GetClubPostListEnum.Announcement,
        lastPostId: 'postId',
        lastCreatedAt: new Date(),
      });
      result.forEach((item) => expect(item).toBeInstanceOf(PostInfoDto));
    });
  });

  describe('getResultLimit', () => {
    it('should return limit gereater than 0 and not greater than 30', () => {
      expect(postService['getResultLimit'](undefined)).toEqual(30);
      expect(postService['getResultLimit'](-1)).toEqual(30);
      expect(postService['getResultLimit'](31)).toEqual(30);
      expect(postService['getResultLimit'](15)).toEqual(15);
    });
  });
});
