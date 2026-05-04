-- Migration: 20260425_003_payment_order_persistence.sql
-- Description: Foundation for Payment and Order persistence

-- Idempotency table for common usage
CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace VARCHAR(50) NOT NULL, -- 'payment', 'order', etc.
    idempotency_key VARCHAR(255) NOT NULL,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(namespace, idempotency_key)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY, -- paymentId
    checkout_id UUID NOT NULL,
    state VARCHAR(20) NOT NULL,
    data JSONB NOT NULL, -- Full PaymentInitiationResponse snapshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_id);
CREATE INDEX IF NOT EXISTS idx_payments_state ON payments(state);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY, -- orderId
    order_number VARCHAR(50) NOT NULL UNIQUE,
    checkout_id UUID NOT NULL,
    payment_id UUID NOT NULL,
    payment_attempt_id UUID NOT NULL,
    state VARCHAR(20) NOT NULL,
    data JSONB NOT NULL, -- Full OrderResponse snapshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_checkout_id ON orders(checkout_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_attempt_id ON orders(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_orders_state ON orders(state);

-- Order Lines for detailed querying (snapshot of order state)
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY, -- orderLineId
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    storefront_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(19, 4) NOT NULL,
    line_total NUMERIC(19, 4) NOT NULL,
    product_name_snapshot VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
