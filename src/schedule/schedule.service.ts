import { ConsoleLogger, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Schedule } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { ScheduleCreateDto, ScheduleDto, ScheduleType } from './dto/schedule.dto';
import { StorageService } from 'src/storage/storage.service';
import * as _ from "lodash";
import { ClubService } from 'src/club/club.service';

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

  async getSchedules(userId: string, type: ScheduleType, month: Number): Promise<_.Dictionary<Schedule[]>> {
    // fix: 가입한 클럽 불러오는게 잘 안됨. 멤버로 가입하는 부분 코드가 생성되면 다시 해보고 수정하기
    // const clubIds = type == ScheduleType.JOINED ? await this.clubService.getJoinedClubIdList(userId): await this.clubService.getSubscribedClubId(userId);
    const clubIds = ["95d03f33-ce2b-4c36-9fe5-2a6d050f49ae", "95d03f31-ce2b-4c36-9fe5-2a6d050f49ae", "95d03f32-ce2b-4c36-9fe5-2a6d050f49ae", "95d03f35-ce2b-4c36-9fe5-2a6d050f49ae"]
    
    const schedules = await Promise.all(_.map(clubIds, (clubId)=> {
      return this.prismaService.schedule.findMany({
        where: {clubId: clubId, isDeleted: false}
      }).then(results => _.filter(results, (schedule) => schedule.startDttm.getMonth() + 1 == month));
    }))

    const data = _.zipObject(clubIds, schedules);
    return data
  }

  async removeSchedule(scheduleId: string) {
    await this.prismaService.schedule.update({
      data: {
        isDeleted: true
      },
      where: {
        id: scheduleId
      }
    });
  }

  async getSchedule(scheduleId: string): Promise<ScheduleDto> {
    const schedule = await this.prismaService.schedule.findUnique({
      where: { id: scheduleId }});
    return plainToClass(ScheduleDto, { ...schedule })
  }

  async createSchedule(createScheduleDto: ScheduleCreateDto): Promise<string> {
    const images = createScheduleDto.images;

    // fix: 일단은 자신이 속한 클럽에 대한 스케쥴만 생성할 수 있도록 해야할듯. 
    // 지금 joinedClub 불러오는 부분이 잘 작동안하는데 확인해보고 수정하기 

    // fix: 지금 구글 스토리지서버가 꺼져있어서 동작 안하는듯 함. 나중에 켜지면 다시 추가해두기
    // const imageUrls = await Promise.all(_.map(images, image => this.storageService.upload(
    //     this.getClubImagePath(image),
    //     image.buffer,
    //     [],
    //     image.mimetype,
    // )));

    console.log("debug", createScheduleDto);
    const scheduleCreate: Prisma.ScheduleCreateInput = {
        // fix: 구글 스토리지 켤때까지 잠시 빼두기
        // imageUrls,
        name: createScheduleDto.name,
        description: createScheduleDto.description,
        startDttm: new Date(createScheduleDto.startDttm),
        endDttm: new Date(createScheduleDto.endDttm),
        isPublic: createScheduleDto.isPublic,
        club: {
            connect: {
                id: createScheduleDto.clubId
            }
        },
        author: {
            connect: {
                id: createScheduleDto.authorId
            }
        }
    }

    const schedule = await this.prismaService.schedule.create({ data: scheduleCreate});
    return schedule.id;
  }
}


