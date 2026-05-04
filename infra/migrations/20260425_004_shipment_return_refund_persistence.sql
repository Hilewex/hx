-- Migration: 20260425_004_shipment_return_refund_persistence.sql
-- Description: Foundation for Shipment, Return/Cancel and Refund persistence

-- Idempotency table (ensure consistent naming with repository expectations)
CREATE TABLE IF NOT EXISTS idempotency (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_packages (
    package_id UUID PRIMARY KEY,
    shipment_id UUID NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    carrier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    delivered_at TIMESTAMP WITH TIME ZONE,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_lines (
    shipment_line_id UUID PRIMARY KEY,
    shipment_id UUID NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    order_line_id UUID NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    storefront_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cancel/Return
CREATE TABLE IF NOT EXISTS cancel_return_requests (
    request_id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cancel_return_lines (
    request_line_id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES cancel_return_requests(request_id) ON DELETE CASCADE,
    order_line_id UUID NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    storefront_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    reason_code VARCHAR(100),
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    refund_id UUID PRIMARY KEY,
    cancel_return_request_id UUID NOT NULL REFERENCES cancel_return_requests(request_id),
    source_type VARCHAR(20) NOT NULL,
    state VARCHAR(50) NOT NULL,
    original_payment_id UUID,
    provider_refund_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_lines (
    refund_line_id UUID PRIMARY KEY,
    refund_id UUID NOT NULL REFERENCES refunds(refund_id) ON DELETE CASCADE,
    request_line_id UUID NOT NULL,
    order_line_id UUID NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    storefront_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_state ON shipments(state);
CREATE INDEX IF NOT EXISTS idx_shipment_packages_shipment_id ON shipment_packages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_shipment_id ON shipment_lines(shipment_id);
CREATE INDEX IF NOT EXISTS idx_cancel_return_requests_order_id ON cancel_return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_cancel_return_requests_state ON cancel_return_requests(state);
CREATE INDEX IF NOT EXISTS idx_cancel_return_lines_request_id ON cancel_return_lines(request_id);
CREATE INDEX IF NOT EXISTS idx_refunds_request_id ON refunds(cancel_return_request_id);
CREATE INDEX IF NOT EXISTS idx_refunds_original_payment_id ON refunds(original_payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_state ON refunds(state);
CREATE INDEX IF NOT EXISTS idx_refund_lines_refund_id ON refund_lines(refund_id);
