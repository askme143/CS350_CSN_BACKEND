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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiSecurity } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListDto, GetClubListEnum } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubEntity } from './entities/club.entity';
import { ClubObject, PolicyService } from 'src/policy/policy.service';
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { ClubInfoDto } from './dto/club-info.dto';

@ApiSecurity('Authentication')
@Controller('clubs')
export class ClubController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly clubService: ClubService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @FileBody('image') createClubDto: CreateClubDto,
  ): Promise<string> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo('Create', new ClubObject());

    return await this.clubService.createClub(jwtPayload.userId, createClubDto);
  }

  @Get()
  async getClubList(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() query: GetClubListDto,
  ): Promise<string[]> {
    const userId = jwtPayload.userId;

    await this.policyService
      .user(userId)
      .shouldBeAbleTo('Read', new ClubObject());

    switch (query.type) {
      case GetClubListEnum.Subscribed: {
        return await this.clubService.getSubscribedClubId(userId);
      }
      case GetClubListEnum.Joined: {
        return await this.clubService.getJoinedClubIdList(userId);
      }
      case GetClubListEnum.Managing: {
        return await this.clubService.getManagingClubIdList(userId);
      }
      case GetClubListEnum.Starred: {
        const starredClubId = await this.clubService.findStarredClubId(userId);
        return starredClubId ? [starredClubId] : [];
      }
      case GetClubListEnum.Search: {
        return await this.clubService.getClubIdList({
          lastClubId: query.lastClubId,
          limit: query.limit,
        });
      }
    }
  }

  @Get(':clubId')
  @SerializeOptions({ type: ClubEntity })
  async getClubInfo(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId') clubId: string,
  ): Promise<ClubInfoDto> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo('Read', new ClubObject(clubId));

    const result = await this.clubService.findClubInfo(clubId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  @Patch(':clubId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async updateClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @FileBody('image') updateClubDto: UpdateClubDto,
  ): Promise<ClubInfoDto> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo('Update', new ClubObject(clubId));

    return await this.clubService.updateClub(clubId, updateClubDto);
  }

  @Delete(':clubId')
  @HttpCode(204)
  async removeClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo('Delete', new ClubObject(clubId));

    await this.clubService.removeClub(clubId);
  }
}
