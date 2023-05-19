import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PolicyService } from './policy.service';

@Module({
  providers: [PolicyService, PrismaService],
  exports: [PolicyService],
})
export class PolicyModule {}
