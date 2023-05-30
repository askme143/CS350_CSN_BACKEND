import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApplicationService } from 'src/application/application.service';
import { CreateApplicationDto } from 'src/application/dto/create-application.dto';
import { ApplicationEntity } from 'src/application/entities/application.entity';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';

@Controller('/user')
export class UserController {
  constructor(private readonly applicationService: ApplicationService) {}

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
