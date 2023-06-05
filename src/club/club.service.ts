import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateClubDto } from './dto/update-club.dto';
import { Prisma } from '@prisma/client';
import { CreateClubDto } from './dto/create-club.dto';
import { ClubEntity } from './entities/club.entity';
import { ClubInfoDto } from './dto/club-info.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ApplicationService } from 'src/application/application.service';
import _ from 'lodash';
import { MemberDto } from './dto/member.dto';

export interface IGetClubListArg {
  lastClubName?: string;
  limit?: number;
}

@Injectable()
export class ClubService {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly prismaService: PrismaService,
  ) {}

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
  }

  private async makeClubInfoDtoFromClubEntity(
    userId: string,
    clubEntity: ClubEntity,
  ): Promise<ClubInfoDto> {
    const clubId = clubEntity.id;
    const memberCount = await this.prismaService.member.count({
      where: { clubId, isDeleted: false },
    });
    const isAdmin =
      (await this.prismaService.member.findFirst({
        where: {
          userId,
          clubId,
          isAdmin: true,
          isDeleted: false,
        },
      })) !== null;
    const subscribed =
      (await this.prismaService.subscription.findFirst({
        where: {
          userId,
          clubId,
        },
      })) !== null;

    return plainToClass(ClubInfoDto, {
      ...clubEntity,
      isAdmin,
      memberCount,
      subscribed,
    });
  }

  async createClub(
    userId: string,
    createClubDto: CreateClubDto,
  ): Promise<string> {
    const clubCreate: Prisma.ClubCreateInput = {
      ...createClubDto,
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

  async findClubInfo(
    userId: string,
    clubId: string,
  ): Promise<ClubInfoDto | null> {
    const clubEntity: ClubEntity | null =
      await this.prismaService.club.findUnique({
        where: { id: clubId },
      });

    if (clubEntity === null) return null;
    return this.makeClubInfoDtoFromClubEntity(userId, clubEntity);
  }

  async updateClub(
    userId: string,
    clubId: string,
    updateClubDto: UpdateClubDto,
  ): Promise<ClubInfoDto> {
    const clubEntity = await this.prismaService.club.update({
      where: { id: clubId },
      data: {
        ...updateClubDto,
      },
    });

    if (updateClubDto.canApply === false)
      await this.applicationService.rejectAllPendingApplications(clubId);

    return this.makeClubInfoDtoFromClubEntity(userId, clubEntity);
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

  /// Member

  async getMemberIdList(clubId: string): Promise<string[]> {
    const result = await this.prismaService.member.findMany({
      where: {
        clubId,
        isDeleted: false,
      },
      select: {
        userId: true,
      },
    });

    return result.map((item) => item.userId);
  }

  async getMembers(clubId: string): Promise<MemberDto[]> {
    const result = await this.prismaService.member.findMany({
      where: {
        clubId,
        isDeleted: false,
      },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    const memberDtoList: MemberDto[] = result.map(
      ({ user: { username }, ...membership }) => ({ ...membership, username }),
    );

    return plainToInstance(MemberDto, memberDtoList);
  }

  async updateUserPrivilege(
    userId: string,
    clubId: string,
    adminPrivilege: boolean,
  ) {
    await this.prismaService.member.update({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
      data: {
        isAdmin: adminPrivilege,
      },
    });
  }

  async kickMember(userId: string, clubId: string) {
    await this.prismaService.member.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });
  }
}
