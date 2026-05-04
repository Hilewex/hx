-- HARDENING-04: Media Readiness Foundation
-- This migration establishes the foundational table for media asset metadata.

CREATE TABLE IF NOT EXISTS media_assets (
    -- Primary Identifier
    asset_id TEXT PRIMARY KEY,

    -- Ownership and Typing
    owner_type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    source_type TEXT NOT NULL,

    -- Lifecycle and State Management
    status TEXT NOT NULL,
    moderation_status TEXT NOT NULL,
    processing_state TEXT NOT NULL,
    storage_tier TEXT NOT NULL DEFAULT 'HOT',
    visibility_ready BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_ready BOOLEAN NOT NULL DEFAULT FALSE,

    -- File and Variant Information
    original_file_ref TEXT,
    variants JSONB,
    allowed_surfaces JSONB,
    
    -- Core Metadata
    aspect_ratio TEXT,
    duration_seconds INTEGER,
    mime_type TEXT,
    file_size_bytes BIGINT,
    width INTEGER,
    height INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- Flags and Raw Data for Auditing
    raw_snapshot JSONB,
    warnings JSONB
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets (status);
CREATE INDEX IF NOT EXISTS idx_media_assets_moderation_status ON media_assets (moderation_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets (created_at DESC);

COMMENT ON TABLE media_assets IS 'Stores metadata for all media assets in the system (images, videos).';
COMMENT ON COLUMN media_assets.asset_id IS 'Unique identifier for the media asset.';
COMMENT ON COLUMN media_assets.owner_type IS 'The type of entity that owns this media (e.g., PRODUCT, STORY, STOREFRONT).';
COMMENT ON COLUMN media_assets.owner_id IS 'The ID of the owning entity.';
COMMENT ON COLUMN media_assets.status IS 'The overall lifecycle status of the asset (e.g., UPLOADED, PROCESSING, PROCESSED, APPROVED).';
COMMENT ON COLUMN media_assets.variants IS 'JSONB array of different versions of the media (e.g., thumbnail, poster, web_optimized).';
COMMENT ON COLUMN media_assets.visibility_ready IS 'Flag indicating if the asset is technically processed and ready to be served.';
COMMENT ON COLUMN media_assets.moderation_ready IS 'Flag indicating if the asset has passed moderation and is approved for display.';
