import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MySchedule, Schedule } from '@prisma/client';
import { plainToClass, plainToInstance } from 'class-transformer';
import {
  MyScheduleCreateDto,
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleGetDto,
  ScheduleType,
} from './dto/schedule.dto';
import * as _ from 'lodash';
import { ClubService } from 'src/club/club.service';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly clubService: ClubService,
  ) {}

  async getSchedules(
    userId: string,
    { type, month }: ScheduleGetDto,
  ): Promise<_.Dictionary<Schedule[]>> {
    const clubIds = await (async () => {
      if (type == ScheduleType.JOINED)
        return await this.clubService.getJoinedClubIdList(userId);
      if (type == ScheduleType.SUBSCRIBED)
        return await this.clubService.getSubscribedClubId(userId);
      return [];
    })();

    const schedules = await Promise.all(
      _.map(clubIds, (clubId) => {
        return this.prismaService.schedule
          .findMany({
            where: { clubId: clubId, isDeleted: false },
            include: {
              author: {
                select: {
                  username: true,
                  id: true,
                },
              },
            },
          })
          .then((results) =>
            _.filter(
              results,
              (schedule) => schedule.startDttm.getMonth() + 1 == month,
            ),
          )
          .then((results) =>
            _.map(
              results,
              ({
                author: { username: authorname, id: authorId },
                ...schedule
              }) => ({
                ...schedule,
                authorname,
                isAuthor: authorId === userId,
              }),
            ),
          );
      }),
    );

    const data = _.zipObject(clubIds, schedules);
    return data;
  }

  async removeSchedule(scheduleId: string) {
    await this.prismaService.schedule.update({
      data: {
        isDeleted: true,
      },
      where: {
        id: scheduleId,
      },
    });
  }

  async getSchedule(
    userId: string,
    scheduleId: string,
  ): Promise<ScheduleDto | null> {
    const result = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId },
      include: { author: { select: { username: true, id: true } } },
    });

    if (result === null) return null;

    const {
      author: { username: authorname, id: authorId },
      ...schedule
    } = result;

    return plainToInstance(ScheduleDto, {
      ...schedule,
      authorname,
      isAuthor: authorId === userId,
    });
  }

  async createSchedule(
    jwtPayload: JwtPayloadEntity,
    createScheduleDto: ScheduleCreateDto,
  ): Promise<string> {
    const joinnedClubIds = await this.clubService.getJoinedClubIdList(
      jwtPayload.userId,
    );
    if (!joinnedClubIds.includes(createScheduleDto.clubId))
      throw new UnauthorizedException('user is not a member of given club');

    const schedule = await this.prismaService.schedule.create({
      data: createScheduleDto,
    });
    return schedule.id;
  }

  async createMySchedule(
    jwtPayload: JwtPayloadEntity,
    createMyScheduleDto: MyScheduleCreateDto,
  ): Promise<MySchedule> {
    const result = await this.prismaService.mySchedule.create({
      data: { ...createMyScheduleDto, userId: jwtPayload.userId },
    });
    return result;
  }

  async getMySchedules(userId: string): Promise<ScheduleDto[]> {
    const mySchedules = await this.prismaService.mySchedule.findMany({
      where: { userId },
      include: {
        schedule: {
          include: {
            author: {
              select: {
                username: true,
                id: true,
              },
            },
          },
        },
      },
    });

    const schedules = await Promise.all(
      _.map(mySchedules, (mySchedule) => {
        const {
          author: { username: authorname, id: authorId },
          ...schedule
        } = mySchedule.schedule;

        return plainToClass(ScheduleDto, {
          ...schedule,
          authorname,
          isAuthor: authorId === userId,
        });
      }),
    );
    return _.compact(schedules);
  }

  async removeMySchedule(userId: string, scheduleId: string) {
    await this.prismaService.mySchedule.update({
      data: {
        isDeleted: true,
      },
      where: {
        userId_scheduleId: {
          userId: userId,
          scheduleId: scheduleId,
        },
      },
    });
  }
}
