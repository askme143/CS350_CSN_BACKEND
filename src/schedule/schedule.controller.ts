import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  UseInterceptors,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiSecurity } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { ClubObject, PolicyService } from 'src/policy/policy.service';
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleType,
} from './dto/schedule.dto';

@ApiSecurity('Authentication')
@Controller('schedules')
export class ScheduleController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly scheduleService: ScheduleService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @FileBody('image') createScheduleDto: ScheduleCreateDto,
  ): Promise<string> {
    return await this.scheduleService.createSchedule(
      jwtPayload,
      createScheduleDto,
    );
  }

  @Get('')
  async getSchedules(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query('type') type: ScheduleType,
    @Query('month') month: number,
  ) {
    const result = await this.scheduleService.getSchedules(
      jwtPayload.userId,
      type,
      month,
    );
    if (result === null) {
      throw new NotFoundException();
    } else {
      return { scheduleData: result };
    }
  }

  @Get(':scheduleId')
  async getSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('scheduleId', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<ScheduleDto> {
    const result = await this.scheduleService.getSchedule(scheduleId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  @Delete(':scheduleId')
  @HttpCode(204)
  async removeSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ): Promise<void> {
    const schedule = await this.scheduleService.getSchedule(scheduleId);
    if (schedule === null || schedule == undefined)
      throw new NotFoundException();
    await this.policyService
      .user(jwtPayload.userId)
      .shouldBeAbleTo('Delete', new ClubObject(schedule.clubId));
    await this.scheduleService.removeSchedule(scheduleId);
  }
}
