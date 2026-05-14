import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { getAdminHeaders } from '../auth-utils';
import { SmokeRunner } from '../types';

const repoRoot = process.cwd();

const sourceGuardTargets = [
  'services/admin/src/ops-projections.ts',
  'apps/bff/src/server/ops-center.ts',
  'apps/web/src/components/admin-ops-surface.tsx',
  'apps/web/src/lib/bff/admin.ts',
];

const mutationLeakPatterns = [
  'executePayout',
  'createPaymentInstruction',
  'finalizeSettlement',
  'appendLedgerEntry',
  'applyFinanceCorrection',
  'markPaid',
  'releasePayout',
  'retryPayout',
  'settlementFinalize',
  'ownerStateMutated: true',
  'businessTruthMutated: true',
];

const mutationLeakRegexPatterns = [
  {
    label: 'providerPayout',
    regex: /\bproviderPayout(?!Executed\b)\b/,
  },
];

const businessActionTokens = [
  'approve',
  'release',
  'finalize',
  'pay',
  'retry payout',
  'append ledger',
  'apply correction',
  'execute payout',
];

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFalseFlags(data: any) {
  assert.ok(data && typeof data === 'object', 'Finance ops response data must be an object');
  assert.ok(data.boundaryFlags && typeof data.boundaryFlags === 'object', 'Finance ops response must include boundaryFlags');

  assert.strictEqual(data.boundaryFlags.projectionOnly, true, 'projectionOnly must be true');
  assert.strictEqual(data.boundaryFlags.enforcementExecuted, false, 'enforcementExecuted must be false');
  assert.strictEqual(data.boundaryFlags.settlementTruthMutated, false, 'settlementTruthMutated must be false');
  assert.strictEqual(data.boundaryFlags.payoutTruthMutated, false, 'payoutTruthMutated must be false');
  assert.strictEqual(data.boundaryFlags.ledgerTruthMutated, false, 'ledgerTruthMutated must be false');
  assert.strictEqual(data.boundaryFlags.financeCorrectionTruthMutated, false, 'financeCorrectionTruthMutated must be false');
  assert.strictEqual(data.boundaryFlags.providerPayoutExecuted, false, 'providerPayoutExecuted must be false');

  assert.ok(data.payoutBatchSummary && typeof data.payoutBatchSummary === 'object', 'Finance ops response must include payoutBatchSummary');
  if ('providerExecutionPerformed' in data.payoutBatchSummary) {
    assert.strictEqual(data.payoutBatchSummary.providerExecutionPerformed, false, 'providerExecutionPerformed must be false');
  }
}

function assertGroupProjectionOnly(data: any) {
  for (const field of ['settlement', 'payout', 'financeCorrection']) {
    assert.ok(Array.isArray(data[field]), `${field} must be a projection group list`);
  }
  assert.ok(data.ledger && typeof data.ledger === 'object', 'ledger must be a projection group');
  assert.ok(data.reconciliation && typeof data.reconciliation === 'object', 'reconciliation must be a projection group');

  const groups = [...data.settlement, ...data.payout, ...data.financeCorrection, data.ledger, data.reconciliation];
  for (const group of groups) {
    assert.ok(typeof group.groupId === 'string' && group.groupId.length > 0, 'groupId must be present');
    assert.ok(Array.isArray(group.items), `group ${group.groupId} must expose items as projection data`);
    assert.ok(typeof group.totalProjection === 'number', `group ${group.groupId} must expose totalProjection`);
    assert.strictEqual('ownerStateMutated' in group, false, `group ${group.groupId} must not expose ownerStateMutated`);
    assert.strictEqual('businessTruthMutated' in group, false, `group ${group.groupId} must not expose businessTruthMutated`);
    for (const item of group.items) {
      assert.strictEqual('ownerStateMutated' in item, false, `item ${item.id} must not expose ownerStateMutated`);
      assert.strictEqual('businessTruthMutated' in item, false, `item ${item.id} must not expose businessTruthMutated`);
      assert.strictEqual('mutationResult' in item, false, `item ${item.id} must not expose mutationResult`);
    }
  }
}

