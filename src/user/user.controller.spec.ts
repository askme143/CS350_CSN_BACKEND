import { Test } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { mockDeep } from 'jest-mock-extended';
import { ApplicationService } from 'src/application/application.service';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubService } from 'src/club/club.service';
import { PolicyService } from 'src/policy/policy.service';
import {
  MyScheduleCreateDto,
  ScheduleDto,
} from 'src/schedule/dto/schedule.dto';
import { ScheduleService } from 'src/schedule/schedule.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let userController: UserController;
  let scheduleService: ScheduleService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
    })
      .useMocker((token) => {
        switch (token) {
          case PolicyService:
            return mockDeep<PolicyService>();
          case ApplicationService:
            return mockDeep<ApplicationService>();
          case ClubService:
            return mockDeep<ClubService>();
          case UserService:
            return mockDeep<UserService>();
          case ScheduleService:
            return mockDeep<ScheduleService>();
        }
      })
      .compile();

    userController = moduleRef.get(UserController);
    scheduleService = moduleRef.get(UserController);
  });

  const jwtPayload = mockDeep<JwtPayloadEntity>();

  describe('getMySchedules', () => {
    it('should return mySchedules', async () => {
      const tmpTime = new Date();
      const result = [
        plainToClass(ScheduleDto, {
          userId: 'userId',
          schedueId: 'scheduleId1',
          isDeleted: false,
          createdAt: tmpTime,
        }),
        plainToClass(ScheduleDto, {
          userId: 'userId',
          schedueId: 'scheduleId1',
          isDeleted: false,
          createdAt: tmpTime,
        }),
      ];

      jest.spyOn(scheduleService, 'getMySchedules').mockResolvedValue(result);
      expect(await userController.getMySchedules(jwtPayload)).toEqual(result);
    });
  });

  describe('create mySchedule', () => {
    it('should return string schedule id', async () => {
      const scheduleId = 'scheduleId';
      const userId = 'userId';
      const tmpTime = new Date();
      jest.spyOn(scheduleService, 'createMySchedule').mockResolvedValue({
        userId,
        scheduleId,
        isDeleted: false,
        createdAt: tmpTime,
      });
      expect(
        await userController.createMySchedule(
          jwtPayload,
          new MyScheduleCreateDto(),
        ),
      ).toEqual({ userId, scheduleId, isDeleted: false, createdAt: tmpTime });
    });
  });

  describe('remove mySchedule', () => {
    it('should call removeSchedule of ScheduleService', async () => {
      const scheduleId = 'scheduleId';
      const mockDelete = jest
        .fn()
        .mockImplementation(async (_scheduleId: string) => {
          return;
        });
      jest
        .spyOn(scheduleService, 'removeMySchedule')
        .mockImplementation(mockDelete);
      expect(await userController.removeMySchedule(jwtPayload, scheduleId));
      expect(mockDelete).toBeCalled();
    });
  });
});
