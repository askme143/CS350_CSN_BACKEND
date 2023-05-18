import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private async findUserByKakaoId(
    kakaoId: number,
  ): Promise<UserEntity | undefined> {
    const user = await this.prismaService.kakaoUser.findUnique({
      where: { kakaoId },
      select: { user: true },
    });

    return user?.user;
  }

  private async createUserByKakaoId(
    kakaoId: number,
    username: string,
  ): Promise<UserEntity> {
    return this.prismaService.user.create({
      data: { username, kakaoUser: { create: { kakaoId } } },
    });
  }

  async findOrCreateUserByKakaoId(
    kakaoId: number,
    username: string,
  ): Promise<UserEntity> {
    const user =
      (await this.findUserByKakaoId(kakaoId)) ||
      (await this.createUserByKakaoId(kakaoId, username));

    return user;
  }

  async findUserById(id: string): Promise<UserEntity | undefined> {
    return (
      (await this.prismaService.user.findUnique({ where: { id } })) ?? undefined
    );
  }
}
