import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { PolicyService } from '../policy/policy.service';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListDto, GetClubListEnum } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubEntity } from './entities/club.entity';
import { mockDeep } from 'jest-mock-extended';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ClubInfoDto } from './dto/club-info.dto';
import { plainToClass } from 'class-transformer';

const moduleMocker = new ModuleMocker(global);

describe('ClubController', () => {
  let clubController: ClubController;
  let clubService: ClubService;
  const userJwtPayload: JwtPayloadEntity = {
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
        const getClubListDto = plainToClass(GetClubListDto, { type });
        expect(
          await clubController.getClubList(
            { userId: '', username: '' },
            getClubListDto,
          ),
        ).toEqual(result);
      }

      const getClubListDto = plainToClass(GetClubListDto, {
        type: GetClubListEnum.Search,
        limit: '1',
      });
      jest
        .spyOn(clubService, 'getClubIdList')
        .mockResolvedValue(result.slice(0, 1));
      expect(
        await clubController.getClubList(
          { userId: '', username: '' },
          getClubListDto,
        ),
      ).toEqual(result.slice(0, 1));

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
    it('should return club info', async () => {
      const clubId = 'clubId';
      jest
        .spyOn(clubService, 'findClubInfo')
        .mockResolvedValue(new ClubInfoDto());

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
      const clubInfoDto = new ClubInfoDto();

      jest
        .spyOn(clubService, 'updateClub')
        .mockImplementation(
          async (_clubId: string, _updateClubDto: UpdateClubDto) => {
            return clubInfoDto;
          },
        );

      expect(
        await clubController.updateClub(
          userJwtPayload,
          clubId,
          new UpdateClubDto(),
        ),
      ).toEqual(clubInfoDto);
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
