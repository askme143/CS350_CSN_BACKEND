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
  }

  class TestController {
    @Get()
    testPrint(@FileBody('testImage') fileBody: TestDto) {
      console.log(fileBody);
    }
  }

  const testController = new TestController();
  const correctPlain = {
    testInt: 1,
    testBool: false,
    testImage: mockDeep<Express.Multer.File>(),
  };
  correctPlain.testImage.mimetype = 'image/png';
  correctPlain.testImage.filename = 'test.png';
  correctPlain.testImage.originalname = 'test.png';

  const wrongPlain = {
    testInt: 1.5,
    testBool: 'false',
    testImage: mockDeep<Express.Multer.File>(),
  };

  describe('ParseFileBodyPipe', () => {
    const fileTypeValidator = new FileTypeValidator({
      fileType: /(jpg|jpeg|png|gif)$/,
    });
    const parseFileBodyPipe = new ParseFileBodyPipe('testImage', {
      fileIsRequired: false,
      validators: [fileTypeValidator],
    });
    it('should check wrong plain', async () => {
      expect(async () => {
        await parseFileBodyPipe.transform(wrongPlain);
      }).rejects.toThrowError();
    });
    it('should return original plain', async () => {
      jest.spyOn(fileTypeValidator, 'isValid').mockReturnValue(true);

      expect(await parseFileBodyPipe.transform(correctPlain)).toEqual(
        correctPlain,
      );
    });
  });

  describe('FileBody', () => {
    it('', async () => {
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
        testController.testPrint,
      );
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testPrint',
      );

      const firstMetadata = metadata[Object.keys(metadata)[0]];
      expect(firstMetadata.index).toEqual(0);
      expect(firstMetadata.pipes).toHaveLength(2);

      const secondMetadata = metadata[Object.keys(metadata)[1]];
      expect(secondMetadata.factory('testImage', ctx)).toEqual(correctPlain);
    });
  });
});
