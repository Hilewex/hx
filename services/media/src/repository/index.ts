import { MediaAssetRecord, MediaAssetListQuery } from '@hx/contracts';

export interface IMediaRepository {
  create(asset: Partial<MediaAssetRecord>): Promise<MediaAssetRecord>;
  findById(assetId: string): Promise<MediaAssetRecord | null>;
  update(assetId: string, updates: Partial<MediaAssetRecord>): Promise<MediaAssetRecord | null>;
  list(query: MediaAssetListQuery): Promise<MediaAssetRecord[]>;
}

let repo: IMediaRepository;

export const getMediaRepository = (): IMediaRepository => {
  if (repo) {
    return repo;
  }

  const mode = process.env.PERSISTENCE_MODE || 'in-memory';

  if (mode === 'postgres') {
    const { PostgresMediaRepository } = require('./postgres');
    repo = new PostgresMediaRepository();
  } else {
    const { InMemoryMediaRepository } = require('./in-memory');
    repo = new InMemoryMediaRepository();
  }
  
  return repo;
};
