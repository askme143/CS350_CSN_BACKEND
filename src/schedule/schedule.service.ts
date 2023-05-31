import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MySchedule, Prisma, Schedule } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import {
  MyScheduleCreateDto,
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleGetDto,
  ScheduleType,
} from './dto/schedule.dto';
import { StorageService } from 'src/storage/storage.service';
import * as _ from 'lodash';
import { ClubService } from 'src/club/club.service';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly clubService: ClubService,
  ) {}

  private getClubImagePath(image: Express.Multer.File): string {
    return 'club/' + Date.now() + '-' + image.originalname;
  }

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
          })
          .then((results) =>
            _.filter(
              results,
              (schedule) => schedule.startDttm.getMonth() + 1 == month,
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

  async getSchedule(scheduleId: string): Promise<ScheduleDto | null> {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (schedule === null) return null;
    return plainToClass(ScheduleDto, { ...schedule });
  }

  async createSchedule(
    jwtPayload: JwtPayloadEntity,
    createScheduleDto: ScheduleCreateDto,
  ): Promise<string> {
    const images = createScheduleDto.images;

    const joinnedClubIds = await this.clubService.getJoinedClubIdList(
      jwtPayload.userId,
    );
    if (!joinnedClubIds.includes(createScheduleDto.clubId))
      throw new UnauthorizedException('user is not a member of given club');

    const imageUrls = await Promise.all(
      _.map(images, (image) =>
        this.storageService.upload(
          this.getClubImagePath(image),
          image.buffer,
          [],
          image.mimetype,
        ),
      ),
    );

    const scheduleCreate: Prisma.ScheduleCreateInput = {
      imageUrls,
      name: createScheduleDto.name,
      description: createScheduleDto.description,
      startDttm: new Date(createScheduleDto.startDttm),
      endDttm: new Date(createScheduleDto.endDttm),
      isPublic: createScheduleDto.isPublic,
      club: {
        connect: {
          id: createScheduleDto.clubId,
        },
      },
      author: {
        connect: {
          id: createScheduleDto.authorId,
        },
      },
    };

    const schedule = await this.prismaService.schedule.create({
      data: scheduleCreate,
    });
    return schedule.id;
  }

  async createMySchedule(
    jwtPayload: JwtPayloadEntity,
    createScheduleDto: MyScheduleCreateDto,
  ): Promise<MySchedule> {
    const scheduleCreate: Prisma.MyScheduleCreateInput = {
      user: {
        connect: {
          id: jwtPayload.userId,
        },
      },
      schedule: {
        connect: {
          id: createScheduleDto.scheduleId,
        },
      },
      isDeleted: false,
    };

    const result = await this.prismaService.mySchedule.create({
      data: scheduleCreate,
    });
    return result;
  }

  async getMySchedules(userId: string): Promise<ScheduleDto[]> {
    const mySchedules = await this.prismaService.mySchedule.findMany({
      where: { userId },
    });

    const schedules = await Promise.all(
      _.map(mySchedules, async (mySchedule) => {
        const schedule = this.prismaService.schedule.findUnique({
          where: { id: mySchedule.scheduleId },
        });
        return plainToClass(ScheduleDto, schedule);
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
