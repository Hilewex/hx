CREATE TABLE payout_items (
    payout_item_id text PRIMARY KEY,
    beneficiary_type text NOT NULL,
    beneficiary_id text NULL,
    settlement_line_id text NOT NULL,
    order_id text NULL,
    order_line_id text NULL,
    storefront_id text NULL,
    status text NOT NULL,
    hold_reason_code text NULL,
    amount_summary jsonb NOT NULL DEFAULT '{}',
    execution_summary jsonb NOT NULL DEFAULT '{}',
    boundary_flags jsonb NOT NULL DEFAULT '{}',
    source_refs jsonb NOT NULL DEFAULT '[]',
    batch_id text NULL,
    idempotency_key text NULL,
    errors jsonb NOT NULL DEFAULT '[]',
    warnings jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payout_batches (
    batch_id text PRIMARY KEY,
    batch_type text NOT NULL,
    status text NOT NULL,
    beneficiary_type text NULL,
    item_ids jsonb NOT NULL DEFAULT '[]',
    total_amount numeric NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'TRY',
    scheduled_execution_at timestamptz NULL,
    owner_admin_id text NULL,
    foundation_only boolean NOT NULL DEFAULT true,
    actual_provider_payout_performed boolean NOT NULL DEFAULT false,
    payment_instruction_created boolean NOT NULL DEFAULT false,
    idempotency_key text NULL,
    errors jsonb NOT NULL DEFAULT '[]',
    warnings jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payout_idempotency (
    idempotency_key text PRIMARY KEY,
    scope text NOT NULL,
    payout_item_ids jsonb NULL,
    batch_id text NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_items_beneficiary ON payout_items(beneficiary_type, beneficiary_id);
CREATE INDEX idx_payout_items_settlement_line_id ON payout_items(settlement_line_id);
CREATE INDEX idx_payout_items_status ON payout_items(status);
CREATE INDEX idx_payout_items_batch_id ON payout_items(batch_id);
CREATE INDEX idx_payout_items_created_at ON payout_items(created_at);

CREATE INDEX idx_payout_batches_status ON payout_batches(status);
CREATE INDEX idx_payout_batches_batch_type ON payout_batches(batch_type);
CREATE INDEX idx_payout_batches_beneficiary_type ON payout_batches(beneficiary_type);
CREATE INDEX idx_payout_batches_created_at ON payout_batches(created_at);

CREATE UNIQUE INDEX idx_payout_idempotency_key_unique ON payout_idempotency(idempotency_key);
