-- P47 Notification Provider / Hardening Migration

CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY,
    actor_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    delivery_mode VARCHAR(50) NOT NULL,
    channels JSONB NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    object_type VARCHAR(100),
    object_id VARCHAR(100),
    correlation_id UUID,
    idempotency_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    preference_overridable BOOLEAN NOT NULL DEFAULT true,
    notification_truth_mutated BOOLEAN NOT NULL DEFAULT true,
    payment_truth_mutated BOOLEAN NOT NULL DEFAULT false,
    order_truth_mutated BOOLEAN NOT NULL DEFAULT false,
    refund_truth_mutated BOOLEAN NOT NULL DEFAULT false,
    settlement_truth_mutated BOOLEAN NOT NULL DEFAULT false,
    payout_truth_mutated BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_state ON notifications(state);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
    attempt_id UUID PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(notification_id),
    provider_type VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    error TEXT,
    actual_provider_delivery_performed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_attempts_notification_id ON notification_delivery_attempts(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_attempts_state ON notification_delivery_attempts(state);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_attempts_provider_type ON notification_delivery_attempts(provider_type);

CREATE TABLE IF NOT EXISTS notification_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    notification_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_idempotency_key_unique ON notification_idempotency(idempotency_key);
