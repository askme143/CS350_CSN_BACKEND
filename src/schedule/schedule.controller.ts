import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  HttpCode,
  NotFoundException,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/jwt-payload.decorator';
import { JwtPayloadEntity } from 'src/auth/entities/jwt-payload.entity';
import { PolicyService } from 'src/policy/policy.service';
import { ScheduleService } from './schedule.service';
import {
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleGetDto,
} from './dto/schedule.dto';

@ApiSecurity('Authentication')
@Controller('schedules')
@ApiTags('schedules')
export class ScheduleController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly scheduleService: ScheduleService,
  ) {}

  /**
   * Create a schedule to the club
   */
  @Post()
  async createSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body()
    createScheduleDto: ScheduleCreateDto,
  ): Promise<string> {
    // todo: policy
    return await this.scheduleService.createSchedule(
      jwtPayload,
      createScheduleDto,
    );
  }

  /**
   * Get schedules
   */
  @Get('')
  async getSchedules(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() query: ScheduleGetDto,
  ) {
    // todo: policy
    const result = await this.scheduleService.getSchedules(
      jwtPayload.userId,
      query,
    );
    if (result === null) {
      throw new NotFoundException();
    } else {
      return { scheduleData: result };
    }
  }

  /**
   * Get schedule
   */
  @Get(':scheduleId')
  async getSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('scheduleId', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<ScheduleDto> {
    // todo: policy
    const result = await this.scheduleService.getSchedule(scheduleId);

    if (result === null) {
      throw new NotFoundException();
    } else {
      return result;
    }
  }

  /**
   * Delete schedule.
   */
  @Delete(':scheduleId')
  @HttpCode(204)
  async removeSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ): Promise<void> {
    // todo: policy
    const schedule = await this.scheduleService.getSchedule(scheduleId);
    if (schedule === null || schedule == undefined)
      throw new NotFoundException();
    await this.scheduleService.removeSchedule(scheduleId);
  }
}
