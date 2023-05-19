import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateClubDto } from './dto/update-club.dto';
import { Prisma } from '@prisma/client';
import { CreateClubDto } from './dto/create-club.dto';
import { StorageService } from 'src/storage/storage.service';
import { ClubEntity } from './entities/club.entity';
import { plainToClass } from 'class-transformer';

export interface IGetClubListArg {
  lastClubId?: string;
  limit?: number;
}

@Injectable()
export class ClubService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getResultLimit(limit?: number): number {
    return limit && limit > 0 && limit <= 30 ? limit : 30;
  }

  private getClubImagePath(image: Express.Multer.File): string {
    return 'club/' + Date.now() + '-' + image.originalname;
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

  async findStarredClubId(userId: string): Promise<string | undefined> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        starredClub: {
          select: {
            id: true,
          },
        },
      },
    });

    return user?.starredClub?.id ?? undefined;
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
    return clubIdList.map((member) => member.clubId);
  }

  async getClubIdList({ lastClubId, limit }: IGetClubListArg) {
    const resultLimit = this.getResultLimit(limit);

    const clubList = lastClubId
      ? await this.prismaService.club.findMany({
          cursor: { id: lastClubId },
          skip: 1,
          take: resultLimit,
          where: {
            isDeleted: false,
          },
          orderBy: {
            clubname: 'asc',
          },
          select: { id: true },
        })
      : await this.prismaService.club.findMany({
          take: resultLimit,
          where: {
            isDeleted: false,
          },
          orderBy: { clubname: 'asc' },
          select: { id: true },
        });

    return clubList.map((club) => club.id);
  }

  async findClubInfo(clubId: string): Promise<ClubEntity | null> {
    const clubEntity = await this.prismaService.club.findUnique({
      where: { id: clubId },
    });
    return clubEntity ? plainToClass(ClubEntity, clubEntity) : null;
  }

  async updateClub(
    clubId: string,
    updateClubDto: UpdateClubDto,
  ): Promise<ClubEntity> {
    const image = updateClubDto.image;
    const imageUrl = image
      ? await this.storageService.upload(
          this.getClubImagePath(image),
          image.buffer,
          [],
          image.mimetype,
        )
      : undefined;

    const clubInfo = await this.prismaService.club.update({
      where: { id: clubId },
      data: {
        clubname: updateClubDto.clubname,
        description: updateClubDto.description,
        canApply: updateClubDto.canApply,
        imageUrl,
      },
    });

    return plainToClass(ClubEntity, clubInfo);
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
