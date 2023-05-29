import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListDto, GetClubListEnum } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubObject, PolicyService } from 'src/policy/policy.service';
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { ClubInfoDto } from './dto/club-info.dto';
import { PostService } from 'src/post/post.service';
import { GetClubPostListDto } from 'src/post/dto/get-club-post-list.dto';
import { CreatePostDto } from 'src/post/dto/create-post.dto';
import { PostInfoDto } from 'src/post/dto/post-info.dto';
import { UseFile } from 'src/custom-decorator/use-file.decorator';

@ApiSecurity('Authentication')
@ApiTags('clubs')
@Controller('clubs')
export class ClubController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly clubService: ClubService,
    private readonly postService: PostService,
  ) {}

  @Post()
  @UseFile(CreateClubDto, 'image', 'FILE')
  async createClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @FileBody(CreateClubDto, { filePropertyKey: 'image', type: 'FILE' })
    createClubDto: CreateClubDto,
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
          lastClubName: query.lastClubName,
          limit: query.limit,
        });
      }
    }
  }

  @Get(':clubId')
  async getClubInfo(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
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
  @UseFile(UpdateClubDto, 'image', 'FILE')
  async updateClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @FileBody(UpdateClubDto, { filePropertyKey: 'image', type: 'FILE' })
    updateClubDto: UpdateClubDto,
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

  @Get(':clubId/posts')
  async getClubPosts(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() queryParams: GetClubPostListDto,
  ): Promise<PostInfoDto[]> {
    return await this.postService.getClubPostList(
      jwtPayload.userId,
      queryParams,
    );
  }

  @Post(':clubId/posts')
  @UseFile(CreatePostDto, 'images', 'FILES')
  async createClubPost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @FileBody(CreatePostDto, { filePropertyKey: 'images', type: 'FILES' })
    body: CreatePostDto,
  ): Promise<PostInfoDto> {
    return await this.postService.createClubPost(jwtPayload.userId, body);
  }
}
