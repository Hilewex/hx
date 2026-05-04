-- Migration: 20260430_002_shipment_timeline.sql
-- Description: Add timeline data to shipments table

ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS timeline JSONB;
