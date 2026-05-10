import * as assert from 'assert';
import { SmokeRunner } from '../types';
import { adminDirectWriteOwnerCommandGuardSmoke } from './admin-direct-write-owner-command-guard';
import { adminPermissionSmoke } from './admin-permission';
import { creatorScopeStorefrontProductActionGuardSmoke } from './creator-scope-storefront-product-action-guard';
import { moderationDecisionAuditMakerCheckerSmoke } from './moderation-decision-audit-maker-checker';
import { moderationWorkflowSmoke } from './moderation-workflow';
import { panelAuditEvidenceMakerCheckerReadinessSmoke } from './panel-audit-evidence-maker-checker-readiness';
import { supplierScopeProductIntakeStockPriceGuardSmoke } from './supplier-scope-product-intake-stock-price-guard';
import { supportVisibilityOrderAccessPiiGuardSmoke } from './support-visibility-order-access-pii-guard';

type CoverageEntry = {
  area: string;
  smoke: SmokeRunner;
  risks: string[];
};

const requiredRisks = [
  'Panel direct write blocked',
  'Owner truth mutation blocked',
  'BFF truth mutation blocked',
  'UI truth mutation blocked',
  'Missing reasonCode rejected',
  'Missing idempotencyKey rejected',
  'Actor spoofing rejected',
  'Cross-storefront rejected',
  'Cross-supplier rejected',
  'Unauthorized support visibility rejected',
  'Full PII exposure blocked',
  'Same-actor maker-checker rejected',
  'Audit evidence required',
  'Permission checked',
  'Owner handoff evidence exists',
];

const coverageMatrix: CoverageEntry[] = [
  {
    area: 'Admin',
    smoke: adminDirectWriteOwnerCommandGuardSmoke,
    risks: [
      'Panel direct write blocked',
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
      'Missing reasonCode rejected',
      'Permission checked',
      'Audit evidence required',
    ],
  },
  {
    area: 'Creator',
    smoke: creatorScopeStorefrontProductActionGuardSmoke,
    risks: [
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
      'Missing reasonCode rejected',
      'Actor spoofing rejected',
      'Cross-storefront rejected',
      'Audit evidence required',
      'Permission checked',
      'Owner handoff evidence exists',
    ],
  },
  {
    area: 'Supplier',
    smoke: supplierScopeProductIntakeStockPriceGuardSmoke,
    risks: [
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
      'Missing reasonCode rejected',
      'Actor spoofing rejected',
      'Cross-supplier rejected',
      'Full PII exposure blocked',
      'Audit evidence required',
      'Permission checked',
      'Owner handoff evidence exists',
    ],
  },
  {
    area: 'Support',
    smoke: supportVisibilityOrderAccessPiiGuardSmoke,
    risks: [
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
      'Missing reasonCode rejected',
      'Unauthorized support visibility rejected',
      'Full PII exposure blocked',
      'Audit evidence required',
      'Permission checked',
      'Owner handoff evidence exists',
    ],
  },
  {
    area: 'Audit/evidence and maker-checker',
    smoke: panelAuditEvidenceMakerCheckerReadinessSmoke,
    risks: [
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
      'Missing reasonCode rejected',
      'Missing idempotencyKey rejected',
      'Same-actor maker-checker rejected',
      'Audit evidence required',
      'Permission checked',
      'Owner handoff evidence exists',
    ],
  },
  {
    area: 'Permission',
    smoke: adminPermissionSmoke,
    risks: ['Permission checked'],
  },
  {
    area: 'Moderation maker-checker',
    smoke: moderationDecisionAuditMakerCheckerSmoke,
    risks: [
      'Owner truth mutation blocked',
      'BFF truth mutation blocked',
      'Same-actor maker-checker rejected',
      'Audit evidence required',
      'Owner handoff evidence exists',
    ],
  },
  {
    area: 'Moderation workflow',
    smoke: moderationWorkflowSmoke,
    risks: ['Owner truth mutation blocked', 'Panel direct write blocked'],
  },
];

function assertCoverageMatrix() {
  const coveredRisks = new Set(coverageMatrix.flatMap((entry) => entry.risks));
  for (const risk of requiredRisks) {
    assert.ok(coveredRisks.has(risk), `Coverage matrix missing risk: ${risk}`);
  }

  const requiredAreas = [
    'Admin',
    'Creator',
    'Supplier',
    'Support',
    'Audit/evidence and maker-checker',
    'Permission',
    'Moderation maker-checker',
    'Moderation workflow',
  ];
  const coveredAreas = new Set(coverageMatrix.map((entry) => entry.area));
  for (const area of requiredAreas) {
    assert.ok(coveredAreas.has(area), `Coverage matrix missing area: ${area}`);
  }
}

export const panelSmokeCoverageFoundationSmoke: SmokeRunner = {
  name: 'Panel Smoke Coverage Foundation',
  run: async (baseUrl: string) => {
    try {
      assertCoverageMatrix();

      const results: string[] = [];
      for (const entry of coverageMatrix) {
        const result = await entry.smoke.run(baseUrl);
        results.push(`${entry.area}:${result.result}`);
        assert.strictEqual(
          result.result,
          'PASS',
          `${entry.area} coverage smoke failed via ${entry.smoke.name}: ${result.message || 'no message'}`
        );
      }

      return {
        result: 'PASS',
        message: `Coverage matrix verified; delegated smoke results: ${results.join(', ')}`,
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};
