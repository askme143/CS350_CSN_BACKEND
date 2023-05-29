import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { Action, PolicyService } from './policy.service';

describe('PolicyService', () => {
  let policyService: PolicyService;

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
  });

  const userId = 'userId';
  const action = mockDeep<Action>();

  it('should throw error if action is forbidden', async () => {
    jest.spyOn(action, 'can').mockReturnValue(false);
    await expect(async () => {
      await policyService.user(userId).shouldBeAbleTo(action);
    }).rejects.toThrow(new ForbiddenException());
  });
  it('should resolve if action is not forbidden', async () => {
    jest.spyOn(action, 'can').mockReturnValue(true);
    await expect(
      policyService.user(userId).shouldBeAbleTo(action),
    ).resolves.not.toThrow();
  });
});