async function assertGetFinanceOpsProjection(baseUrl: string) {
  const response = await fetch(`${baseUrl}/admin/ops/finance`, {
    method: 'GET',
    headers: getAdminHeaders('admin-finance-ops-smoke'),
  });
  assert.strictEqual(response.status, 200, `GET /admin/ops/finance expected 200, got ${response.status}`);

  const envelope = await response.json();
  assert.ok(envelope && typeof envelope === 'object', 'GET response must be a JSON object');
  assert.ok('data' in envelope, 'GET response must use the success envelope data field');

  assertFalseFlags(envelope.data);
  assertGroupProjectionOnly(envelope.data);
}

async function assertPostFinanceOpsRejected(baseUrl: string) {
  const response = await fetch(`${baseUrl}/admin/ops/finance`, {
    method: 'POST',
    headers: getAdminHeaders('admin-finance-ops-smoke'),
    body: JSON.stringify({ action: 'executePayout' }),
  });
  assert.ok(
    [404, 405].includes(response.status),
    `POST /admin/ops/finance must not be accepted; expected 404/405, got ${response.status}`
  );

  const body = await response.json().catch(() => null);
  if (body) {
    assert.ok(body.errors || body.error, 'POST rejection should use an error envelope or legacy error field');
    assert.strictEqual('data' in body, false, 'POST rejection must not return success data');
  }
}

function assertNoMutationLeakPatterns() {
  for (const relativePath of sourceGuardTargets) {
    const source = readRepoFile(relativePath);
    for (const pattern of mutationLeakPatterns) {
      assert.strictEqual(
        source.includes(pattern),
        false,
        `${relativePath} must not contain finance mutation leak pattern: ${pattern}`
      );
    }
    for (const pattern of mutationLeakRegexPatterns) {
      assert.strictEqual(
        pattern.regex.test(source),
        false,
        `${relativePath} must not contain finance mutation leak pattern: ${pattern.label}`
      );
    }
  }
}

function assertUiNoBusinessActionInvariant() {
  const source = readRepoFile('apps/web/src/components/admin-ops-surface.tsx');
  const start = source.indexOf('function AdminFinanceOpsCockpit');
  const end = source.indexOf('function FinanceOpsGroupList', start);
  assert.ok(start >= 0 && end > start, 'AdminFinanceOpsCockpit source block must be discoverable');

  const cockpit = source.slice(start, end);
  const actionableSnippets = [
    ...cockpit.matchAll(/<button[\s\S]*?<\/button>/gi),
    ...cockpit.matchAll(/onClick=\{[^}]+\}/gi),
    ...cockpit.matchAll(/\bhandle[A-Z][A-Za-z0-9_]*\b/g),
  ].map((match) => match[0].toLowerCase());

  const refetchRetryOnly = (snippet: string) => snippet.includes('retry') && !snippet.includes('payout');
  for (const snippet of actionableSnippets) {
    for (const token of businessActionTokens) {
      if (token === 'retry payout' && refetchRetryOnly(snippet)) continue;
      assert.strictEqual(
        snippet.includes(token),
        false,
        `AdminFinanceOpsCockpit must not expose business action token "${token}" in actionable UI: ${snippet}`
      );
    }
  }
}

export const adminFinanceOpsProjectionSmoke: SmokeRunner = {
  name: 'Admin Finance Ops Projection Endpoint Smoke',
  run: async (baseUrl: string) => {
    try {
      await assertGetFinanceOpsProjection(baseUrl);
      await assertPostFinanceOpsRejected(baseUrl);
      assertNoMutationLeakPatterns();
      assertUiNoBusinessActionInvariant();
      return {
        result: 'PASS',
        message: 'GET projection-only invariants, POST method guard, source mutation guard, and UI no-action invariant verified',
      };
    } catch (error: any) {
      return { result: 'FAIL', message: error instanceof Error ? error.message : JSON.stringify(error) };
    }
  },
};
