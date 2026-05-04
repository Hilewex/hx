CREATE TABLE risk_signals (
  signal_id VARCHAR(50) PRIMARY KEY,
  target_id VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  reason_code VARCHAR(50) NOT NULL,
  metadata JSONB,
  idempotency_key VARCHAR(100),
  risk_truth_mutated BOOLEAN DEFAULT true,
  target_truth_mutated BOOLEAN DEFAULT false,
  payment_truth_mutated BOOLEAN DEFAULT false,
  order_truth_mutated BOOLEAN DEFAULT false,
  refund_truth_mutated BOOLEAN DEFAULT false,
  finance_truth_mutated BOOLEAN DEFAULT false,
  moderation_truth_mutated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE risk_cases (
  case_id VARCHAR(50) PRIMARY KEY,
  target_id VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  decision VARCHAR(50),
  reason_code VARCHAR(50) NOT NULL,
  notes TEXT,
  signals JSONB NOT NULL,
  idempotency_key VARCHAR(100),
  risk_truth_mutated BOOLEAN DEFAULT true,
  target_truth_mutated BOOLEAN DEFAULT false,
  payment_truth_mutated BOOLEAN DEFAULT false,
  order_truth_mutated BOOLEAN DEFAULT false,
  refund_truth_mutated BOOLEAN DEFAULT false,
  finance_truth_mutated BOOLEAN DEFAULT false,
  moderation_truth_mutated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE risk_idempotency (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  result_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_signals_target ON risk_signals(target_id, target_type);
CREATE INDEX idx_risk_signals_signal_type ON risk_signals(type);
CREATE INDEX idx_risk_signals_risk_level ON risk_signals(level);

CREATE INDEX idx_risk_cases_target ON risk_cases(target_id, target_type);
CREATE INDEX idx_risk_cases_status ON risk_cases(status);
CREATE INDEX idx_risk_cases_risk_level ON risk_cases(level);
CREATE INDEX idx_risk_cases_source ON risk_cases(source);
