import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

class PolicyObject {}

type Action = 'Create' | 'Read' | 'Update' | 'Delete';

export class ClubObject extends PolicyObject {
  constructor(readonly clubId?: string) {
    super();
  }
}

export interface IPolicyCanArg {
  userId: string;
  action: Action;
  object: PolicyObject;
}

@Injectable()
export class PolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  user = (userId: string) => {
    return {
      shouldBeAbleTo: async (action: Action, object: PolicyObject) => {
        const can = await this.can({ userId, action, object });
        if (!can) throw new ForbiddenException();
      },
    };
  };

  private async can({
    userId,
    action,
    object,
  }: IPolicyCanArg): Promise<boolean> {
    if (object instanceof ClubObject) {
      return await this.clubCan(userId, action, object);
    }

    return false;
  }

  private async clubCan(
    userId: string,
    action: Action,
    clubObject: ClubObject,
  ): Promise<boolean> {
    const isAdmin = async () => {
      if (clubObject.clubId === undefined) return false;

      const adminMembership = await this.prismaService.member.findFirst({
        where: {
          userId,
          clubId: clubObject.clubId,
          isAdmin: true,
          isDeleted: false,
        },
      });

      return adminMembership !== null;
    };

    switch (action) {
      case 'Create':
        return true;
      case 'Read':
        return true;
      case 'Update':
        return await isAdmin();
      case 'Delete':
        return await isAdmin();
    }
  }
}
