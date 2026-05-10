import 'dotenv/config';
import { spawn } from 'child_process';
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
import { bffActorSpoofingGuardSmoke } from './suites/bff-actor-spoofing-guard';
import { interactionIdempotencyDuplicatePreventionSmoke } from './suites/interaction-idempotency-duplicate-prevention';
import { storyReviewQaVisibilityGuardSmoke } from './suites/story-review-qa-visibility-guard';
import { moderationDecisionAuditMakerCheckerSmoke } from './suites/moderation-decision-audit-maker-checker';
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
import { providerCallbackFoundationSmoke } from './suites/provider-callback-foundation';
import { providerCallbackPostgresSmoke } from './suites/provider-callback-postgres';
import { providerCallbackIngestionSmoke } from './suites/provider-callback-ingestion';
import { providerCallbackSignatureGuardSmoke } from './suites/provider-callback-signature-guard';
import { providerCallbackReplayGuardSmoke } from './suites/provider-callback-replay-guard';
import { providerCallbackFreshnessGuardSmoke } from './suites/provider-callback-freshness-guard';
import { providerCallbackRateLimitGuardSmoke } from './suites/provider-callback-rate-limit-guard';
import { paymentCallbackCandidateSmoke } from './suites/payment-callback-candidate';
import { paymentCallbackOwnerCommandSmoke } from './suites/payment-callback-owner-command';
import { paymentCallbackWorkerFoundationSmoke } from './suites/payment-callback-worker-foundation';
import { paymentCallbackOwnerTransitionSmoke } from './suites/payment-callback-owner-transition';
import { paymentInitiationProviderReferenceSmoke } from './suites/payment-initiation-provider-reference';
import { paymentReadinessGuardSmoke } from './suites/payment-readiness-guard';
import { checkoutVariantPriceStockValidationSmoke } from './suites/checkout-variant-price-stock-validation';
import { checkoutCouponCampaignImpactFoundationSmoke } from './suites/checkout-coupon-campaign-impact-foundation';
import { paymentProviderReferenceLookupSmoke } from './suites/payment-provider-reference-lookup';
import { paytrCallbackMappingSmoke } from './suites/paytr-callback-mapping';
import { paytrCallbackBffPolicySmoke } from './suites/paytr-callback-bff-policy';
import { paymentProviderConfigSmoke } from './suites/payment-provider-config';
import { paytrCallbackLiveBffMappingSmoke } from './suites/paytr-callback-live-bff-mapping';


