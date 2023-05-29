import { FileTypeValidator, Get } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { IsBoolean, IsDefined, IsInt } from 'class-validator';
import { mockDeep } from 'jest-mock-extended';
import { FileBody, ParseFileBodyPipe } from './file-body.decorator';
import * as httpMock from 'node-mocks-http';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

describe('file-body decorator', () => {
  class TestDto {
    @IsInt()
    testInt: number;

    @IsBoolean()
    testBool: boolean;

    @IsDefined()
    testImage: Express.Multer.File;

    @IsDefined()
    testImages: Express.Multer.File[];
  }

  class TestController {
    @Get()
    testFile(
      @FileBody({
        bodyKey: 'testImage',
        type: 'FILE',
      })
      _fileBody: TestDto,
    ) {
      //
    }

    @Get()
    testFiles(
      @FileBody({
        bodyKey: 'testImages',
        type: 'FILES',
      })
      _fileBody: TestDto,
    ) {
      //
    }
  }

  const testController = new TestController();

  const correctPlain = {
    testInt: 1,
    testBool: false,
    testImage: mockDeep<Express.Multer.File>(),
    testImages: [mockDeep<Express.Multer.File>()],
  };

  correctPlain.testImage.mimetype = 'image/png';
  correctPlain.testImage.filename = 'test.png';
  correctPlain.testImage.originalname = 'test.png';

  correctPlain.testImages[0].mimetype = 'image/png';
  correctPlain.testImages[0].filename = 'test.png';
  correctPlain.testImages[0].originalname = 'test.png';

  const wrongPlain = {
    testInt: 1.5,
    testBool: 'false',
    testImage: mockDeep<Express.Multer.File>(),
    testImages: [mockDeep<Express.Multer.File>()],
  };

  describe('ParseFileBodyPipe', () => {
    const fileTypeValidator = new FileTypeValidator({
      fileType: /(jpg|jpeg|png|gif)$/,
    });
    const filePipe = new ParseFileBodyPipe(
      { bodyKey: 'testImage', type: 'FILE' },
      { fileIsRequired: false, validators: [fileTypeValidator] },
    );
    const filesPipe = new ParseFileBodyPipe(
      { bodyKey: 'testImages', type: 'FILES' },
      { fileIsRequired: false, validators: [fileTypeValidator] },
    );

    it('should check wrong plain', async () => {
      expect(async () => {
        await filePipe.transform(wrongPlain);
      }).rejects.toThrowError();
      expect(async () => {
        await filesPipe.transform(wrongPlain);
      }).rejects.toThrowError();
    });
    it('should return original plain', async () => {
      jest.spyOn(fileTypeValidator, 'isValid').mockReturnValue(true);

      expect(await filePipe.transform(correctPlain)).toEqual(correctPlain);
      expect(await filesPipe.transform(correctPlain)).toEqual(correctPlain);
    });
  });

  describe('FileBody', () => {
    it('should work successfully for single file', async () => {
      const req = httpMock.createRequest();
      req.body = {
        ...correctPlain,
        testImage: undefined,
      };
      req.file = correctPlain.testImage;
      const res = httpMock.createResponse();
      const ctx = new ExecutionContextHost(
        [req, res],
        TestController,
        testController.testFile,
      );
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testFile',
      );

      const firstMetadata = metadata[Object.keys(metadata)[0]];
      expect(firstMetadata.index).toEqual(0);
      expect(firstMetadata.pipes).toHaveLength(2);

      const secondMetadata = metadata[Object.keys(metadata)[1]];
      expect(
        secondMetadata.factory({ bodyKey: 'testImage', type: 'FILE' }, ctx),
      ).toEqual(correctPlain);
    });
  });
  it('should work successfully for multiple files', async () => {
    const req = httpMock.createRequest();
    req.body = {
      ...correctPlain,
      testImages: undefined,
    };
    req.files = correctPlain.testImages;
    const res = httpMock.createResponse();
    const ctx = new ExecutionContextHost(
      [req, res],
      TestController,
      testController.testFiles,
    );
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'testFiles',
    );

    const firstMetadata = metadata[Object.keys(metadata)[0]];
    expect(firstMetadata.index).toEqual(0);
    expect(firstMetadata.pipes).toHaveLength(2);

    const secondMetadata = metadata[Object.keys(metadata)[1]];
    expect(
      secondMetadata.factory({ bodyKey: 'testImages', type: 'FILES' }, ctx),
    ).toEqual(correctPlain);
  });
});
