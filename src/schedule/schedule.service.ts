import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Schedule } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import {
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleType,
} from './dto/schedule.dto';
import { StorageService } from 'src/storage/storage.service';
import * as _ from 'lodash';
import { ClubService } from 'src/club/club.service';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';

export interface IGetClubListArg {
  lastClubId?: string;
  limit?: number;
}

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
    type: ScheduleType,
    month: number,
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

  async getSchedule(scheduleId: string): Promise<ScheduleDto> {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId },
    });
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
}
