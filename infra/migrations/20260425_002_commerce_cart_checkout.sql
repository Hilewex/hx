-- Migration: 20260425_002_commerce_cart_checkout.sql
-- Description: Foundation for Cart and Checkout persistence

-- Carts table (Owner truth)
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(20) NOT NULL, -- 'GUEST' or 'CUSTOMER'
    actor_id VARCHAR(100) NOT NULL,  -- sessionId or userId
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_actor ON carts(actor_type, actor_id);

-- Cart Lines
CREATE TABLE IF NOT EXISTS cart_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    line_id UUID NOT NULL, -- Business line identity
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    storefront_id VARCHAR(100) NOT NULL,
    data JSONB NOT NULL, -- Full CartLine snapshot for compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_lines_cart_id ON cart_lines(cart_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_lines_line_id ON cart_lines(line_id);

-- Checkout Sessions (Drafts/Snapshots)
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY, -- checkoutId (provided by application)
    actor_type VARCHAR(20) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    state VARCHAR(20) NOT NULL,
    validation_state VARCHAR(20) NOT NULL,
    data JSONB NOT NULL, -- Full CheckoutReviewResponse snapshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_actor ON checkout_sessions(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_state ON checkout_sessions(state);
