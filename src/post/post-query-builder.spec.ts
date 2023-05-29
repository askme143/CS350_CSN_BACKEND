import { Test } from '@nestjs/testing';
import { PostType } from './dto/get-club-post-list.dto';
import { PostQueryBuilder } from './post-query-builder';

describe('PostQueryBuilder', () => {
  let queryBuilder: PostQueryBuilder;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PostQueryBuilder],
    }).compile();

    queryBuilder = moduleRef.get(PostQueryBuilder);
  });

  describe('buildReadOnePostQuery', () => {
    it('should build successfully', () => {
      queryBuilder.buildReadOnePostQuery('userId', { postId: 'postId' });
    });
  });

  describe('buildReadPostOfClubQuery', () => {
    it('should build successfully', () => {
      queryBuilder.buildReadPostOfClubQuery('userId', {
        clubId: 'clubId',
        isMember: true,
        postType: PostType.Announcement,
        limit: 1,
      });

      queryBuilder.buildReadPostOfClubQuery('userId', {
        clubId: 'clubId',
        isMember: false,
        postType: PostType.Ordinary,
        limit: 1,
        lastPostId: 'postId',
        lastCreatedAt: new Date(),
      });

      queryBuilder.buildReadPostOfClubQuery('userId', {
        clubId: 'clubId',
        isMember: false,
        postType: PostType.Ordinary,
        limit: 1,
        lastPostId: 'postId',
      });
    });
  });

  describe('buildReadPublicPostQuery', () => {
    it('should build successfully', () => {
      queryBuilder.buildReadPublicPostQuery('userId', {
        limit: 1,
      });

      queryBuilder.buildReadPublicPostQuery('userId', {
        limit: 1,
        lastPostId: 'postId',
        lastCreatedAt: new Date(),
      });

      queryBuilder.buildReadPublicPostQuery('userId', {
        limit: 1,
        lastPostId: 'postId',
      });
    });
  });
});
