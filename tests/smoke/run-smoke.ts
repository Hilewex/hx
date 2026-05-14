import 'dotenv/config';
import { spawn, spawnSync } from 'child_process';
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
import { fraudSignalReviewFalsePositiveGuardSmoke } from './suites/fraud-signal-review-false-positive-guard';
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
import { phase09SmokeCoverageFoundationSmoke } from './suites/phase09-smoke-coverage-foundation';
import { paymentReconciliationDecisionSmoke } from './suites/payment-reconciliation-decision';
import { paymentReconciliationTaskPersistenceSmoke } from './suites/payment-reconciliation-task-persistence';
import { paymentReconciliationWorkerDryRunSmoke } from './suites/payment-reconciliation-worker-dry-run';
import { paymentReconciliationOwnerCommandGuardSmoke } from './suites/payment-reconciliation-owner-command-guard';
import { paymentReconciliationControlledMutationSmoke } from './suites/payment-reconciliation-controlled-mutation';
import { paymentReconciliationE2eNoOrderHandoffSmoke } from './suites/payment-reconciliation-e2e-no-order-handoff';
import { paymentReconciliationAuditOutboxFinalizationSmoke } from './suites/payment-reconciliation-audit-outbox-finalization';
import { financeLedgerSmoke } from './suites/finance-ledger';
import { financeLedgerPostgresDurabilitySmoke } from './suites/finance-ledger-postgres-durability';
import { settlementCalculationFoundationSmoke } from './suites/settlement-calculation-foundation';
import { settlementFromOrderEconomicsSnapshotFoundationSmoke } from './suites/settlement-from-order-economics-snapshot-foundation';
import { settlementPayableEarningLifecycleFoundationSmoke } from './suites/settlement-payable-earning-lifecycle-foundation';
import { settlementPayableEarningReversalFoundationSmoke } from './suites/settlement-payable-earning-reversal-foundation';
import { settlementPayableEarningReleaseEligibilityFoundationSmoke } from './suites/settlement-payable-earning-release-eligibility-foundation';
import { settlementPayableEarningSignalIntegrationFoundationSmoke } from './suites/settlement-payable-earning-signal-integration-foundation';
import { payoutCandidatePreparationFoundationSmoke } from './suites/payout-candidate-preparation-foundation';
import { payoutCandidateReviewOpsFoundationSmoke } from './suites/payout-candidate-review-ops-foundation';
import { refundFinancialImpactFoundationSmoke } from './suites/refund-financial-impact-foundation';
import { refundCommandSecurityHardeningSmoke } from './suites/refund-command-security-hardening';
import { refundMakerCheckerAuditFoundationSmoke } from './suites/refund-maker-checker-audit-foundation';
import { payablePayoutBoundaryFoundationSmoke } from './suites/payable-payout-boundary-foundation';
import { poolBasePriceCorridorFoundationSmoke } from './suites/pool-base-price-corridor-foundation';
import { creatorMarginSettlementFoundationSmoke } from './suites/creator-margin-settlement-foundation';
import { couponSponsorPolicyGuardSmoke } from './suites/coupon-sponsor-policy-guard';
import { couponLineAllocationSettlementImpactSmoke } from './suites/coupon-line-allocation-settlement-impact';
import { refundCouponSponsorReversalFoundationSmoke } from './suites/refund-coupon-sponsor-reversal-foundation';
import { rewardPointLifecycleFoundationSmoke } from './suites/reward-point-lifecycle-foundation';
import { orderLineEconomicsSnapshotFoundationSmoke } from './suites/order-line-economics-snapshot-foundation';
import { categorySmoke } from './suites/category';
import { taxonomySmoke } from './suites/taxonomy';
import { plpSmoke } from './suites/plp';
import { projectionConsumerFoundationSmoke } from './suites/projection-consumer-foundation';
import { staleProjectionLeakSmoke } from './suites/stale-projection-leak';
import { rankingRecommendationReadinessSmoke } from './suites/ranking-recommendation-readiness';
import { adminDirectWriteOwnerCommandGuardSmoke } from './suites/admin-direct-write-owner-command-guard';
import { adminFinanceOpsProjectionSmoke } from './suites/admin-finance-ops-projection';
import { creatorScopeStorefrontProductActionGuardSmoke } from './suites/creator-scope-storefront-product-action-guard';
import { supplierScopeProductIntakeStockPriceGuardSmoke } from './suites/supplier-scope-product-intake-stock-price-guard';
import { supportVisibilityOrderAccessPiiGuardSmoke } from './suites/support-visibility-order-access-pii-guard';
import { panelAuditEvidenceMakerCheckerReadinessSmoke } from './suites/panel-audit-evidence-maker-checker-readiness';
import { panelSmokeCoverageFoundationSmoke } from './suites/panel-smoke-coverage-foundation';
import { operationalOutboxWorkerDryRunSmoke } from './suites/operational-outbox-worker-dry-run';
import { internalServiceAuthSmoke } from './suites/internal-service-auth';
import { operationalOutboxWorkerLeaseSmoke } from './suites/operational-outbox-worker-lease';

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
  'fraud-signal-review-false-positive-guard': fraudSignalReviewFalsePositiveGuardSmoke,
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
  'finance-ledger-postgres-durability': financeLedgerPostgresDurabilitySmoke,
  'settlement-calculation-foundation': settlementCalculationFoundationSmoke,
  'settlement-from-order-economics-snapshot-foundation': settlementFromOrderEconomicsSnapshotFoundationSmoke,
  'settlement-payable-earning-lifecycle-foundation': settlementPayableEarningLifecycleFoundationSmoke,
  'settlement-payable-earning-reversal-foundation': settlementPayableEarningReversalFoundationSmoke,
  'settlement-payable-earning-release-eligibility-foundation': settlementPayableEarningReleaseEligibilityFoundationSmoke,
  'settlement-payable-earning-signal-integration-foundation': settlementPayableEarningSignalIntegrationFoundationSmoke,
  'payout-candidate-preparation-foundation': payoutCandidatePreparationFoundationSmoke,
  'payout-candidate-review-ops-foundation': payoutCandidateReviewOpsFoundationSmoke,
  'refund-financial-impact-foundation': refundFinancialImpactFoundationSmoke,
  'refund-command-security-hardening': refundCommandSecurityHardeningSmoke,
  'refund-maker-checker-audit-foundation': refundMakerCheckerAuditFoundationSmoke,
  'payable-payout-boundary-foundation': payablePayoutBoundaryFoundationSmoke,
  'pool-base-price-corridor-foundation': poolBasePriceCorridorFoundationSmoke,
  'pool-price-corridor-foundation': poolBasePriceCorridorFoundationSmoke,
  'creator-margin-settlement-foundation': creatorMarginSettlementFoundationSmoke,
  'coupon-sponsor-policy-guard': couponSponsorPolicyGuardSmoke,
  'coupon-line-allocation-settlement-impact': couponLineAllocationSettlementImpactSmoke,
  'refund-coupon-sponsor-reversal-foundation': refundCouponSponsorReversalFoundationSmoke,
  'reward-point-lifecycle-foundation': rewardPointLifecycleFoundationSmoke,
  'order-line-economics-snapshot-foundation': orderLineEconomicsSnapshotFoundationSmoke,
  category: categorySmoke,
  taxonomy: taxonomySmoke,
  plp: plpSmoke,
  'projection-consumer-foundation': projectionConsumerFoundationSmoke,
  'stale-projection-leak': staleProjectionLeakSmoke,
  'ranking-recommendation-readiness': rankingRecommendationReadinessSmoke,
  'admin-direct-write-owner-command-guard': adminDirectWriteOwnerCommandGuardSmoke,
  'admin-finance-ops-projection': adminFinanceOpsProjectionSmoke,
  'creator-scope-storefront-product-action-guard': creatorScopeStorefrontProductActionGuardSmoke,
  'supplier-scope-product-intake-stock-price-guard': supplierScopeProductIntakeStockPriceGuardSmoke,
  'support-visibility-order-access-pii-guard': supportVisibilityOrderAccessPiiGuardSmoke,
  'panel-audit-evidence-maker-checker-readiness': panelAuditEvidenceMakerCheckerReadinessSmoke,
  'panel-smoke-coverage-foundation': panelSmokeCoverageFoundationSmoke,
  'operational-outbox-worker-dry-run': operationalOutboxWorkerDryRunSmoke,
  'internal-service-auth': internalServiceAuthSmoke,
  'operational-outbox-worker-lease': operationalOutboxWorkerLeaseSmoke,
  'phase09-smoke-coverage-foundation': phase09SmokeCoverageFoundationSmoke,
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
    spawnSync('taskkill', ['/PID', String(serverProcess.pid), '/T', '/F'], {
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
  const noBffTargets = new Set([
    'finance-ledger-postgres-durability',
    'settlement-payable-earning-reversal-foundation',
    'settlement-payable-earning-release-eligibility-foundation',
    'settlement-payable-earning-signal-integration-foundation',
    'payout-candidate-preparation-foundation',
  ]);
  const preservePersistenceModeTargets = new Set(['finance-ledger-postgres-durability']);
  const useExistingBff = process.env.SMOKE_USE_EXISTING_BFF === 'true';
  const useInProcessBff = !useExistingBff && target === 'notification';
  const needsBff = !noBffTargets.has(target);
  const smokePort = process.env.SMOKE_BFF_PORT || String(3100 + Math.floor(Math.random() * 1000));
  const baseUrl = (useExistingBff
    ? (process.env.SMOKE_BFF_BASE_URL || process.env.BFF_BASE_URL || `http://localhost:${smokePort}`)
    : `http://localhost:${smokePort}`
  ).trim();
  
  // Set memory mode for foundational tests unless the target explicitly validates another store.
  if (!preservePersistenceModeTargets.has(target)) {
    process.env.PERSISTENCE_MODE = 'memory';
  }
  process.env.PORT = smokePort;
  process.env.BFF_PORT = smokePort;
  
  const cmd = process.execPath;
  const serverArgs = ['--import', 'tsx', 'tests/smoke/start-bff.ts'];
  let serverProcess: ReturnType<typeof spawn> | null = null;
  let inProcessServer: { start: () => void; stop: () => void } | null = null;

  if (needsBff && !useExistingBff) {
    if (useInProcessBff) {
      console.log(`Starting in-process BFF server for smoke tests (PERSISTENCE_MODE=${process.env.PERSISTENCE_MODE})...`);
      const { createServer } = await import('../../apps/bff/src/server/index');
      inProcessServer = createServer();
      inProcessServer.start();
    } else {
      console.log(`Starting local BFF server for smoke tests (PERSISTENCE_MODE=${process.env.PERSISTENCE_MODE})...`);
      serverProcess = spawn(cmd, serverArgs, {
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, PORT: smokePort, BFF_PORT: smokePort, SMOKE_BFF_BASE_URL: baseUrl, BFF_BASE_URL: baseUrl }
      });
    }
  }

  if (needsBff) {
    const isUp = await waitForServer(baseUrl);
    if (!isUp) {
      console.error('Failed to start local BFF server');
      if (serverProcess) stopServerProcess(serverProcess);
      if (inProcessServer) inProcessServer.stop();
      process.exit(1);
    }
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
  if (inProcessServer) inProcessServer.stop();
  setTimeout(() => process.exit(hasFailure ? 1 : 0), 100);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

