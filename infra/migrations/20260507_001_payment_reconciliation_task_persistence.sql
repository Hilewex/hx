-- HARDENING-10C10-04: Payment Reconciliation Task Persistence Foundation
-- Bu migration yalniz reconciliation task kayitlari icin tablo ve index olusturur.

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_reconciliation_tasks (
    id BIGSERIAL PRIMARY KEY,
    reconciliation_ref VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NULL,
    payment_attempt_id VARCHAR(255) NULL,
    checkout_id VARCHAR(255) NULL,
    provider_name VARCHAR(255) NOT NULL,
    provider_reference VARCHAR(255) NULL,
    merchant_oid VARCHAR(255) NULL,
    trigger_reason VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    next_attempt_at TIMESTAMPTZ NULL,
    last_inquiry_ref VARCHAR(255) NULL,
    last_candidate JSONB NULL,
    manual_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    boundary JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_reconciliation_tasks_reconciliation_ref
ON public.payment_reconciliation_tasks (reconciliation_ref);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_tasks_status
ON public.payment_reconciliation_tasks (status);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_tasks_provider_reference
ON public.payment_reconciliation_tasks (provider_name, provider_reference)
WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_tasks_merchant_oid
ON public.payment_reconciliation_tasks (provider_name, merchant_oid)
WHERE merchant_oid IS NOT NULL;

COMMIT;
