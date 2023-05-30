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
import { UserService } from './user.service';

@ApiSecurity('Authentication')
@ApiTags('user')
@Controller('/user')
export class UserController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly clubService: ClubService,
    private readonly userService: UserService,
  ) {}

  @Delete()
  async deleteAccount(@JwtPayload() jwtPayload: JwtPayloadEntity) {
    //todo : policy
    this.userService.deleteUser(jwtPayload.userId);
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
    //todo : policy
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
    //todo : policy
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
    //todo : policy
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
    //todo : policy
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
    //todo : policy
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
    // todo: check policy
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
    // todo: check policy
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
    // todo: check policy
    const result = await this.applicationService.updateApplicationStatus(
      applicationId,
      'CANCELED',
    );

    if (result === null) throw new ForbiddenException();
    return result;
  }
}
