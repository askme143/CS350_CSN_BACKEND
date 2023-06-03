import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { PolicyService } from '../policy/policy.service';
import { mockDeep } from 'jest-mock-extended';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleType,
} from './dto/schedule.dto';
import { Dictionary } from 'lodash';
import { plainToClass } from 'class-transformer';

const moduleMocker = new ModuleMocker(global);

describe('ScheduleController', () => {
  let scheduleController: ScheduleController;
  let scheduleService: ScheduleService;
  const userJwtPayload: JwtPayloadEntity = {
    userId: 'userId',
    username: 'username',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ScheduleController],
    })
      .useMocker((token) => {
        switch (token) {
          case PolicyService: {
            const mock = mockDeep<PolicyService>();
            mock.user.mockReturnValue({ shouldBeAbleTo: jest.fn() });
            return mock;
          }
          case ScheduleService:
            return mockDeep<ScheduleService>();
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

    scheduleController = moduleRef.get(ScheduleController);
    scheduleService = moduleRef.get(ScheduleService);
  });

  describe('getSchedules', () => {
    it('should return schedules of joinned clubs', async () => {
      const result: Dictionary<any[]> = {
        club1: ['schedule1'],
        club2: ['schedule2'],
      };

      jest.spyOn(scheduleService, 'getSchedules').mockResolvedValue(result);
      expect(
        await scheduleController.getSchedules(userJwtPayload, {
          type: ScheduleType.JOINED,
          month: 3,
        }),
      ).toEqual({ scheduleData: result });
    });
  });

  describe('getSchedule', () => {
    it('should return schedule Info', async () => {
      const scheduleId = 'scheduleId';
      jest
        .spyOn(scheduleService, 'getSchedule')
        .mockResolvedValue(new ScheduleDto());

      expect(
        await scheduleController.getSchedule(userJwtPayload, scheduleId),
      ).toBeInstanceOf(ScheduleDto);
    });

    it('should throw not found error if there is no corresponding schedule', async () => {
      const scheduleId = 'scheduleId';
      jest.spyOn(scheduleService, 'getSchedule').mockResolvedValue(null);
      await expect(async () => {
        await scheduleController.getSchedule(userJwtPayload, scheduleId);
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('create Schedule', () => {
    it('should return string schedule id', async () => {
      const scheduleId = 'scheduleId';
      jest
        .spyOn(scheduleService, 'createSchedule')
        .mockResolvedValue(scheduleId);
      expect(
        await scheduleController.createSchedule(
          userJwtPayload,
          new ScheduleCreateDto(),
        ),
      ).toEqual(scheduleId);
    });
  });

  describe('remove Schedule', () => {
    it('should call removeSchedule of ScheduleService', async () => {
      const scheduleId = 'scheduleId';
      const mockDelete = jest
        .fn()
        .mockImplementation(async (_scheduleId: string) => {
          return;
        });
      jest
        .spyOn(scheduleService, 'removeSchedule')
        .mockImplementation(mockDelete);

      const mockGetSchedule = jest
        .fn()
        .mockImplementation(async (_scheduleId: string) => {
          return { scheduleId: _scheduleId, clubId: 'test' };
        });
      jest
        .spyOn(scheduleService, 'getSchedule')
        .mockImplementation(mockGetSchedule);

      expect(
        await scheduleController.removeSchedule(userJwtPayload, scheduleId),
      );
      expect(mockDelete).toBeCalled();
    });

    it('should throw not found error if there is no matching schedule', async () => {
      const scheduleId = 'scheduleId';
      const mockDelete = jest
        .fn()
        .mockImplementation(async (_scheduleId: string) => {
          return;
        });
      jest
        .spyOn(scheduleService, 'removeSchedule')
        .mockImplementation(mockDelete);
      await expect(async () => {
        await scheduleController.removeSchedule(userJwtPayload, scheduleId);
      }).rejects.toThrow(NotFoundException);
    });
  });
});