import { paytrStatusInquiryMappingSmoke } from './suites/paytr-status-inquiry-mapping';
import { paytrStatusInquiryAdapterBoundarySmoke } from './suites/paytr-status-inquiry-adapter-boundary';
import { paymentReconciliationDecisionSmoke } from './suites/payment-reconciliation-decision';
import { paymentReconciliationTaskPersistenceSmoke } from './suites/payment-reconciliation-task-persistence';
import { paymentReconciliationWorkerDryRunSmoke } from './suites/payment-reconciliation-worker-dry-run';
import { paymentReconciliationOwnerCommandGuardSmoke } from './suites/payment-reconciliation-owner-command-guard';
import { paymentReconciliationControlledMutationSmoke } from './suites/payment-reconciliation-controlled-mutation';
import { paymentReconciliationE2eNoOrderHandoffSmoke } from './suites/payment-reconciliation-e2e-no-order-handoff';
import { paymentReconciliationAuditOutboxFinalizationSmoke } from './suites/payment-reconciliation-audit-outbox-finalization';
import { financeLedgerSmoke } from './suites/finance-ledger';
import { settlementCalculationFoundationSmoke } from './suites/settlement-calculation-foundation';
import { refundFinancialImpactFoundationSmoke } from './suites/refund-financial-impact-foundation';
import { payablePayoutBoundaryFoundationSmoke } from './suites/payable-payout-boundary-foundation';
import { poolBasePriceCorridorFoundationSmoke } from './suites/pool-base-price-corridor-foundation';
import { creatorMarginSettlementFoundationSmoke } from './suites/creator-margin-settlement-foundation';
import { couponSponsorPolicyGuardSmoke } from './suites/coupon-sponsor-policy-guard';
import { couponLineAllocationSettlementImpactSmoke } from './suites/coupon-line-allocation-settlement-impact';
import { refundCouponSponsorReversalFoundationSmoke } from './suites/refund-coupon-sponsor-reversal-foundation';
import { rewardPointLifecycleFoundationSmoke } from './suites/reward-point-lifecycle-foundation';
import { categorySmoke } from './suites/category';
import { taxonomySmoke } from './suites/taxonomy';
import { plpSmoke } from './suites/plp';
import { projectionConsumerFoundationSmoke } from './suites/projection-consumer-foundation';
import { staleProjectionLeakSmoke } from './suites/stale-projection-leak';
import { rankingRecommendationReadinessSmoke } from './suites/ranking-recommendation-readiness';
import { adminDirectWriteOwnerCommandGuardSmoke } from './suites/admin-direct-write-owner-command-guard';
import { creatorScopeStorefrontProductActionGuardSmoke } from './suites/creator-scope-storefront-product-action-guard';
import { supplierScopeProductIntakeStockPriceGuardSmoke } from './suites/supplier-scope-product-intake-stock-price-guard';
import { supportVisibilityOrderAccessPiiGuardSmoke } from './suites/support-visibility-order-access-pii-guard';
import { panelAuditEvidenceMakerCheckerReadinessSmoke } from './suites/panel-audit-evidence-maker-checker-readiness';
import { panelSmokeCoverageFoundationSmoke } from './suites/panel-smoke-coverage-foundation';

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
  'bff-actor-spoofing-guard': bffActorSpoofingGuardSmoke,
  'interaction-idempotency-duplicate-prevention': interactionIdempotencyDuplicatePreventionSmoke,
  'story-review-qa-visibility-guard': storyReviewQaVisibilityGuardSmoke,
  'moderation-decision-audit-maker-checker': moderationDecisionAuditMakerCheckerSmoke,
  'commerce-abuse-signal': commerceAbuseSignalSmoke,
  'provider-boundary': P51_PROVIDER_BOUNDARY_SUITE,
  'payment-provider-boundary': paymentProviderBoundarySmoke,
  'shipment-provider-boundary': shipmentProviderBoundarySmoke,
  'notification-provider-boundary': notificationProviderBoundarySmoke,
  'payout-provider-boundary': payoutProviderBoundarySmoke,
  'provider-callback-foundation': providerCallbackFoundationSmoke,
  'provider-callback-postgres': providerCallbackPostgresSmoke,
  'provider-callback-ingestion': providerCallbackIngestionSmoke,
  'provider-callback-signature-guard': providerCallbackSignatureGuardSmoke,
  'provider-callback-replay-guard': providerCallbackReplayGuardSmoke,
  'provider-callback-freshness-guard': providerCallbackFreshnessGuardSmoke,
  'provider-callback-rate-limit-guard': providerCallbackRateLimitGuardSmoke,
  'payment-callback-candidate': paymentCallbackCandidateSmoke,
  'payment-callback-owner-command': paymentCallbackOwnerCommandSmoke,
  'payment-callback-worker-foundation': paymentCallbackWorkerFoundationSmoke,
  'payment-callback-owner-transition': paymentCallbackOwnerTransitionSmoke,
  'payment-initiation-provider-reference': paymentInitiationProviderReferenceSmoke,
  'payment-readiness-guard': paymentReadinessGuardSmoke,
  'checkout-variant-price-stock-validation': checkoutVariantPriceStockValidationSmoke,
  'checkout-coupon-campaign-impact-foundation': checkoutCouponCampaignImpactFoundationSmoke,
  'payment-provider-reference-lookup': paymentProviderReferenceLookupSmoke,
  'paytr-callback-mapping': paytrCallbackMappingSmoke,
  'paytr-callback-bff-policy': paytrCallbackBffPolicySmoke,
  'paytr-callback-live-bff-mapping': paytrCallbackLiveBffMappingSmoke,
  'payment-provider-config': paymentProviderConfigSmoke,
  'paytr-status-inquiry-mapping': paytrStatusInquiryMappingSmoke,
  'paytr-status-inquiry-adapter-boundary': paytrStatusInquiryAdapterBoundarySmoke,
  'payment-reconciliation-decision': paymentReconciliationDecisionSmoke,
  'payment-reconciliation-task-persistence': paymentReconciliationTaskPersistenceSmoke,
  'payment-reconciliation-worker-dry-run': paymentReconciliationWorkerDryRunSmoke,
  'payment-reconciliation-owner-command-guard': paymentReconciliationOwnerCommandGuardSmoke,
  'payment-reconciliation-controlled-mutation': paymentReconciliationControlledMutationSmoke,
  'payment-reconciliation-e2e-no-order-handoff': paymentReconciliationE2eNoOrderHandoffSmoke,
  'payment-reconciliation-audit-outbox-finalization': paymentReconciliationAuditOutboxFinalizationSmoke,
  'finance-ledger-foundation': financeLedgerSmoke,
  'settlement-calculation-foundation': settlementCalculationFoundationSmoke,
  'refund-financial-impact-foundation': refundFinancialImpactFoundationSmoke,
  'payable-payout-boundary-foundation': payablePayoutBoundaryFoundationSmoke,
  'pool-base-price-corridor-foundation': poolBasePriceCorridorFoundationSmoke,
  'pool-price-corridor-foundation': poolBasePriceCorridorFoundationSmoke,
  'creator-margin-settlement-foundation': creatorMarginSettlementFoundationSmoke,
  'coupon-sponsor-policy-guard': couponSponsorPolicyGuardSmoke,
  'coupon-line-allocation-settlement-impact': couponLineAllocationSettlementImpactSmoke,
  'refund-coupon-sponsor-reversal-foundation': refundCouponSponsorReversalFoundationSmoke,
  'reward-point-lifecycle-foundation': rewardPointLifecycleFoundationSmoke,
  category: categorySmoke,
  taxonomy: taxonomySmoke,
  plp: plpSmoke,
  'projection-consumer-foundation': projectionConsumerFoundationSmoke,
  'stale-projection-leak': staleProjectionLeakSmoke,
  'ranking-recommendation-readiness': rankingRecommendationReadinessSmoke,
  'admin-direct-write-owner-command-guard': adminDirectWriteOwnerCommandGuardSmoke,
  'creator-scope-storefront-product-action-guard': creatorScopeStorefrontProductActionGuardSmoke,
  'supplier-scope-product-intake-stock-price-guard': supplierScopeProductIntakeStockPriceGuardSmoke,
  'support-visibility-order-access-pii-guard': supportVisibilityOrderAccessPiiGuardSmoke,
  'panel-audit-evidence-maker-checker-readiness': panelAuditEvidenceMakerCheckerReadinessSmoke,
  'panel-smoke-coverage-foundation': panelSmokeCoverageFoundationSmoke,
};

