import { Test } from '@nestjs/testing';
import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ClubService } from './club.service';

describe('ClubService', () => {
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ClubService],
    })
      .useMocker((token) => {
        switch (token) {
          case PrismaService:
            return mockDeep<PrismaService>();
          case StorageService:
            return mockDeep<StorageService>();
        }
      })
      .compile();
  });
  it('always true', () => {});
});
