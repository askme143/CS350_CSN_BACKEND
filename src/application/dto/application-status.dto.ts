import { PickType } from '@nestjs/swagger';
import { ApplicationEntity } from '../entities/application.entity';

export class ApplicationStatusDto extends PickType(ApplicationEntity, [
  'status',
]) {}
