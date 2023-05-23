import { Bucket, File } from '@google-cloud/storage';
import * as GoogleStorage from '@google-cloud/storage';
import { mockDeep } from 'jest-mock-extended';
import { PassThrough } from 'stream';
import { storageConfig } from './storage.constants';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    jest
      .spyOn(GoogleStorage, 'Storage')
      .mockReturnValue(mockDeep<GoogleStorage.Storage>());

    storageConfig.projectId = 'projectId';
    storageConfig.privateKey = 'privateKey';
    storageConfig.clientEmail = 'clientEmail';
    storageConfig.mediaBucket = 'mediaBucket';

    storageService = new StorageService();
  });

  describe('upload', () => {
    const mockStream = new PassThrough();
    const mockFile = mockDeep<File>();
    const mockBucket = mockDeep<Bucket>();
    mockFile.createWriteStream.mockReturnValue(mockStream);
    mockBucket.file.mockReturnValue(mockFile);

    function streamToString(stream: PassThrough) {
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    }

    it('should upload file', async () => {
      jest
        .spyOn(storageService['storage'], 'bucket')
        .mockImplementation((_name: string, _option?: any) => mockBucket);

      const path = 'path';
      const bufferContent = 'hello world';
      const buffer = Buffer.from(bufferContent);
      const result = await storageService.upload(
        path,
        buffer,
        [{}],
        'image/png',
      );

      expect(result).toEqual(
        `https://storage.googleapis.com/${
          storageConfig.mediaBucket
        }/${encodeURI(path)}`,
      );
      expect(await streamToString(mockStream)).toEqual(bufferContent);
    });

    it('should throw exception if upload failed', async () => {
      jest
        .spyOn(storageService['storage'], 'bucket')
        .mockImplementation((_name: string, _option?: any) => mockBucket);

      const path = 'path';
      const bufferContent = 'hello world';
      const buffer = Buffer.from(bufferContent);

      const resultPromise = storageService.upload(
        path,
        buffer,
        [{}],
        'image/png',
      );
      mockStream.emit('error', new Error());

      await expect(resultPromise).rejects.toThrowError(new Error());
    });
  });
});
