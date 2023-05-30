import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApplicationService } from './application.service';

@Module({
  imports: [PrismaModule],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
