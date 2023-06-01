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
  Body,
  ForbiddenException,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { GetClubListDto } from './dto/get-club-list.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { PolicyService } from 'src/policy/policy.service';
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { ClubInfoDto } from './dto/club-info.dto';
import { PostService } from 'src/post/post.service';
import { GetClubPostListDto } from 'src/post/dto/get-club-post-list.dto';
import { CreatePostDto } from 'src/post/dto/create-post.dto';
import { PostInfoDto } from 'src/post/dto/post-info.dto';
import { UseFile } from 'src/custom-decorator/use-file.decorator';
import {
  CreateClub,
  DecideApplication,
  DeleteClub,
  KickMember,
  ReadApplication,
  ReadClub,
  ReadMemberInfo,
  UpdateClub,
  UpdateMemberPrivilege,
} from 'src/policy/club-policy';
import { CreateClubPost, ReadClubPost } from 'src/policy/post-policy';
import { ApplicationService } from 'src/application/application.service';
import { ApplicationStatusDto } from 'src/application/dto/application-status.dto';
import { ApplicationEntity } from 'src/application/entities/application.entity';

@ApiSecurity('Authentication')
@ApiTags('clubs')
@Controller('clubs')
export class ClubController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly clubService: ClubService,
    private readonly postService: PostService,
    private readonly applicationService: ApplicationService,
  ) {}

  @Post()
  async createClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body()
    createClubDto: CreateClubDto,
  ): Promise<string> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new CreateClub());

    return await this.clubService.createClub(jwtPayload.userId, createClubDto);
  }

  @Get()
  async getClubList(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() query: GetClubListDto,
  ): Promise<string[]> {
    const userId = jwtPayload.userId;
    await this.policyService.user(userId).shouldBeAbleTo(new ReadClub());

    return await this.clubService.getClubIdList({
      lastClubName: query.lastClubName,
      limit: query.limit,
    });
  }

  @Get(':clubId')
  async getClubInfo(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
  ): Promise<ClubInfoDto> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadClub());

    const result = await this.clubService.findClubInfo(clubId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  @Patch(':clubId')
  async updateClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body()
    updateClubDto: UpdateClubDto,
  ): Promise<ClubInfoDto> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new UpdateClub(clubId));

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
      .shouldBeAbleTo(new DeleteClub(clubId));

    await this.clubService.removeClub(clubId);
  }

  /// Posts

  @Get(':clubId/posts')
  async getClubPosts(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Query() queryParams: GetClubPostListDto,
  ): Promise<PostInfoDto[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadClubPost());

    return await this.postService.getClubPostList(
      jwtPayload.userId,
      clubId,
      queryParams,
    );
  }

  @Post(':clubId/posts')
  async createClubPost(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body()
    body: CreatePostDto,
  ): Promise<PostInfoDto> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(
        new CreateClubPost(clubId, body.isPublic ? 'PUBLIC' : 'INTERNAL'),
      );

    return await this.postService.createClubPost(
      jwtPayload.userId,
      clubId,
      body,
    );
  }

  /// Applications

  /**
   * Get pending applications from users for the club
   **/
  @Get(':clubId/application')
  async getPendingApplicationListForClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId') clubId: string,
  ): Promise<ApplicationEntity[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadApplication(clubId));

    return await this.applicationService.getPendingApplicationListForClub(
      clubId,
    );
  }

  /**
   * Decide to approve or reject the application
   **/
  @Patch(':clubId/application/:applicationId')
  async decideApplication(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body() { status }: ApplicationStatusDto,
  ): Promise<ApplicationEntity> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new DecideApplication(clubId));

    const result = await this.applicationService.updateApplicationStatus(
      applicationId,
      status,
    );

    if (result === null) throw new ForbiddenException();
    return result;
  }

  /// Club Settings

  @Get(':clubId/members')
  async getMembers(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('clubId', ParseUUIDPipe) clubId: string,
  ): Promise<string[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadMemberInfo(clubId));

    return await this.clubService.getMemberIdList(clubId);
  }

  @Patch(':clubId/members/:userId')
  async updateUserPrivilege(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body('adminPrivilege', ParseBoolPipe) adminPrivilege: boolean,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new UpdateMemberPrivilege(clubId));

    await this.clubService.updateUserPrivilege(userId, clubId, adminPrivilege);
  }

  @Delete(':clubId/members/:userId')
  async kickMember(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('clubId', ParseUUIDPipe) clubId: string,
  ) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new KickMember(clubId));

    await this.clubService.kickMember(userId, clubId);
  }
}
