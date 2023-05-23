import { Test } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

const kakaoUserWithUser = Prisma.validator<Prisma.KakaoUserArgs>()({
  include: { user: true },
});

type KakaoUserWithUser = Prisma.KakaoUserGetPayload<typeof kakaoUserWithUser>;

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UserService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return mockDeep<PrismaService>();
        }
      })
      .compile();

    userService = moduleRef.get(UserService);
    prismaService = moduleRef.get(PrismaService);
  });

  describe('findUserById', () => {
    it('should return user entity', async () => {
      const user = mockDeep<User>();
      const userId = 'userId';
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      expect(await userService.findUserById(userId)).toEqual(user);
    });
    it('should return null for invalid id', async () => {
      const userId = 'userId';
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      expect(await userService.findUserById(userId)).toBeNull();
    });
  });

  describe('findOrCreateUserByKakaoId', () => {
    const kakaoId = 0;
    const username = 'username';
    const user = mockDeep<UserEntity>();
    const kakaoUser = mockDeep<KakaoUserWithUser>();
    kakaoUser.user = user;

    it('should return user entity if the user already signed up', async () => {
      jest
        .spyOn(prismaService.kakaoUser, 'findUnique')
        .mockResolvedValue(kakaoUser);

      expect(
        await userService.findOrCreateUserByKakaoId(kakaoId, username),
      ).toEqual(user);
    });

    it('should create user if the user is not signed up', async () => {
      jest.spyOn(prismaService.kakaoUser, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(user);
      expect(
        await userService.findOrCreateUserByKakaoId(kakaoId, username),
      ).toEqual(user);
    });
  });
});
