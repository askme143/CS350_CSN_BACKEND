import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prismaService = app.get(PrismaService);

    jest.spyOn(prismaService, '$connect').mockResolvedValue();
  });

  it('should connect and disconnect successfully', async () => {
    const closeSpy = jest.spyOn(app, 'close');
    const moduleInitSpy = jest.spyOn(prismaService, 'onModuleInit');

    await app.init();
    await prismaService.enableShutdownHooks(app);
    process.emit('beforeExit', 0);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    expect(moduleInitSpy).toBeCalled();
    expect(closeSpy).toBeCalled();
  });
});
