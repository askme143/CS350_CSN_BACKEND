import { Application, ApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsUUID } from 'class-validator';

export class ApplicationEntity implements Application {
  @IsUUID()
  id: string;

  @IsUUID()
  applicantId: string;

  @IsUUID()
  clubId: string;

  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
