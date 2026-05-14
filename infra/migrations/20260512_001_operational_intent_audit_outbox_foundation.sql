CREATE TABLE IF NOT EXISTS operational_intents (
  intent_id TEXT PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('refund', 'moderation', 'risk', 'fraud')),
  target_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  maker_actor_id TEXT NOT NULL,
  checker_actor_id TEXT,
  workflow_state TEXT NOT NULL CHECK (workflow_state IN (
    'prepared',
    'checker_required',
    'checked',
    'rejected',
    'escalated',
    'owner_handoff_pending',
    'owner_handoff_ready'
  )),
  reason_code TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  idempotency_key TEXT NOT NULL UNIQUE,
  boundary_flags JSONB NOT NULL DEFAULT '{}'::JSONB,
  input_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operational_audit_intent_outbox (
  outbox_id TEXT PRIMARY KEY,
  intent_id TEXT NOT NULL REFERENCES operational_intents(intent_id),
  domain TEXT NOT NULL CHECK (domain IN ('refund', 'moderation', 'risk', 'fraud')),
  target_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  maker_checker_context JSONB NOT NULL DEFAULT '{}'::JSONB,
  idempotency_key TEXT NOT NULL UNIQUE,
  delivery_state TEXT NOT NULL CHECK (delivery_state IN ('pending', 'processing', 'delivered', 'failed', 'dead_letter')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  dead_letter_reason TEXT,
  last_delivery_attempt_at TIMESTAMPTZ,
  lease_owner TEXT,
  lease_until TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

ALTER TABLE operational_audit_intent_outbox
  DROP CONSTRAINT IF EXISTS operational_audit_intent_outbox_delivery_state_check;

ALTER TABLE operational_audit_intent_outbox
  ADD CONSTRAINT operational_audit_intent_outbox_delivery_state_check
  CHECK (delivery_state IN ('pending', 'processing', 'delivered', 'failed', 'dead_letter'));

ALTER TABLE operational_audit_intent_outbox
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS dead_letter_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_delivery_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_owner TEXT,
  ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_operational_intents_domain_target
  ON operational_intents (domain, target_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_operational_intents_workflow_state
  ON operational_intents (workflow_state, updated_at);

CREATE INDEX IF NOT EXISTS idx_operational_audit_outbox_delivery
  ON operational_audit_intent_outbox (delivery_state, created_at);

CREATE INDEX IF NOT EXISTS idx_operational_audit_outbox_retry
  ON operational_audit_intent_outbox (delivery_state, next_retry_at, created_at);

CREATE INDEX IF NOT EXISTS idx_operational_audit_outbox_lease
  ON operational_audit_intent_outbox (delivery_state, lease_until, created_at);

CREATE INDEX IF NOT EXISTS idx_operational_audit_outbox_domain_target
  ON operational_audit_intent_outbox (domain, target_id, created_at);
