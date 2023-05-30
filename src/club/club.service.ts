import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateClubDto } from './dto/update-club.dto';
import { Prisma } from '@prisma/client';
import { CreateClubDto } from './dto/create-club.dto';
import { StorageService } from 'src/storage/storage.service';
import { ClubEntity } from './entities/club.entity';
import { ClubInfoDto } from './dto/club-info.dto';
import { plainToClass } from 'class-transformer';
import { ApplicationService } from 'src/application/application.service';

export interface IGetClubListArg {
  lastClubName?: string;
  limit?: number;
}

@Injectable()
export class ClubService {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
  }

  private getClubImagePath(image: Express.Multer.File): string {
    return 'club/' + Date.now() + '-' + image.originalname;
  }

  private async makeClubInfoDtoFromClubEntity(
    clubEntity: ClubEntity,
  ): Promise<ClubInfoDto> {
    const clubId = clubEntity.id;
    const memberCount = await this.prismaService.member.count({
      where: { clubId, isDeleted: false },
    });
    const adminIds = (
      await this.prismaService.member.findMany({
        where: {
          clubId,
          isAdmin: true,
          isDeleted: false,
        },
        select: {
          userId: true,
        },
      })
    ).map(({ userId }) => userId);

    return plainToClass(ClubInfoDto, { ...clubEntity, adminIds, memberCount });
  }

  async createClub(
    userId: string,
    createClubDto: CreateClubDto,
  ): Promise<string> {
    const image = createClubDto.image;
    const imageUrl = await this.storageService.upload(
      this.getClubImagePath(image),
      image.buffer,
      [],
      image.mimetype,
    );

    const clubCreate: Prisma.ClubCreateInput = {
      imageUrl,
      clubname: createClubDto.clubname,
      description: createClubDto.description,
      canApply: false,
      memberships: {
        create: {
          userId,
          isAdmin: true,
        },
      },
    };

    const club = await this.prismaService.club.create({ data: clubCreate });
    return club.id;
  }

  async createSubscription(userId: string, clubId: string): Promise<void> {
    await this.prismaService.subscription.upsert({
      create: {
        clubId,
        userId,
      },
      update: {
        isDeleted: false,
      },
      where: {
        userId_clubId: {
          clubId,
          userId,
        },
      },
    });
  }

  async deleteSubscription(userId: string, clubId: string): Promise<void> {
    await this.prismaService.subscription.update({
      where: {
        userId_clubId: {
          clubId,
          userId,
        },
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async findStarredClubId(userId: string): Promise<string | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        starredClubId: true,
      },
    });

    return user?.starredClubId ?? null;
  }

  async getSubscribedClubId(userId: string) {
    const clubIdList = await this.prismaService.subscription.findMany({
      where: {
        userId,
        isDeleted: false,
      },
    });
    return clubIdList.map((subs) => subs.clubId);
  }

  async getJoinedClubIdList(userId: string) {
    const clubIdList = await this.prismaService.member.findMany({
      where: {
        userId: userId,
        isDeleted: false,
      },
    });
    return clubIdList.map((member) => member.clubId);
  }

  async getManagingClubIdList(userId: string) {
    const clubIdList = await this.prismaService.member.findMany({
      where: {
        userId: userId,
        isAdmin: true,
        isDeleted: false,
      },
    });
    const result = clubIdList.map((member) => member.clubId);
    return result;
  }

  async getClubIdList({ lastClubName, limit }: IGetClubListArg) {
    const resultLimit = this.getResultLimit(limit);

    const clubList = await this.prismaService.club.findMany({
      ...(lastClubName
        ? {
            cursor: {
              clubname: lastClubName,
            },
            skip: 1,
          }
        : {}),
      take: resultLimit,
      where: {
        isDeleted: false,
      },
      orderBy: {
        clubname: 'asc',
      },
      select: { id: true },
    });

    return clubList.map((club) => club.id);
  }

  async findClubInfo(clubId: string): Promise<ClubInfoDto | null> {
    const clubEntity: ClubEntity | null =
      await this.prismaService.club.findUnique({
        where: { id: clubId },
      });

    if (clubEntity === null) return null;
    return this.makeClubInfoDtoFromClubEntity(clubEntity);
  }

  async updateClub(
    clubId: string,
    updateClubDto: UpdateClubDto,
  ): Promise<ClubInfoDto> {
    const { image, ...data } = updateClubDto;
    const imageUrl = image
      ? await this.storageService.upload(
          this.getClubImagePath(image),
          image.buffer,
          [],
          image.mimetype,
        )
      : undefined;

    const clubEntity = await this.prismaService.club.update({
      where: { id: clubId },
      data: {
        ...data,
        imageUrl,
      },
    });

    if (data.canApply === false)
      await this.applicationService.rejectAllPendingApplications(clubId);

    return this.makeClubInfoDtoFromClubEntity(clubEntity);
  }

  async removeClub(clubId: string): Promise<void> {
    const cascadeUpdateArg = {
      updateMany: {
        where: {
          clubId,
        },
        data: {
          isDeleted: true,
        },
      },
    };

    await this.prismaService.club.update({
      where: {
        id: clubId,
      },

      data: {
        isDeleted: true,
        memberships: cascadeUpdateArg,
        subscriptions: cascadeUpdateArg,
        clubPosts: cascadeUpdateArg,
        clubSchedules: cascadeUpdateArg,
        applications: cascadeUpdateArg,
      },
    });
  }
}
