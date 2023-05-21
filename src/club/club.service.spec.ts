import { Test } from '@nestjs/testing';
import { Club, User, Subscription, Member } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ClubService } from './club.service';
import { ClubInfoDto } from './dto/club-info.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { ClubEntity } from './entities/club.entity';

describe('ClubService', () => {
  let clubService: ClubService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  const userId = 'userId';
  const clubId = 'clubId';
  const clubname = 'clubname';
  const description = 'description';
  const canApply = false;
  const originalname = 'originalname';
  const imagePathPattern = (originalPath: string) =>
    new RegExp('club/\\d{13}-' + originalPath);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ClubService],
    })
      .useMocker((token) => {
        switch (token) {
          case PrismaService: {
            const mock = mockDeep<PrismaService>();
            return mock;
          }
          case StorageService: {
            const mock = mockDeep<StorageService>();
            mock.upload.mockImplementation(async (path: string) => path);
            return mock;
          }
        }
      })
      .compile();

    clubService = moduleRef.get(ClubService);
    prismaService = moduleRef.get(PrismaService);
    storageService = moduleRef.get(StorageService);
  });

  describe('private helpers', () => {
    describe('getResultLimit', () => {
      it('should return min 1, max 30', () => {
        expect(clubService['getResultLimit'](0)).toEqual(30);
        expect(clubService['getResultLimit'](-10)).toEqual(30);
        expect(clubService['getResultLimit'](undefined)).toEqual(30);
        expect(clubService['getResultLimit'](10)).toEqual(10);
        expect(clubService['getResultLimit'](10000)).toEqual(30);
      });
    });
    describe('getClubImagePath', () => {
      it('should return proper image path', () => {
        const image = mockDeep<Express.Multer.File>();
        image.originalname = originalname;
        expect(clubService['getClubImagePath'](image)).toMatch(
          imagePathPattern(originalname),
        );
      });
    });
    describe('makeClubInfoDtoFromClubEntity', () => {
      it('should return ClubInfoDto', async () => {
        const clubEntity: ClubEntity = {
          id: 'clubId',
          imageUrl: 'imageUrl',
          clubname: 'clubname',
          description: 'description',
          canApply: false,
          createdAt: new Date(),
          isDeleted: false,
        };
        const adminId = 'adminId';
        const memberCount = 1;
        prismaService.member.count = jest.fn().mockResolvedValue(memberCount);
        prismaService.member.findMany = jest
          .fn()
          .mockResolvedValue([{ userId: adminId }]);

        expect(
          await clubService['makeClubInfoDtoFromClubEntity'](clubEntity),
        ).toEqual(
          plainToClass(ClubInfoDto, {
            ...clubEntity,
            adminIds: [adminId],
            memberCount,
          }),
        );
      });
    });
  });

  describe('createClub', () => {
    const createClubDto = mockDeep<CreateClubDto>();
    createClubDto.canApply = canApply;
    createClubDto.clubname = clubname;
    createClubDto.description = description;
    createClubDto.image.path = originalname;

    it('should return club id', async () => {
      const clubMock = mockDeep<Club>();
      clubMock.id = clubId;

      jest.spyOn(prismaService.club, 'create').mockResolvedValue(clubMock);

      expect(await clubService.createClub(userId, createClubDto)).toEqual(
        clubId,
      );
    });
  });

  describe('Reads on club', () => {
    const clubIds = Array.from({ length: 10 }, (_, i) => i).map((i) => {
      return clubId + i;
    });

    describe('findStarredClubId', () => {
      it('should return club id if exists', async () => {
        const user = mockDeep<User>();
        user.starredClubId = clubId;
        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

        expect(await clubService.findStarredClubId(userId)).toEqual(clubId);
      });
      it('should return null if it does not exist', async () => {
        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

        expect(await clubService.findStarredClubId(userId)).toBeNull();
      });
    });

    describe('getSubscribedClubId', () => {
      it('should return list of subscribed club id', async () => {
        const subscriptions = clubIds.map((clubId) => {
          const subscription = mockDeep<Subscription>();
          subscription.userId = userId;
          subscription.clubId = clubId;
          return subscription;
        });

        jest
          .spyOn(prismaService.subscription, 'findMany')
          .mockResolvedValue(subscriptions);

        expect(await clubService.getSubscribedClubId(userId)).toEqual(clubIds);
      });
      it('should return list of subscribed club id', async () => {
        const subscriptions = [
          {
            userId: 'userId',
            clubId: 'clubId',
            isDeleted: false,
            createdAt: new Date(),
          },
        ];

        jest
          .spyOn(prismaService.subscription, 'findMany')
          .mockResolvedValue(subscriptions);

        expect(await clubService.getSubscribedClubId(userId)).toEqual([
          'clubId',
        ]);
      });
    });

    describe('getJoinedClubIdList', () => {
      it('should return list of joined club id', async () => {
        const memberships = clubIds.map((clubId) => {
          const membership = mockDeep<Member>();
          membership.userId = userId;
          membership.clubId = clubId;
          return membership;
        });

        jest
          .spyOn(prismaService.member, 'findMany')
          .mockResolvedValue(memberships);

        expect(await clubService.getJoinedClubIdList(userId)).toEqual(clubIds);
      });
    });

    describe('getManagingClubIdList', () => {
      it('should return list of joined club id', async () => {
        const memberships = clubIds.map((clubId) => {
          const membership = mockDeep<Member>();
          membership.userId = userId;
          membership.clubId = clubId;
          membership.isAdmin = true;
          return membership;
        });

        jest
          .spyOn(prismaService.member, 'findMany')
          .mockResolvedValue(memberships);

        expect(await clubService.getManagingClubIdList(userId)).toEqual(
          clubIds,
        );
      });
    });

    describe('getClubList', () => {
      const wholeClubIds = Array.from({ length: 100 }, (_, i) => 'clubId' + i);
      const wholeClubs = wholeClubIds.map((clubId) => {
        const membership = mockDeep<Club>();
        membership.id = clubId;
        return membership;
      });

      it('should return list of club id with max 30', async () => {
        prismaService.club.findMany = jest
          .fn()
          .mockResolvedValue(wholeClubs.slice(0, 30));

        expect(await clubService.getClubIdList({})).toEqual(
          wholeClubIds.slice(0, clubService['getResultLimit']()),
        );

        expect(prismaService.club.findMany).toBeCalledWith(
          expect.objectContaining({ take: clubService['getResultLimit']() }),
        );
      });

      it('should return club id array after last club id', async () => {
        const limit = 100;
        const lastClubId = 'clubId50';

        prismaService.club.findMany = jest
          .fn()
          .mockResolvedValue(
            wholeClubs.slice(50, clubService['getResultLimit'](limit)),
          );

        expect(
          await clubService.getClubIdList({
            lastClubId,
            limit,
          }),
        ).toEqual(wholeClubIds.slice(50, clubService['getResultLimit'](limit)));
        expect(prismaService.club.findMany).toBeCalledWith(
          expect.objectContaining({ cursor: { id: lastClubId }, skip: 1 }),
        );
      });
    });

    describe('findClubInfo', () => {
      const clubId = 'clubId';
      const clubEntity = mockDeep<ClubEntity>();
      const clubInfoDto = mockDeep<ClubInfoDto>();

      it('should return null if no club exists', async () => {
        jest.spyOn(prismaService.club, 'findUnique').mockResolvedValue(null);
        expect(await clubService.findClubInfo(clubId)).toBeNull();
      });
      it('should return club info dto', async () => {
        jest
          .spyOn(prismaService.club, 'findUnique')
          .mockResolvedValue(clubEntity);
        clubService['makeClubInfoDtoFromClubEntity'] = jest
          .fn()
          .mockResolvedValue(clubInfoDto);

        expect(await clubService.findClubInfo(clubId)).toEqual(clubInfoDto);
      });
    });
  });

  describe('updateClub', () => {
    it('should return club info', async () => {
      const clubEntity = mockDeep<ClubEntity>();
      const clubInfoDto = mockDeep<ClubInfoDto>();

      jest.spyOn(prismaService.club, 'update').mockResolvedValue(clubEntity);
      clubService['makeClubInfoDtoFromClubEntity'] = jest
        .fn()
        .mockResolvedValue(clubInfoDto);

      expect(await clubService.updateClub(clubId, {})).toEqual(clubInfoDto);
    });
    it('should call image upload if image is provided', async () => {
      const clubEntity = mockDeep<ClubEntity>();
      const clubInfoDto = mockDeep<ClubInfoDto>();

      storageService.upload = jest.fn();
      jest.spyOn(prismaService.club, 'update').mockResolvedValue(clubEntity);
      clubService['makeClubInfoDtoFromClubEntity'] = jest
        .fn()
        .mockResolvedValue(clubInfoDto);

      await clubService.updateClub(clubId, {
        image: mockDeep<Express.Multer.File>(),
      });

      expect(storageService.upload).toBeCalled();
    });
  });

  describe('removeClub', () => {
    it('should call update', async () => {
      prismaService.club.update = jest.fn();

      await clubService.removeClub('clubId');
      expect(prismaService.club.update).toBeCalled();
    });
  });
});
