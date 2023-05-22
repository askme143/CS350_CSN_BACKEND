import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private async findUserByKakaoId(kakaoId: number): Promise<UserEntity | null> {
    const user = await this.prismaService.kakaoUser.findUnique({
      where: { kakaoId },
      select: { user: true },
    });

    return user?.user ?? null;
  }

  private async createUserByKakaoId(
    kakaoId: number,
    username: string,
  ): Promise<UserEntity> {
    return await this.prismaService.user.create({
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

  async findUserById(id: string): Promise<UserEntity | null> {
    return await this.prismaService.user.findUnique({ where: { id } });
  }
}
