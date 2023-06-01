import { PrismaService } from 'src/prisma/prisma.service';
import { Action, SelfAction } from './policy.service';

export class DeleteAccount extends SelfAction {}
export class ReadUserInfo extends SelfAction {}
export class UpdateUserInfo extends SelfAction {}

export class SubscribeOrUnsubscribe implements Action {
  constructor(
    private readonly clubId: string,
    private readonly type: 'SUBSCRIBE' | 'UNSUBSCRIBE',
  ) {}

  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    const subscribe = await prismaService.subscription.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId: this.clubId,
        },
      },
    });

    return subscribe !== null
      ? this.type === 'UNSUBSCRIBE'
      : this.type === 'SUBSCRIBE';
  }
}

export class Apply implements Action {
  constructor(private readonly clubId: string) {}
  async can(userId: string, prismaService: PrismaService): Promise<boolean> {
    const membership = await prismaService.member.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId: this.clubId,
        },
      },
    });

    return membership === null;
  }
}
