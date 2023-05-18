import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  HttpCode,
  SerializeOptions,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiSecurity } from '@nestjs/swagger';
import { FileBody } from 'src/file/file.decorator';
import { JwtPayload } from 'src/auth/auth.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListDto, GetClubListEnum } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubEntity } from './entities/club.entity';

@ApiSecurity('Authorization')
@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @FileBody('image') createClubDto: CreateClubDto,
  ) {
    return this.clubService.createClub(jwtPayload.userId, createClubDto);
  }

  @Get()
  async getClubList(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() query: GetClubListDto,
  ): Promise<string[]> {
    const userId = jwtPayload.userId;

    switch (query.type) {
      case GetClubListEnum.Subscribed: {
        return this.clubService.getSubscribedClubId(userId);
      }
      case GetClubListEnum.Joined: {
        return this.clubService.getJoinedClubIdList(userId);
      }
      case GetClubListEnum.Managing: {
        return this.clubService.getManagingClubIdList(userId);
      }
      case GetClubListEnum.Starred: {
        const starredClubId = await this.clubService.findStarredClubId(userId);
        return starredClubId ? [starredClubId] : [];
      }
      case GetClubListEnum.Search: {
        return this.clubService.getClubIdList({
          lastClubId: query.lastClubId,
          limit: query.limit,
        });
      }
    }
  }

  @Get(':clubId')
  @SerializeOptions({ type: ClubEntity })
  async getClubInfo(@Param('clubId') clubId: string): Promise<ClubEntity> {
    const result = await this.clubService.findClubInfo(clubId);
    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  @Patch(':clubId')
  @SerializeOptions({ type: ClubEntity })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  updateClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId') clubId: string,
    @FileBody('image') updateClubDto: UpdateClubDto,
  ): Promise<ClubEntity> {
    return this.clubService.updateClub(
      jwtPayload.userId,
      clubId,
      updateClubDto,
    );
  }

  @Delete(':clubId')
  @HttpCode(204)
  removeClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId') clubId: string,
  ) {
    return this.clubService.removeClub(jwtPayload.userId, clubId);
  }
}
