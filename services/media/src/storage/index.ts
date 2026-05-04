export interface IStorageResult {
  success: boolean;
  ref: string;
  url: string;
  error?: string;
}

export interface IMediaStorageAdapter {
  store(assetId: string, variant: string, buffer: Buffer, extension?: string): Promise<IStorageResult>;
  getPublicUrl(ref: string): string;
}

let adapter: IMediaStorageAdapter;

export const getMediaStorageAdapter = (): IMediaStorageAdapter => {
  if (adapter) {
    return adapter;
  }

  const mode = process.env.MEDIA_STORAGE_MODE || 'local';

  if (mode === 'local') {
    const { LocalMediaStorageAdapter } = require('./local');
    adapter = new LocalMediaStorageAdapter();
  } else {
    // In a real scenario, we might have an 's3' or other adapter.
    // For now, we'll fall back to local for any other value.
    const { LocalMediaStorageAdapter } = require('./local');
    adapter = new LocalMediaStorageAdapter();
  }
  
  return adapter;
};
