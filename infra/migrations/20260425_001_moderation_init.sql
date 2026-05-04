-- P33 Initial Moderation Schema

CREATE TABLE IF NOT EXISTS moderation_cases (
    case_id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    owner_actor_id TEXT,
    storefront_id TEXT,
    product_id TEXT,
    status TEXT NOT NULL, -- OPEN, UNDER_REVIEW, APPROVED, REJECTED, RESTRICTED, ACTION_REQUIRED, CLOSED
    source TEXT NOT NULL, -- SYSTEM_RULE, USER_REPORT, etc.
    risk_level TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    reason_codes TEXT[] NOT NULL DEFAULT '{}',
    decision TEXT,
    decision_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Control flags from contract
    moderation_truth BOOLEAN NOT NULL DEFAULT TRUE,
    target_truth_mutated BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata/Raw compatibility
    raw_data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS moderation_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES moderation_cases(case_id) ON DELETE CASCADE,
    content_text TEXT,
    media_asset_ids TEXT[] DEFAULT '{}',
    source TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Control flags from contract
    moderation_truth BOOLEAN NOT NULL DEFAULT TRUE,
    target_truth_mutated BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata/Raw compatibility
    raw_data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_mod_cases_target ON moderation_cases(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_status ON moderation_cases(status);
CREATE INDEX IF NOT EXISTS idx_mod_snapshots_case_id ON moderation_snapshots(case_id);
