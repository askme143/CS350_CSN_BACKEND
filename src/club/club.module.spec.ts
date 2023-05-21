import { Test } from '@nestjs/testing';
import { ClubController } from './club.controller';
import { ClubModule } from './club.module';
import { ClubService } from './club.service';

describe('ClubModule', () => {
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ClubModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(ClubService)).toBeInstanceOf(ClubService);
    expect(moduleRef.get(ClubController)).toBeInstanceOf(ClubController);
  });
  it('should compile the module', async () => {});
});
