import { PickType } from '@nestjs/swagger';
import { ApplicationEntity } from '../entities/application.entity';

export class CreateApplicationDto extends PickType(ApplicationEntity, [
  'clubId',
]) {}
