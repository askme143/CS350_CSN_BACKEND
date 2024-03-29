import { Test } from '@nestjs/testing';
import { MySchedule, Schedule } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { ClubService } from 'src/club/club.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ScheduleService } from './schedule.service';
import {
  MyScheduleCreateDto,
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleType,
} from './dto/schedule.dto';
import { ApplicationService } from 'src/application/application.service';

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
          case ApplicationService: {
            const mock = mockDeep<ApplicationService>();
            mock.rejectAllPendingApplications.mockResolvedValue();
            return mock;
          }
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

  describe('create MySchedule', () => {
    const createMyScheduleDto = mockDeep<MyScheduleCreateDto>();
    createMyScheduleDto.scheduleId = scheduleId;

    it('should return mySchedule', async () => {
      const scheduleMock = mockDeep<MySchedule>();
      scheduleMock.scheduleId = scheduleId;
      scheduleMock.userId = userId;
      jest
        .spyOn(prismaService.mySchedule, 'create')
        .mockResolvedValue(scheduleMock);

      // fix: check later
      // expect(
      //   await scheduleService.createMySchedule(
      //     { userId, username: 'test' },
      //     createMyScheduleDto
      //   )
      // ).toEqual({userId: userId, scheduleId: scheduleId, _isMockObject: true});
    });
  });

  describe('getSchedule', () => {
    it('should return schedule', async () => {
      const scheduleMock = mockDeep<Schedule>();
      scheduleMock.id = scheduleId;
      jest
        .spyOn(prismaService.schedule, 'findUnique')
        .mockResolvedValue(scheduleMock);
      const result = await scheduleService.getSchedule(userId, scheduleId);

      expect(result).toEqual(expect.objectContaining({ id: scheduleId }));
      expect(result).toBeInstanceOf(ScheduleDto);
    });
  });

  describe('get mySchedules', () => {
    it('should return mySchedules', async () => {
      const myScheduleMock = mockDeep<MySchedule & { schedule: Schedule }>();
      myScheduleMock.schedule.id = scheduleId;

      jest
        .spyOn(prismaService.mySchedule, 'findMany')
        .mockResolvedValue([myScheduleMock]);

      const result = await scheduleService.getMySchedules(userId);

      expect(result[0].id).toEqual(scheduleId);
      expect(result[0]).toBeInstanceOf(ScheduleDto);
      expect(result.length).toEqual(1);
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
        await scheduleService.getSchedules(userId, {
          type: ScheduleType.JOINED,
          month: 1,
        }),
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
        await scheduleService.getSchedules(userId, {
          type: ScheduleType.SUBSCRIBED,
          month: 1,
        }),
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

  describe('remove MySchedule', () => {
    it('should call update', async () => {
      prismaService.mySchedule.update = jest.fn();
      await scheduleService.removeMySchedule(userId, scheduleId);
      expect(prismaService.mySchedule.update).toBeCalled();
    });
  });
});
