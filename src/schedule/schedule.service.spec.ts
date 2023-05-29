import { Test } from '@nestjs/testing';
import { Schedule } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { ClubService } from 'src/club/club.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleType,
} from './dto/schedule.dto';
import _ from 'lodash';

describe('ClubService', () => {
  let clubService: ClubService;
  let prismaService: PrismaService;
  // let storageService: StorageService;
  let scheduleService: ScheduleService;

  const userId = 'userId';
  const clubId = 'clubId';
  const scheduleId = 'scheduleId';
  const scheduleName = 'scheduleName';
  const description = 'description';

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ClubService, ScheduleService],
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
    // storageService = moduleRef.get(StorageService);
    scheduleService = moduleRef.get(ScheduleService);
  });

  describe('createSchedule', () => {
    const createScheduleDto = mockDeep<ScheduleCreateDto>();
    createScheduleDto.authorId = userId;
    createScheduleDto.clubId = clubId;
    createScheduleDto.name = scheduleName;
    createScheduleDto.description = description;
    createScheduleDto.isPublic = true;

    it('should return club id', async () => {
      const scheduleMock = mockDeep<Schedule>();
      scheduleMock.id = scheduleId;
      jest
        .spyOn(prismaService.schedule, 'create')
        .mockResolvedValue(scheduleMock);
      jest
        .spyOn(clubService, 'getJoinedClubIdList')
        .mockResolvedValue([clubId]);

      expect(
        await scheduleService.createSchedule(
          { userId, username: 'test' },
          createScheduleDto,
        ),
      ).toEqual(scheduleId);
    });
  });

  describe('getSchedule', () => {
    it('should return schedule', async () => {
      const scheduleMock = mockDeep<Schedule>();
      scheduleMock.id = scheduleId;
      jest
        .spyOn(prismaService.schedule, 'findUnique')
        .mockResolvedValue(scheduleMock);
      expect(await scheduleService.getSchedule(scheduleId)).toEqual(
        plainToClass(ScheduleDto, { id: scheduleId, _isMockObject: true }),
      );
    });
  });

  describe('getSchedules of joinned/subscribed clubs', () => {
    it('should return schedules of joinned club', async () => {
      const scheduleMock = mockDeep<Schedule>();
      scheduleMock.id = scheduleId;
      jest
        .spyOn(prismaService.schedule, 'findMany')
        .mockResolvedValue([scheduleMock]);
      jest
        .spyOn(clubService, 'getJoinedClubIdList')
        .mockResolvedValue([clubId]);
      expect(
        await scheduleService.getSchedules(userId, ScheduleType.JOINED, 1),
      ).toEqual({ clubId: [] });
    });

    it('should return schedules of subscribed club', async () => {
      const scheduleMock = mockDeep<Schedule>();
      scheduleMock.id = scheduleId;
      jest
        .spyOn(prismaService.schedule, 'findMany')
        .mockResolvedValue([scheduleMock]);
      jest
        .spyOn(clubService, 'getSubscribedClubId')
        .mockResolvedValue([clubId]);
      expect(
        await scheduleService.getSchedules(userId, ScheduleType.SUBSCRIBED, 1),
      ).toEqual({ clubId: [] });
    });
  });

  describe('removeSchedule', () => {
    it('should call update', async () => {
      prismaService.schedule.update = jest.fn();
      await scheduleService.removeSchedule(scheduleId);
      expect(prismaService.schedule.update).toBeCalled();
    });
  });
});
