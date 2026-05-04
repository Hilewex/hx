CREATE TABLE finance_corrections (
  correction_id text PRIMARY KEY,
  target_type text NOT NULL,
  target_id text NOT NULL,
  status text NOT NULL,
  severity text NOT NULL,
  reason_code text NOT NULL,
  source_refs jsonb NOT NULL DEFAULT '[]',
  amount_summary jsonb NOT NULL DEFAULT '{}',
  impact_summary jsonb NOT NULL DEFAULT '{}',
  notes text NULL,
  idempotency_key text NULL,
  errors jsonb NOT NULL DEFAULT '[]',
  warnings jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE finance_correction_idempotency (
  idempotency_key text PRIMARY KEY,
  correction_id text NOT NULL REFERENCES finance_corrections(correction_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_corrections_target ON finance_corrections(target_type, target_id);
CREATE INDEX idx_finance_corrections_status ON finance_corrections(status);
CREATE INDEX idx_finance_corrections_reason_code ON finance_corrections(reason_code);
CREATE INDEX idx_finance_corrections_severity ON finance_corrections(severity);
CREATE INDEX idx_finance_corrections_created_at ON finance_corrections(created_at);
CREATE UNIQUE INDEX idx_finance_correction_idempotency_key_unique ON finance_corrections(idempotency_key) WHERE idempotency_key IS NOT NULL;
