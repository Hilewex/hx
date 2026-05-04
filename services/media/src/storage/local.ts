import * as fs from 'fs';
import * as path from 'path';
import { IMediaStorageAdapter, IStorageResult } from '.';

export class LocalMediaStorageAdapter implements IMediaStorageAdapter {
  private rootDir: string;
  private baseUrl: string;

  constructor() {
    this.rootDir = process.env.MEDIA_LOCAL_ROOT || './.local/media';
    this.baseUrl = process.env.MEDIA_PUBLIC_BASE_URL || 'http://localhost:3001/media/local';

    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true });
    }
  }

  private getStoragePath(assetId: string, variant: string, extension: string): string {
    // Example: /.local/media/ast_123abc/thumbnail.jpg
    const assetDir = path.join(this.rootDir, assetId);
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }
    return path.join(assetDir, `${variant}.${extension}`);
  }

  async store(assetId: string, variant: string, buffer: Buffer, extension: string = 'jpg'): Promise<IStorageResult> {
    try {
      const filePath = this.getStoragePath(assetId, variant, extension);
      await fs.promises.writeFile(filePath, buffer);
      
      const fileRef = `local:${assetId}/${variant}.${extension}`;
      const url = this.getPublicUrl(fileRef);

      return { success: true, ref: fileRef, url };
    } catch (e: any) {
      return { success: false, ref: '', url: '', error: e.message };
    }
  }

  getPublicUrl(ref: string): string {
    if (!ref.startsWith('local:')) {
      return ref; // Or handle error
    }
    const localPath = ref.substring('local:'.length);
    return `${this.baseUrl}/${localPath}`;
  }
}
