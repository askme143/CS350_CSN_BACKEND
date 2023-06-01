import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApplicationService } from 'src/application/application.service';
import { CreateApplicationDto } from 'src/application/dto/create-application.dto';
import { ApplicationEntity } from 'src/application/entities/application.entity';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { ClubService } from 'src/club/club.service';
import { PolicyService } from 'src/policy/policy.service';
import {
  Apply,
  DeleteAccount,
  ReadUserInfo,
  SubscribeOrUnsubscribe,
  UpdateUserInfo,
} from 'src/policy/user-policy';
import { UserService } from './user.service';

@ApiSecurity('Authentication')
@ApiTags('user')
@Controller('/user')
export class UserController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly applicationService: ApplicationService,
    private readonly clubService: ClubService,
    private readonly userService: UserService,
  ) {}

  @Delete()
  async deleteAccount(@JwtPayload() jwtPayload: JwtPayloadEntity) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new DeleteAccount(jwtPayload.userId));

    await this.userService.deleteUser(jwtPayload.userId);
  }

  /**
   * Get joined club ids of user.
   * If `onlyManaging` is true, return only ids of clubs of which the user is an admin
   */
  @Get('clubs')
  async getJoinedClubs(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query('onlyManaging', ParseBoolPipe) onlyManaging: boolean,
  ): Promise<string[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadUserInfo(jwtPayload.userId));

    return onlyManaging
      ? await this.clubService.getManagingClubIdList(jwtPayload.userId)
      : await this.clubService.getJoinedClubIdList(jwtPayload.userId);
  }

  /**
   * Get starred club id of user. 404 if there is no starred club of a user
   */
  @Get('starred-club')
  async getStarredClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
  ): Promise<string> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadUserInfo(jwtPayload.userId));

    const result = await this.clubService.findStarredClubId(jwtPayload.userId);

    if (result === null) throw new NotFoundException();
    return result;
  }

  /**
   * Get subscribed club ids of user.
   */
  @Get('subscriptions')
  async getSubscriptions(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
  ): Promise<string[]> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadUserInfo(jwtPayload.userId));

    return await this.clubService.getSubscribedClubId(jwtPayload.userId);
  }

  /**
   * Subscribe a club
   */
  @Post('subscriptions')
  @HttpCode(201)
  async subscribeClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body('clubId', ParseUUIDPipe) clubId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new SubscribeOrUnsubscribe(clubId, 'SUBSCRIBE'));

    await this.clubService.createSubscription(jwtPayload.userId, clubId);
  }

  /**
   * Unsubscribe a club
   */
  @Delete('subscriptions')
  @HttpCode(204)
  async unsubscribeClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body('clubId', ParseUUIDPipe) clubId: string,
  ): Promise<void> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new SubscribeOrUnsubscribe(clubId, 'UNSUBSCRIBE'));

    await this.clubService.createSubscription(jwtPayload.userId, clubId);
  }

  /**
   * Make application for the club
   */
  @Post('applications')
  async applyForClub(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body() { clubId }: CreateApplicationDto,
  ): Promise<ApplicationEntity> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new Apply(clubId));

    const result = await this.applicationService.createApplication(
      jwtPayload.userId,
      clubId,
    );

    if (result === null) throw new ForbiddenException();
    return result;
  }

  /**
   * Read user's applications
   */
  @Get('applications')
  async getApplicationListOfUser(@JwtPayload() jwtPayload: JwtPayloadEntity) {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new ReadUserInfo(jwtPayload.userId));

    return await this.applicationService.getApplicationListOfUser(
      jwtPayload.userId,
    );
  }

  /**
   * Cancel user's applications
   */
  @Delete('applications/:applicationId')
  async cancelApplication(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationEntity> {
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo(new UpdateUserInfo(jwtPayload.userId));

    const result = await this.applicationService.updateApplicationStatus(
      applicationId,
      'CANCELED',
    );

    if (result === null) throw new ForbiddenException();
    return result;
  }
}
