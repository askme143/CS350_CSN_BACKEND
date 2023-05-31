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
import { FileBody } from 'src/custom-decorator/file-body.decorator';
import { ScheduleService } from './schedule.service';
import {
  MyScheduleCreateDto,
  MyScheduleDto,
  ScheduleCreateDto,
  ScheduleDto,
  ScheduleGetDto,
} from './dto/schedule.dto';
import { plainToClass } from 'class-transformer';

@ApiSecurity('Authentication')
@Controller('schedules')
@ApiTags('schedules')
export class ScheduleController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly scheduleService: ScheduleService,
  ) {}

  @Post()
  async createSchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body()
    createScheduleDto: ScheduleCreateDto,
  ): Promise<string> {
    return await this.scheduleService.createSchedule(
      jwtPayload,
      createScheduleDto,
    );
  }

  @Post('/user')
  async createMySchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Body() createScheduleDto: MyScheduleCreateDto,
  ): Promise<MyScheduleDto> {
    const mySchedule = await this.scheduleService.createMySchedule(
      jwtPayload,
      createScheduleDto,
    );
    return plainToClass(MyScheduleDto, mySchedule);
  }

  @Get('/user')
  async getMySchedules(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
  ): Promise<ScheduleDto[]> {
    return await this.scheduleService.getMySchedules(jwtPayload.userId);
  }

  @Get('')
  async getSchedules(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Query() query: ScheduleGetDto,
  ) {
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

  @Delete('/user/:scheduleId')
  @HttpCode(204)
  async removeMySchedule(
    @JwtPayload() jwtPayload: JwtPayloadEntity,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
  ): Promise<void> {
    await this.scheduleService.removeMySchedule(jwtPayload.userId, scheduleId);
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
    await this.scheduleService.removeSchedule(scheduleId);
  }
}
