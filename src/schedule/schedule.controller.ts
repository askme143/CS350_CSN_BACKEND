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
import { ScheduleCreateDto, ScheduleDto, ScheduleType } from './dto/schedule.dto';
  
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
      return await this.scheduleService.createSchedule(createScheduleDto);
    }

    @Get('')
    async getSchedules(
      @JwtPayload() jwtPayload: JwtPayloadEntity,
      // fix: 토큰에서 userId 뽑아오면 되는데 현재 토큰이 테스트용이라 안됨. 추후 수정하기
      @Query('userId', new ParseUUIDPipe()) userId: string,
      @Query('type') type: ScheduleType,
      @Query('month') month: Number,
    ) {
      const result = await this.scheduleService.getSchedules(userId, type, month);
      if (result === null) {
        throw new NotFoundException();
      } else {
        return {scheduleData: result};
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
    async removeClub(
      @JwtPayload() jwtPayload: JwtPayloadEntity,
      @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    ): Promise<void> {

      const schedule = await this.scheduleService.getSchedule(scheduleId);
      // fix: 현재는 테스트 토큰쓰고 있어서 잘 작동안함. 나중에 수정하기
      // await this.policyService
      //   .user(jwtPayload.userId)
      //   .shouldBeAbleTo('Delete', new ClubObject(schedule.clubId));
      await this.scheduleService.removeSchedule(scheduleId);
    }    
  }
  