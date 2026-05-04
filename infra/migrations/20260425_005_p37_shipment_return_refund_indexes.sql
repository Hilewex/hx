-- Migration: 20260425_005_p37_shipment_return_refund_indexes.sql
-- Description: Idempotent P37 index completion for shipment, return/cancel-return, and refund persistence

CREATE INDEX IF NOT EXISTS idx_shipments_state ON shipments(state);
CREATE INDEX IF NOT EXISTS idx_cancel_return_requests_state ON cancel_return_requests(state);
CREATE INDEX IF NOT EXISTS idx_refunds_original_payment_id ON refunds(original_payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_state ON refunds(state);
