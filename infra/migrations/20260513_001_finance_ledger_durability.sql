CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  ledger_entry_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_event_id TEXT NULL,
  direction TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  currency TEXT NOT NULL,
  account_type TEXT NULL,
  account_key TEXT NULL,
  counterparty_type TEXT NULL,
  counterparty_id TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  immutable BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_finance_ledger_immutable CHECK (immutable = TRUE),
  CONSTRAINT chk_finance_ledger_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_finance_ledger_direction CHECK (direction IN ('DEBIT', 'CREDIT')),
  CONSTRAINT chk_finance_ledger_entry_type CHECK (
    entry_type IN (
      'PAYMENT_CAPTURE',
      'PLATFORM_COMMISSION',
      'SUPPLIER_PAYABLE',
      'CREATOR_SHARE',
      'COUPON_DISCOUNT',
      'REFUND',
      'REFUND_REVERSAL',
      'CORRECTION',
      'PAYOUT',
      'PAYOUT_REVERSAL'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_created_at
  ON finance_ledger_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_source
  ON finance_ledger_entries(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_entry_type
  ON finance_ledger_entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_finance_ledger_entries_direction
  ON finance_ledger_entries(direction);

CREATE OR REPLACE FUNCTION prevent_finance_ledger_rewrite()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'finance_ledger_entries is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_finance_ledger_rewrite ON finance_ledger_entries;

CREATE TRIGGER trg_prevent_finance_ledger_rewrite
BEFORE UPDATE OR DELETE ON finance_ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_finance_ledger_rewrite();
