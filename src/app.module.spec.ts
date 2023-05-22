import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';

describe('AppModule', () => {
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(AuthModule)).toBeInstanceOf(AuthModule);
    expect(moduleRef.get(ClubModule)).toBeInstanceOf(ClubModule);
  });
  it('should compile the module', async () => {
    //
  });
});
