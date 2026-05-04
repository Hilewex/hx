CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id UUID PRIMARY KEY,
  actor_type VARCHAR(64) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(128) NOT NULL,
  owner_service VARCHAR(128) NOT NULL,
  entity_type VARCHAR(128) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  reason TEXT NULL,
  idempotency_key VARCHAR(255) NULL,
  correlation_id VARCHAR(255) NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_outbox (
  event_id UUID PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  payload_schema VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  owner_service VARCHAR(128) NOT NULL,
  entity_type VARCHAR(128) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(255) NULL,
  correlation_id VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_outbox_status_check CHECK (status IN ('pending', 'published', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_entity
  ON audit_logs (owner_service, entity_type, entity_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor_type, actor_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type
  ON audit_logs (action_type, created_at);

CREATE INDEX IF NOT EXISTS idx_event_outbox_status
  ON event_outbox (status, occurred_at);

CREATE INDEX IF NOT EXISTS idx_event_outbox_topic
  ON event_outbox (topic, occurred_at);

CREATE INDEX IF NOT EXISTS idx_event_outbox_entity
  ON event_outbox (owner_service, entity_type, entity_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_outbox_idempotency_key_unique
  ON event_outbox (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
