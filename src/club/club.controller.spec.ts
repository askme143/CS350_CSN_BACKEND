import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { PolicyService } from '../policy/policy.service';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListEnum } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubEntity } from './entities/club.entity';
import { mockDeep } from 'jest-mock-extended';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('ClubController', () => {
  let clubController: ClubController;
  let clubService: ClubService;
  let userJwtPayload: JwtPayloadEntity = {
    userId: 'userId',
    username: 'username',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClubController],
    })
      .useMocker((token) => {
        switch (token) {
          case PolicyService: {
            const mock = mockDeep<PolicyService>();
            mock.user.mockReturnValue({ shouldBeAbleTo: jest.fn() });
            return mock;
          }
          case ClubService:
            return mockDeep<ClubService>();
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    clubController = moduleRef.get(ClubController);
    clubService = moduleRef.get(ClubService);
  });

  describe('getClubList', () => {
    it('should return an array of club ids', async () => {
      const result = ['club1', 'club2'];
      const starredClubId = 'club1';
      jest.spyOn(clubService, 'getClubIdList').mockResolvedValue(result);
      jest.spyOn(clubService, 'getSubscribedClubId').mockResolvedValue(result);
      jest.spyOn(clubService, 'getJoinedClubIdList').mockResolvedValue(result);
      jest
        .spyOn(clubService, 'getManagingClubIdList')
        .mockResolvedValue(result);
      jest
        .spyOn(clubService, 'findStarredClubId')
        .mockResolvedValue(starredClubId);

      const types = [
        GetClubListEnum.Search,
        GetClubListEnum.Subscribed,
        GetClubListEnum.Joined,
        GetClubListEnum.Managing,
      ];

      for (const type of types) {
        expect(
          await clubController.getClubList(
            { userId: '', username: '' },
            { type },
          ),
        ).toEqual(result);
      }
      expect(
        await clubController.getClubList(userJwtPayload, {
          type: GetClubListEnum.Starred,
        }),
      ).toEqual([starredClubId]);
    });

    it('should return an empty array if user has no starred club,', async () => {
      jest.spyOn(clubService, 'findStarredClubId').mockResolvedValue(null);
      expect(
        await clubController.getClubList(userJwtPayload, {
          type: GetClubListEnum.Starred,
        }),
      ).toEqual([]);
    });
  });

  describe('getClubInfo', () => {
    it('should return club entity', async () => {
      const clubId = 'clubId';
      jest
        .spyOn(clubService, 'findClubInfo')
        .mockResolvedValue(new ClubEntity());

      expect(
        await clubController.getClubInfo(userJwtPayload, clubId),
      ).toBeInstanceOf(ClubEntity);
    });
    it('should throw notfound error if there is no corresponding club', async () => {
      const clubId = 'clubId';
      jest.spyOn(clubService, 'findClubInfo').mockResolvedValue(null);
      await expect(async () => {
        await clubController.getClubInfo(userJwtPayload, clubId);
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('createClub', () => {
    it('should return string club id', async () => {
      const clubId = 'clubId';
      jest.spyOn(clubService, 'createClub').mockResolvedValue(clubId);
      expect(
        await clubController.createClub(userJwtPayload, new CreateClubDto()),
      ).toEqual(clubId);
    });
  });

  describe('updateClub', () => {
    it('should return clubEntity', async () => {
      const clubId = 'clubId';
      const clubEntity = new ClubEntity();

      jest
        .spyOn(clubService, 'updateClub')
        .mockImplementation(
          async (_clubId: string, _updateClubDto: UpdateClubDto) => {
            return clubEntity;
          },
        );

      expect(
        await clubController.updateClub(
          userJwtPayload,
          clubId,
          new UpdateClubDto(),
        ),
      ).toEqual(clubEntity);
    });
  });

  describe('removeClub', () => {
    it('should call removeClub of ClubService', async () => {
      const clubId = 'clubId';
      const mockDelete = jest
        .fn()
        .mockImplementation(async (_clubId: string) => {
          return;
        });

      jest.spyOn(clubService, 'removeClub').mockImplementation(mockDelete);

      await clubController.removeClub(userJwtPayload, clubId);
      expect(mockDelete).toBeCalled();
    });
  });
});
