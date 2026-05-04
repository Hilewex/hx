import { MediaAssetRecord, MediaAssetListQuery, MediaStorageTier } from '@hx/contracts';
import { IMediaRepository } from '.';
import { query } from '@hx/persistence';

const toAssetRecord = (row: any): MediaAssetRecord => ({
  assetId: row.asset_id,
  ownerType: row.owner_type,
  ownerId: row.owner_id,
  mediaType: row.media_type,
  sourceType: row.source_type,
  status: row.status,
  moderationStatus: row.moderation_status,
  processingState: row.processing_state,
  storageTier: row.storage_tier,
  originalFileRef: row.original_file_ref,
  variants: row.variants || [],
  allowedSurfaces: row.allowed_surfaces || [],
  aspectRatio: row.aspect_ratio,
  durationSeconds: row.duration_seconds,
  mimeType: row.mime_type,
  fileSizeBytes: row.file_size_bytes ? parseInt(row.file_size_bytes, 10) : undefined,
  width: row.width,
  height: row.height,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
  validatedAt: row.validated_at ? new Date(row.validated_at).toISOString() : undefined,
  processedAt: row.processed_at ? new Date(row.processed_at).toISOString() : undefined,
  archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : undefined,
  visibilityReady: row.visibility_ready,
  moderationReady: row.moderation_ready,
  assetTruth: true,
  contentTruthMutated: false,
  storyTruthMutated: false,
  postTruthMutated: false,
  ugcTruthMutated: false,
  productTruthMutated: false,
  storefrontTruthMutated: false,
  moderationDecisionTruthMutated: false,
  warnings: row.warnings || [],
});

export class PostgresMediaRepository implements IMediaRepository {
  async create(assetData: Partial<MediaAssetRecord>): Promise<MediaAssetRecord> {
    const { rows } = await query(
      `INSERT INTO media_assets (
        asset_id, owner_type, owner_id, media_type, source_type, status,
        moderation_status, processing_state, storage_tier, original_file_ref,
        variants, allowed_surfaces, mime_type, file_size_bytes, width, height,
        duration_seconds, visibility_ready, moderation_ready
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        assetData.assetId,
        assetData.ownerType,
        assetData.ownerId,
        assetData.mediaType,
        assetData.sourceType,
        assetData.status,
        assetData.moderationStatus,
        assetData.processingState,
        assetData.storageTier || MediaStorageTier.HOT, // Ensure default
        assetData.originalFileRef,
        JSON.stringify(assetData.variants || []),
        JSON.stringify(assetData.allowedSurfaces || []),
        assetData.mimeType,
        assetData.fileSizeBytes,
        assetData.width,
        assetData.height,
        assetData.durationSeconds,
        assetData.visibilityReady,
        assetData.moderationReady,
      ]
    );
    return toAssetRecord(rows[0]);
  }

  async findById(assetId: string): Promise<MediaAssetRecord | null> {
    const { rows, rowCount } = await query('SELECT * FROM media_assets WHERE asset_id = $1', [assetId]);
    if (rowCount === 0) {
      return null;
    }
    return toAssetRecord(rows[0]);
  }

  async update(assetId: string, updates: Partial<MediaAssetRecord>): Promise<MediaAssetRecord | null> {
    const existing = await this.findById(assetId);
    if (!existing) {
      return null;
    }

    const updatedData = { ...existing, ...updates };
    
    const { rows } = await query(
      `UPDATE media_assets SET
        status = $1, moderation_status = $2, processing_state = $3, storage_tier = $4,
        original_file_ref = $5, variants = $6, visibility_ready = $7, moderation_ready = $8,
        processed_at = $9, updated_at = NOW()
      WHERE asset_id = $10
      RETURNING *`,
      [
        updatedData.status,
        updatedData.moderationStatus,
        updatedData.processingState,
        updatedData.storageTier,
        updatedData.originalFileRef,
        JSON.stringify(updatedData.variants),
        updatedData.visibilityReady,
        updatedData.moderationReady,
        updates.processedAt ? new Date(updates.processedAt) : null,
        assetId,
      ]
    );
    return toAssetRecord(rows[0]);
  }

  async list(listQuery: MediaAssetListQuery): Promise<MediaAssetRecord[]> {
    const params: any[] = [];
    let sql = 'SELECT * FROM media_assets WHERE 1=1';

    if (listQuery.ownerId) {
      params.push(listQuery.ownerId);
      sql += ` AND owner_id = $${params.length}`;
    }
    if (listQuery.ownerType) {
      params.push(listQuery.ownerType);
      sql += ` AND owner_type = $${params.length}`;
    }
    if (listQuery.status) {
      params.push(listQuery.status);
      sql += ` AND status = $${params.length}`;
    }
    
    sql += ' ORDER BY created_at DESC';
    if(listQuery.limit) {
      params.push(listQuery.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await query(sql, params);
    return rows.map(toAssetRecord);
  }
}
