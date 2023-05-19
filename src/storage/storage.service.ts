import { DownloadResponse, Storage } from '@google-cloud/storage';
import { MetadataResponse } from '@google-cloud/storage/build/src/nodejs-common';
import { Injectable } from '@nestjs/common';
import { StorageFileEntity } from './entities/storage-file.entity';
import { storageConfig } from './storage.constants';

@Injectable()
export class StorageService {
  private readonly BASE_URL = 'https://storage.googleapis.com';
  private readonly storage: Storage;
  private readonly bucket: string;
  constructor() {
    this.storage = new Storage({
      projectId: storageConfig.projectId,
      credentials: {
        client_email: storageConfig.clientEmail,
        private_key: storageConfig.privateKey,
      },
    });

    this.bucket = storageConfig.mediaBucket;
  }

  private publicDownloadUrlOf(path: string): string {
    return `${this.BASE_URL}/${this.bucket}/${encodeURI(path)}`;
  }

  async upload(
    path: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
    contentType: string,
  ): Promise<string> {
    const metadataObject = metadata.reduce(
      (acc, item) => Object.assign(acc, item),
      { contentType },
    );
    const file = this.storage.bucket(this.bucket).file(path);
    const stream = file.createWriteStream();
    const writePromise = new Promise<void>((resolve, reject) => {
      stream.on('finish', async () => {
        const meta = await file.setMetadata({
          metadata: metadataObject,
        });

        resolve();

        return meta;
      });
      stream.on('error', (e) => {
        reject(e);
      });
    });
    stream.end(media);

    await writePromise;

    return this.publicDownloadUrlOf(path);
  }

  delete(path: string) {
    this.storage
      .bucket(this.bucket)
      .file(path)
      .delete({ ignoreNotFound: true });
  }

  async downloadFile(path: string): Promise<StorageFileEntity> {
    const [buffer]: DownloadResponse = await this.storage
      .bucket(this.bucket)
      .file(path)
      .download();
    const storageFile = new StorageFileEntity(
      buffer,
      new Map<string, string>([]),
      '',
    );

    return storageFile;
  }

  async downloadFileWithMetadata(path: string): Promise<StorageFileEntity> {
    const [metadata]: MetadataResponse = await this.storage
      .bucket(this.bucket)
      .file(path)
      .getMetadata();
    const [buffer]: DownloadResponse = await this.storage
      .bucket(this.bucket)
      .file(path)
      .download();
    const storageFile = new StorageFileEntity(
      buffer,
      new Map<string, string>(Object.entries(metadata ?? {})),
      metadata.get('contentType'),
    );

    return storageFile;
  }
}
