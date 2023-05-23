import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
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
}
