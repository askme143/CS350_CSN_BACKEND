import { PrismaService } from 'src/prisma/prisma.service';
import { AdminAction, TrivialAction } from './policy.service';

export class CreateClub extends TrivialAction {}
export class ReadClub extends TrivialAction {}
export class UpdateClub extends AdminAction {}
export class DeleteClub extends AdminAction {}
