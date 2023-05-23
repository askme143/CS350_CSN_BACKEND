import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClubObject, PolicyService } from './policy.service';

describe('PolicyService', () => {
  let policyService: PolicyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PolicyService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return mockDeep<PrismaService>();
        }
      })
      .compile();

    policyService = moduleRef.get(PolicyService);
    prismaService = moduleRef.get(PrismaService);
  });

  const userId = 'userId';
  const clubId = 'clubId';

  describe('unknown object', () => {
    it('should throw forbidden exception for access to unknown object', async () => {
      expect(
        policyService.user(userId).shouldBeAbleTo('Read', {}),
      ).rejects.toThrowError(new ForbiddenException());
    });
  });

  describe('club policy', () => {
    it('should allow all club creation access', async () => {
      expect(
        policyService.user(userId).shouldBeAbleTo('Create', new ClubObject()),
      ).resolves.not.toThrow();
    });
    it('should allow all club read access', async () => {
      expect(
        policyService.user(userId).shouldBeAbleTo('Read', new ClubObject()),
      ).resolves.not.toThrow();
    });
    it('should allow club update and delete access only when user is an admin of a club', async () => {
      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue({
        userId,
        clubId,
        isAdmin: true,
        isDeleted: false,
        createdAt: new Date(),
      });

      await expect(
        policyService
          .user(userId)
          .shouldBeAbleTo('Update', new ClubObject(clubId)),
      ).resolves.not.toThrow();
      await expect(
        policyService
          .user(userId)
          .shouldBeAbleTo('Delete', new ClubObject(clubId)),
      ).resolves.not.toThrow();

      jest.spyOn(prismaService.member, 'findFirst').mockResolvedValue(null);
      expect(
        policyService
          .user(userId)
          .shouldBeAbleTo('Update', new ClubObject(clubId)),
      ).rejects.toThrow(new ForbiddenException());
      expect(
        policyService
          .user(userId)
          .shouldBeAbleTo('Delete', new ClubObject(clubId)),
      ).rejects.toThrow(new ForbiddenException());

      expect(
        policyService.user(userId).shouldBeAbleTo('Update', new ClubObject()),
      ).rejects.toThrow(new ForbiddenException());
      expect(
        policyService.user(userId).shouldBeAbleTo('Delete', new ClubObject()),
      ).rejects.toThrow(new ForbiddenException());
    });
  });
});
