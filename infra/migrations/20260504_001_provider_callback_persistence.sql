-- HARDENING-10A3: Provider Callback Persistence Foundation
-- Bu migration, provider callback olaylarını depolamak için temel tabloyu ve index'leri oluşturur.

BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_callback_events (
    id BIGSERIAL PRIMARY KEY,
    provider_domain VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    provider_mode VARCHAR(255) NOT NULL,
    callback_type VARCHAR(255) NOT NULL,
    provider_event_id VARCHAR(255) NULL,
    provider_reference VARCHAR(255) NULL,
    idempotency_key VARCHAR(255) NULL,
    correlation_id VARCHAR(255) NULL,
    causation_id VARCHAR(255) NULL,
    request_id VARCHAR(255) NULL,
    verification_status VARCHAR(50) NOT NULL,
    processing_status VARCHAR(50) NOT NULL,
    replay_status VARCHAR(50) NOT NULL,
    signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
    replay_detected BOOLEAN NOT NULL DEFAULT FALSE,
    raw_payload JSONB NULL,
    normalized_payload JSONB NULL,
    error JSONB NULL,
    boundary JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index'ler --

-- Tekrarlanan olayları ve idempotency'yi yönetmek için partial unique index'ler.
-- Sadece NULL olmayan değerler için constraint uygulanır.
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_callback_events_provider_event_id
ON public.provider_callback_events (provider_domain, provider_name, provider_event_id)
WHERE provider_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_callback_events_idempotency_key
ON public.provider_callback_events (provider_domain, provider_name, idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- Sık kullanılan sorgu alanları için index'ler.
CREATE INDEX IF NOT EXISTS idx_provider_callback_events_received_at
ON public.provider_callback_events (received_at);

CREATE INDEX IF NOT EXISTS idx_provider_callback_events_processing_status
ON public.provider_callback_events (processing_status);

CREATE INDEX IF NOT EXISTS idx_provider_callback_events_replay_status
ON public.provider_callback_events (replay_status);

CREATE INDEX IF NOT EXISTS idx_provider_callback_events_callback_type
ON public.provider_callback_events (callback_type);

-- created_at ve updated_at kolonlarının otomatik güncellenmesi için trigger.
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_provider_callback_events_updated_at ON public.provider_callback_events;
CREATE TRIGGER trg_set_provider_callback_events_updated_at
BEFORE UPDATE ON public.provider_callback_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
