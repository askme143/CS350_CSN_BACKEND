import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { PolicyService } from 'src/policy/policy.service';
import { GetPublicPostListDto } from './dto/get-public-post-list.dto';
import { PostInfoDto } from './dto/post-info.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('PostController', () => {
  let postService: PostService;
  let postController: PostController;
  let policyService: PolicyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostController],
    })
      .useMocker((token) => {
        if (token === PostService) {
          return mockDeep<PostService>();
        } else if (token === PolicyService) {
          return mockDeep<PolicyService>();
        }
      })
      .compile();

    postService = moduleRef.get(PostService);
    policyService = moduleRef.get(PolicyService);
    postController = moduleRef.get(PostController);

    policyService.user = jest.fn().mockImplementation((_: any) => ({
      shouldBeAbleTo: async (_: any) => {
        //
      },
    }));
  });

  const jwtPayload = mockDeep<JwtPayloadEntity>();

  function mockInvalidAccess(policyService: PolicyService) {
    jest.spyOn(policyService, 'user').mockReturnValue({
      shouldBeAbleTo: async (_: any) => {
        throw new ForbiddenException();
      },
    });
  }

  describe('getPublicPosts', () => {
    it('should call getPublicPostList of PostService', async () => {
      const getPublicPostListSpy = jest.spyOn(postService, 'getPublicPostList');
      await postController.getPublicPosts(
        jwtPayload,
        mockDeep<GetPublicPostListDto>(),
      );

      expect(getPublicPostListSpy).toBeCalledTimes(1);
    });
    it('should return a list of PostInfoDto', async () => {
      jest
        .spyOn(postService, 'getPublicPostList')
        .mockResolvedValue(
          plainToInstance(PostInfoDto, [mockDeep<PostInfoDto>()]),
        );
      const result = await postController.getPublicPosts(
        jwtPayload,
        mockDeep<GetPublicPostListDto>(),
      );

      result.forEach((item) => {
        expect(item).toBeInstanceOf(PostInfoDto);
      });
    });
    it('should check a policy', async () => {
      mockInvalidAccess(policyService);
      expect(
        async () =>
          await postController.getPublicPosts(
            jwtPayload,
            mockDeep<GetPublicPostListDto>(),
          ),
      ).rejects.toThrowError(new ForbiddenException());
    });
  });

  describe('getPost', () => {
    it('should call getPost of PostService', async () => {
      const getPostSpy = jest.spyOn(postService, 'getPost');
      await postController.getPost(jwtPayload, 'postId');

      expect(getPostSpy).toBeCalledTimes(1);
    });
    it('should return a PostInfoDto', async () => {
      jest
        .spyOn(postService, 'getPost')
        .mockResolvedValue(
          plainToInstance(PostInfoDto, mockDeep<PostInfoDto>()),
        );

      const result = await postController.getPost(jwtPayload, 'postId');
      expect(result).toBeInstanceOf(PostInfoDto);
    });
    it('should throw not found exception if the result is null', async () => {
      jest.spyOn(postService, 'getPost').mockResolvedValue(null);

      await expect(async () => {
        await postController.getPost(jwtPayload, 'postId');
      }).rejects.toThrowError(NotFoundException);
    });
    it('should check a policy', async () => {
      mockInvalidAccess(policyService);
      expect(
        async () => await postController.getPost(jwtPayload, 'postId'),
      ).rejects.toThrowError(new ForbiddenException());
    });
  });

  describe('updatePost', () => {
    it('should call updatePost of PostService', async () => {
      const updateSpy = jest.spyOn(postService, 'updatePost');
      await postController.updatePost(
        jwtPayload,
        'postId',
        mockDeep<UpdatePostDto>(),
      );

      expect(updateSpy).toBeCalledTimes(1);
    });
    it('should return a PostInfoDto', async () => {
      jest
        .spyOn(postService, 'updatePost')
        .mockResolvedValue(
          plainToInstance(PostInfoDto, mockDeep<PostInfoDto>()),
        );

      const result = await postController.updatePost(
        jwtPayload,
        'postId',
        mockDeep<UpdatePostDto>(),
      );

      expect(result).toBeInstanceOf(PostInfoDto);
    });
    it('should check a policy', async () => {
      mockInvalidAccess(policyService);
      expect(
        async () =>
          await postController.updatePost(
            jwtPayload,
            'postId',
            mockDeep<UpdatePostDto>(),
          ),
      ).rejects.toThrowError(new ForbiddenException());
    });
  });
  describe('deletePost', () => {
    it('should call deletePost of PostService', async () => {
      const deleteSpy = jest.spyOn(postService, 'deletePost');
      await postController.deletePost(jwtPayload, 'postId');

      expect(deleteSpy).toBeCalledTimes(1);
    });
    it('should check a policy', async () => {
      mockInvalidAccess(policyService);
      expect(
        async () => await postController.deletePost(jwtPayload, 'postId'),
      ).rejects.toThrowError(new ForbiddenException());
    });
  });
});
