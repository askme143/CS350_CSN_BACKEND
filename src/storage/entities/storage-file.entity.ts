export class StorageFileEntity {
  constructor(
    readonly buffer: Buffer,
    readonly metadata: Map<string, string>,
    readonly contentType: string,
  ) {}
}
