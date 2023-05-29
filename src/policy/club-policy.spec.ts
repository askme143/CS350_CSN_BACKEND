import { Member } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClub, DeleteClub, ReadClub, UpdateClub } from './club-policy';

describe('ClubPolicy', () => {
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = mockDeep<PrismaService>();
  });

  describe('CreateClub', () => {
    it('should allow all users', async () => {
      const action = new CreateClub();
      expect(await action.can('userId', prismaService)).toBeTruthy();
    });
  });

  describe('ReadClub', () => {
    it('should allow all users', async () => {
      const action = new ReadClub();
      expect(await action.can('userId', prismaService)).toBeTruthy();
    });
  });

  describe('UpdateClub', () => {
    it('should allow for admins', async () => {
      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValue(mockDeep<Member>());
      const action = new UpdateClub('clubId');
      expect(await action.can('userId', prismaService)).toBeTruthy();
    });
    it('should not allow for non-admins', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue(null);
      const action = new UpdateClub('clubId');
      expect(await action.can('userId', prismaService)).toBeFalsy();
    });
  });

  describe('DeleteClub', () => {
    it('should allow for admins', async () => {
      jest
        .spyOn(prismaService.member, 'findFirst')
        .mockResolvedValue(mockDeep<Member>());
      const action = new DeleteClub('clubId');
      expect(await action.can('userId', prismaService)).toBeTruthy();
    });
    it('should not allow for non-admins', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue(null);
      const action = new DeleteClub('clubId');
      expect(await action.can('userId', prismaService)).toBeFalsy();
    });
  });
});
