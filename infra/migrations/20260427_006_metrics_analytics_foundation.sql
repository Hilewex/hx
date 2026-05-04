-- Analytics & Metrics Foundation Migration

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    metric_family TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    data_quality_state TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    idempotency_key TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metric_family ON analytics_events(metric_family);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metric_type ON analytics_events(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_quality_state ON analytics_events(data_quality_state);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at);

CREATE TABLE IF NOT EXISTS metric_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_family TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    "window" TEXT NOT NULL,
    grain TEXT NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags JSONB NOT NULL DEFAULT '{}',
    warnings TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_metric_snapshots_metric_name ON metric_snapshots(metric_name);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_metric_family ON metric_snapshots(metric_family);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_window ON metric_snapshots("window");
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_grain ON metric_snapshots(grain);

CREATE TABLE IF NOT EXISTS dashboard_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_key TEXT NOT NULL,
    title TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_degraded BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_seeds_dashboard_key ON dashboard_seeds(dashboard_key);

CREATE TABLE IF NOT EXISTS analytics_idempotency (
    key TEXT PRIMARY KEY,
    event_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_idempotency_key_unique ON analytics_idempotency(key);
