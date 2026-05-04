-- UP
CREATE TABLE IF NOT EXISTS settlement_lines (
    settlement_line_id text PRIMARY KEY,
    order_id text NOT NULL,
    order_line_id text NOT NULL,
    storefront_id text NOT NULL,
    product_id text NOT NULL,
    variant_id text NULL,
    party_type text NOT NULL,
    party_id text NULL,
    status text NOT NULL,
    reason_code text NOT NULL,
    amount_summary jsonb NOT NULL DEFAULT '{}',
    impact_summary jsonb NOT NULL DEFAULT '{}',
    source_refs jsonb NOT NULL DEFAULT '[]',
    idempotency_key text NULL,
    errors jsonb NOT NULL DEFAULT '[]',
    warnings jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlement_idempotency (
    idempotency_key text PRIMARY KEY,
    settlement_line_ids jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlement_lines_order_id ON settlement_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_order_line_id ON settlement_lines(order_line_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_storefront_id ON settlement_lines(storefront_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_party ON settlement_lines(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_status ON settlement_lines(status);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_reason_code ON settlement_lines(reason_code);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_created_at ON settlement_lines(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlement_idempotency_key_unique ON settlement_lines(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- DOWN
DROP INDEX IF EXISTS idx_settlement_idempotency_key_unique;
DROP INDEX IF EXISTS idx_settlement_lines_created_at;
DROP INDEX IF EXISTS idx_settlement_lines_reason_code;
DROP INDEX IF EXISTS idx_settlement_lines_status;
DROP INDEX IF EXISTS idx_settlement_lines_party;
DROP INDEX IF EXISTS idx_settlement_lines_storefront_id;
DROP INDEX IF EXISTS idx_settlement_lines_order_line_id;
DROP INDEX IF EXISTS idx_settlement_lines_order_id;
DROP TABLE IF EXISTS settlement_idempotency;
DROP TABLE IF EXISTS settlement_lines;