async function waitForServer(url: string, timeout = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return true;
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function stopServerProcess(serverProcess: ReturnType<typeof spawn>) {
  if (serverProcess.pid && process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: false
    });
    return;
  }

  try {
    serverProcess.kill();
  } catch {
    // ignore shutdown races
  }
}

async function run() {
  const target = process.argv[2] || 'all';
  const useExistingBff = process.env.SMOKE_USE_EXISTING_BFF === 'true';
  const smokePort = process.env.SMOKE_BFF_PORT || String(3100 + Math.floor(Math.random() * 1000));
  const baseUrl = (useExistingBff
    ? (process.env.SMOKE_BFF_BASE_URL || process.env.BFF_BASE_URL || `http://localhost:${smokePort}`)
    : `http://localhost:${smokePort}`
  ).trim();
  
  // Set memory mode for foundational tests
  process.env.PERSISTENCE_MODE = 'memory';
  
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  let serverProcess: ReturnType<typeof spawn> | null = null;

  if (!useExistingBff) {
    console.log(`Starting local BFF server for smoke tests (PERSISTENCE_MODE=${process.env.PERSISTENCE_MODE})...`);
    serverProcess = spawn(cmd, ['tsx', '--no-cache', 'tests/smoke/start-bff.ts'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: smokePort, BFF_PORT: smokePort, SMOKE_BFF_BASE_URL: baseUrl, BFF_BASE_URL: baseUrl }
    });
  }

  const isUp = await waitForServer(baseUrl);
  if (!isUp) {
    console.error('Failed to start local BFF server');
    if (serverProcess) stopServerProcess(serverProcess);
    process.exit(1);
  }

  console.log(`Running smoke tests against ${baseUrl}`);

  const toRun = target === 'all' ? Object.values(suites) : [suites[target as keyof typeof suites]];
  
  let hasFailure = false;
  for (const suite of toRun) {
    if (!suite) {
      console.log(`Suite ${target} not found`);
      hasFailure = true;
      continue;
    }
    const { result, message } = await suite.run(baseUrl);
    console.log(`[${result}] ${suite.name} - ${message || ''}`);
    if (result !== 'PASS') {
      hasFailure = true;
    }
  }
  
  if (serverProcess) stopServerProcess(serverProcess);
  setTimeout(() => process.exit(hasFailure ? 1 : 0), 100);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

