import { query } from './src';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db';
}

async function verifySchema() {
  console.log('--- Starting Schema Verification ---');

  try {
    await checkTable('payments');
    await checkTable('orders');
    await checkTable('order_lines');
    await checkTable('idempotency_records');
    await checkTable('idempotency');
    await checkTable('shipments');
    await checkTable('shipment_packages');
    await checkTable('shipment_lines');
    await checkTable('cancel_return_requests');
    await checkTable('cancel_return_lines');
    await checkTable('refunds');
    await checkTable('refund_lines');
    await checkTable('audit_logs');
    await checkTable('event_outbox');
    await checkTable('risk_signals');
    await checkTable('risk_cases');
    await checkTable('risk_idempotency');
    await checkTable('settlement_lines');
    await checkTable('settlement_idempotency');
    await checkTable('payout_items');
    await checkTable('payout_batches');
    await checkTable('payout_idempotency');
    await checkTable('notifications');
    await checkTable('notification_delivery_attempts');
    await checkTable('notification_idempotency');
    await checkTable('analytics_events');
    await checkTable('metric_snapshots');
    await checkTable('dashboard_seeds');
    await checkTable('analytics_idempotency');

    await checkUniqueConstraint('idempotency_records', 'idempotency_records_namespace_idempotency_key_key');
    await checkUniqueConstraint('orders', 'orders_order_number_key');
    
    await checkIndex('idx_payments_checkout_id');
    await checkIndex('idx_orders_checkout_id');
    await checkIndex('idx_orders_payment_id');
    await checkIndex('idx_order_lines_order_id');
    await checkIndex('idx_shipments_order_id');
    await checkIndex('idx_shipments_state');
    await checkIndex('idx_shipment_packages_shipment_id');
    await checkIndex('idx_shipment_lines_shipment_id');
    await checkIndex('idx_cancel_return_requests_order_id');
    await checkIndex('idx_cancel_return_requests_state');
    await checkIndex('idx_cancel_return_lines_request_id');
    await checkIndex('idx_refunds_request_id');
    await checkIndex('idx_refunds_original_payment_id');
    await checkIndex('idx_refunds_state');
    await checkIndex('idx_refund_lines_refund_id');
    await checkIndex('idempotency_pkey');
    await checkIndex('idx_audit_logs_owner_entity');
    await checkIndex('idx_audit_logs_actor');
    await checkIndex('idx_audit_logs_action_type');
    await checkIndex('idx_event_outbox_status');
    await checkIndex('idx_event_outbox_topic');
    await checkIndex('idx_event_outbox_entity');
    await checkIndex('idx_event_outbox_idempotency_key_unique');
    await checkIndex('idx_risk_signals_target');
    await checkIndex('idx_risk_signals_signal_type');
    await checkIndex('idx_risk_signals_risk_level');
    await checkIndex('idx_risk_cases_target');
    await checkIndex('idx_risk_cases_status');
    await checkIndex('idx_risk_cases_risk_level');
    await checkIndex('idx_risk_cases_source');
    await checkIndex('idx_settlement_lines_order_id');
    await checkIndex('idx_settlement_lines_order_line_id');
    await checkIndex('idx_settlement_lines_storefront_id');
    await checkIndex('idx_settlement_lines_party');
    await checkIndex('idx_settlement_lines_status');
    await checkIndex('idx_settlement_lines_reason_code');
    await checkIndex('idx_settlement_lines_created_at');
    await checkIndex('idx_settlement_idempotency_key_unique');
    await checkIndex('idx_payout_items_beneficiary');
    await checkIndex('idx_payout_items_settlement_line_id');
    await checkIndex('idx_payout_items_status');
    await checkIndex('idx_payout_items_batch_id');
    await checkIndex('idx_payout_items_created_at');
    await checkIndex('idx_payout_batches_status');
    await checkIndex('idx_payout_batches_batch_type');
    await checkIndex('idx_payout_batches_beneficiary_type');
    await checkIndex('idx_payout_batches_created_at');
    await checkIndex('idx_payout_idempotency_key_unique');
    
    await checkIndex('idx_notifications_actor');
    await checkIndex('idx_notifications_state');
    await checkIndex('idx_notifications_category');
    await checkIndex('idx_notifications_created_at');
    await checkIndex('idx_notification_delivery_attempts_notification_id');
    await checkIndex('idx_notification_delivery_attempts_state');
    await checkIndex('idx_notification_delivery_attempts_provider_type');
    await checkIndex('idx_notification_idempotency_key_unique');
    
    await checkIndex('idx_analytics_events_event_name');
    await checkIndex('idx_analytics_events_metric_family');
    await checkIndex('idx_analytics_events_metric_type');
    await checkIndex('idx_analytics_events_data_quality_state');
    await checkIndex('idx_analytics_events_occurred_at');
    await checkIndex('idx_metric_snapshots_metric_name');
    await checkIndex('idx_metric_snapshots_metric_family');
    await checkIndex('idx_metric_snapshots_window');
    await checkIndex('idx_metric_snapshots_grain');
    await checkIndex('idx_dashboard_seeds_dashboard_key');
    await checkIndex('idx_analytics_idempotency_key_unique');

    console.log('--- Schema Verification Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Schema Verification FAILED:', error);
    process.exit(1);
  }
}

async function checkTable(tableName: string) {
  const res = await query(`SELECT to_regclass('public.${tableName}')`, []);
  if (res.rows[0].to_regclass === null) {
    throw new Error(`Table "${tableName}" does not exist.`);
  }
  console.log(`Table "${tableName}" exists.`);
}

async function checkUniqueConstraint(tableName: string, constraintName: string) {
    const res = await query(
        `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = '${tableName}' AND constraint_name = '${constraintName}' AND constraint_type = 'UNIQUE'`,
        []
      );
      if (res.rowCount === 0) {
        throw new Error(`Unique constraint "${constraintName}" does not exist on table "${tableName}".`);
      }
      console.log(`Unique constraint "${constraintName}" exists on table "${tableName}".`);
}

async function checkIndex(indexName: string) {
    const res = await query(
        `SELECT 1 FROM pg_class WHERE relname = '${indexName}'`,
        []
      );
      if (res.rowCount === 0) {
        throw new Error(`Index "${indexName}" does not exist.`);
      }
      console.log(`Index "${indexName}" exists.`);
}

verifySchema();
