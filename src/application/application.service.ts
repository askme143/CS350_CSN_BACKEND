import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApplicationEntity } from './entities/application.entity';

@Injectable()
export class ApplicationService {
  constructor(private readonly prismaService: PrismaService) {}
  async createApplication(userId: string, clubId: string) {
    const isUserMember = await this.prismaService.member.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });
    if (isUserMember) return null;

    const pendingApplication = await this.findPendingApplication(
      userId,
      clubId,
    );
    if (pendingApplication) return null;

    const newApplication = await this.prismaService.application.create({
      data: {
        applicantId: userId,
        clubId,
      },
    });

    return plainToInstance(ApplicationEntity, newApplication);
  }

  async getApplicationListOfUser(userId: string): Promise<ApplicationEntity[]> {
    const result: ApplicationEntity[] =
      await this.prismaService.application.findMany({
        where: {
          applicantId: userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

    return plainToInstance(ApplicationEntity, result);
  }

  async getPendingApplicationListForClub(
    clubId: string,
  ): Promise<ApplicationEntity[]> {
    const result: ApplicationEntity[] =
      await this.prismaService.application.findMany({
        where: {
          clubId,
          status: 'PENDING',
        },
        orderBy: {
          updatedAt: 'asc',
        },
      });

    return plainToInstance(ApplicationEntity, result);
  }

  async findPendingApplication(
    applicantId: string,
    clubId: string,
  ): Promise<ApplicationEntity | null> {
    const result = await this.prismaService.application.findFirst({
      where: {
        applicantId,
        clubId,
        status: 'PENDING',
      },
    });

    return result ? plainToInstance(ApplicationEntity, result) : null;
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<ApplicationEntity | null> {
    const application = await this.prismaService.application.findFirst({
      where: {
        id: applicationId,
        status: 'PENDING',
      },
    });
    if (application === null) return null;

    const result = await this.prismaService.application.update({
      where: {
        id: applicationId,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return plainToInstance(ApplicationEntity, result);
  }

  async rejectAllPendingApplications(clubId: string): Promise<void> {
    await this.prismaService.application.updateMany({
      data: {
        status: 'REJECTED',
        updatedAt: new Date(),
      },
      where: {
        clubId,
        status: 'PENDING',
      },
    });
  }
}
