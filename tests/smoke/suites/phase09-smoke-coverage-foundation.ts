import * as assert from 'assert';
import { SmokeRunner } from '../types';
import { riskSignalSmoke } from './risk-signal';
import { fraudSignalReviewFalsePositiveGuardSmoke } from './fraud-signal-review-false-positive-guard';
import { analyticsSmoke } from './analytics';
import { notificationSmoke } from './notification';
import { notificationProviderBoundarySmoke } from './notification-provider-boundary';
import { eventAuditSmoke } from './event-audit';
import { eventOutboxSmoke } from './event-outbox';
import { panelAuditEvidenceMakerCheckerReadinessSmoke } from './panel-audit-evidence-maker-checker-readiness';
import { panelSmokeCoverageFoundationSmoke } from './panel-smoke-coverage-foundation';

type CoverageEntry = {
  area: string;
  smoke: SmokeRunner;
  risks: string[];
};

const requiredRisks = [
  'Risk owner truth mutation blocked',
  'Fraud owner truth mutation blocked',
  'Analytics PII masked/minimized',
  'Analytics non-mutation evidence',
  'Notification PII masked/minimized',
  'Notification duplicate/idempotency evidence',
  'Notification provider boundary checked',
  'Event/audit/outbox non-mutation evidence',
  'Duplicate/replay evidence',
  'BFF truth mutation blocked',
  'UI truth mutation blocked',
  'Missing reason/correlation/idempotency guard',
  'Panel evidence / maker-checker foundation present',
];

const coverageMatrix: CoverageEntry[] = [
  {
    area: 'Risk signal / score / owner handoff',
    smoke: riskSignalSmoke,
    risks: [
      'Risk owner truth mutation blocked',
      'BFF truth mutation blocked',
      'UI truth mutation blocked',
    ],
  },
  {
    area: 'Fraud signal / review / false-positive guard',
    smoke: fraudSignalReviewFalsePositiveGuardSmoke,
    risks: [
      'Fraud owner truth mutation blocked',
      'Missing reason/correlation/idempotency guard',
    ],
  },
  {
    area: 'Analytics event taxonomy / PII / non-mutation',
    smoke: analyticsSmoke,
    risks: [
      'Analytics PII masked/minimized',
      'Analytics non-mutation evidence',
    ],
  },
  {
    area: 'Notification dispatch / template / privacy / idempotency',
    smoke: notificationSmoke,
    risks: [
      'Notification PII masked/minimized',
      'Notification duplicate/idempotency evidence',
    ],
  },
  {
    area: 'Notification provider boundary',
    smoke: notificationProviderBoundarySmoke,
    risks: [
      'Notification provider boundary checked',
    ],
  },
  {
    area: 'Event audit taxonomy / non-mutation',
    smoke: eventAuditSmoke,
    risks: [
      'Event/audit/outbox non-mutation evidence',
    ],
  },
  {
    area: 'Event outbox duplicate/replay / non-mutation',
    smoke: eventOutboxSmoke,
    risks: [
      'Duplicate/replay evidence',
    ],
  },
  {
    area: 'PHASE-08 panel audit/evidence/maker-checker',
    smoke: panelAuditEvidenceMakerCheckerReadinessSmoke as any,
    risks: [
      'Panel evidence / maker-checker foundation present',
    ],
  },
  {
    area: 'PHASE-08 panel smoke coverage',
    smoke: panelSmokeCoverageFoundationSmoke as any,
    risks: [],
  },
];

function assertCoverageMatrix() {
  const coveredRisks = new Set(coverageMatrix.flatMap((entry) => entry.risks));
  for (const risk of requiredRisks) {
    assert.ok(coveredRisks.has(risk), `Coverage matrix missing risk: ${risk}`);
  }

  const requiredAreas = [
    'Risk signal / score / owner handoff',
    'Fraud signal / review / false-positive guard',
    'Analytics event taxonomy / PII / non-mutation',
    'Notification dispatch / template / privacy / idempotency',
    'Notification provider boundary',
    'Event audit taxonomy / non-mutation',
    'Event outbox duplicate/replay / non-mutation',
    'PHASE-08 panel audit/evidence/maker-checker',
    'PHASE-08 panel smoke coverage',
  ];
  const coveredAreas = new Set(coverageMatrix.map((entry) => entry.area));
  for (const area of requiredAreas) {
    assert.ok(coveredAreas.has(area), `Coverage matrix missing area: ${area}`);
  }
}

export const phase09SmokeCoverageFoundationSmoke: SmokeRunner = {
  name: 'PHASE-09 Smoke Coverage Foundation',
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
        message: `Coverage matrix verified; delegated smoke results: ${results.join(', ')}. NOTE: Panel evidence integration to risk/fraud/analytics is NOT a full production pipeline yet (foundation visibility only).`,
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  },
};