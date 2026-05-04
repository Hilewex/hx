import 'dotenv/config';
import { healthSmoke } from './suites/health';
import { catalogSmoke, commerceSmoke, socialSmoke, searchSmoke, customerSmoke, storefrontSmoke } from './suites/others';
import { coreCommerceSmoke } from './suites/core-commerce';
import { mediaSmoke } from './suites/media';
import { authPermissionSmoke } from './suites/auth-permission';
import { adminPermissionSmoke } from './suites/admin-permission';
import { socialPermissionSmoke } from './suites/social-permission';
import { commercePermissionSmoke } from './suites/commerce-permission';
import { moderationWorkflowSmoke } from './suites/moderation-workflow';
import { socialModerationSmoke } from './suites/social-moderation';
import { riskSignalSmoke } from './suites/risk-signal';
import { socialAbuseSignalSmoke } from './suites/social-abuse-signal';
import { commerceAbuseSignalSmoke } from './suites/commerce-abuse-signal';
import { catalogReadSmoke } from './suites/catalog-read';
import { searchIndexProjectionSmoke } from './suites/search-index-projection';
import { eventAuditSmoke } from './suites/event-audit';
import { eventOutboxSmoke } from './suites/event-outbox';
import { analyticsSmoke } from './suites/analytics';
import { notificationSmoke } from './suites/notification';
import { P51_PROVIDER_BOUNDARY_SUITE } from './suites/provider-boundary';
import { paymentProviderBoundarySmoke } from './suites/payment-provider-boundary';
import { shipmentProviderBoundarySmoke } from './suites/shipment-provider-boundary';
import { notificationProviderBoundarySmoke } from './suites/notification-provider-boundary';
import { payoutProviderBoundarySmoke } from './suites/payout-provider-boundary';

const suites = {
  health: healthSmoke,
  catalog: catalogSmoke,
  'catalog-read': catalogReadSmoke,
  commerce: commerceSmoke,
  customer: customerSmoke,
  storefront: storefrontSmoke,
  social: socialSmoke,
  media: mediaSmoke,
  search: searchSmoke,
  'search-index-projection': searchIndexProjectionSmoke,
  'event-audit': eventAuditSmoke,
  'event-outbox': eventOutboxSmoke,
  analytics: analyticsSmoke,
  notification: notificationSmoke,
  'core-commerce': coreCommerceSmoke,
  'auth-permission': authPermissionSmoke,
  'admin-permission': adminPermissionSmoke,
  'social-permission': socialPermissionSmoke,
  'commerce-permission': commercePermissionSmoke,
  'moderation-workflow': moderationWorkflowSmoke,
  'social-moderation': socialModerationSmoke,
  'risk-signal': riskSignalSmoke,
  'social-abuse-signal': socialAbuseSignalSmoke,
  'commerce-abuse-signal': commerceAbuseSignalSmoke,
  'provider-boundary': P51_PROVIDER_BOUNDARY_SUITE,
  'payment-provider-boundary': paymentProviderBoundarySmoke,
  'shipment-provider-boundary': shipmentProviderBoundarySmoke,
  'notification-provider-boundary': notificationProviderBoundarySmoke,
  'payout-provider-boundary': payoutProviderBoundarySmoke,
};

async function run() {
  const target = process.argv[2] || 'all';
  const baseUrl = (process.env.SMOKE_BFF_BASE_URL || process.env.BFF_BASE_URL || 'http://localhost:3001').trim();
  
  console.log(`Running smoke tests against ${baseUrl}`);

  const toRun = target === 'all' ? Object.values(suites) : [suites[target as keyof typeof suites]];
  
  for (const suite of toRun) {
    if (!suite) {
      console.log(`Suite ${target} not found`);
      continue;
    }
    const { result, message } = await suite.run(baseUrl);
    console.log(`[${result}] ${suite.name} - ${message || ''}`);
  }
}

run().catch(console.error);

