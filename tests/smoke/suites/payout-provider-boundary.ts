
import { SmokeRunner, SmokeResult } from '../types';
import { randomUUID } from 'crypto';
import { getAdminHeaders } from '../auth-utils';


let payoutItemId: string;
let payoutBatchId: string;

async function createTestPayoutItem(baseUrl: string, context: any) {
    const res = await fetch(new URL('/payout/smoke-test-item', baseUrl).toString(), {
        method: 'POST',
        headers: getAdminHeaders(context.actorId),
        body: JSON.stringify({ beneficiaryType: 'CREATOR', beneficiaryId: 'smoke-beneficiary' }),
    });

    if (!res.ok) {
        throw new Error(`Failed to create test payout item: ${await res.text()}`);
    }
    const payoutData = await res.json();
    if (!payoutData.data.payoutItems[0]) {
        throw new Error('Payout item not found in response');
    }
    payoutItemId = payoutData.data.payoutItems[0].payoutItemId;
    return payoutItemId;
}



async function createPayoutBatch(baseUrl: string, context: any) {
    const res = await fetch(new URL('/payout/batch/create', baseUrl).toString(), {
        method: 'POST',
        headers: getAdminHeaders(context.actorId),
        body: JSON.stringify({
            payoutItemIds: [payoutItemId],
            batchType: 'FOUNDATION_SIMULATION',
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to create payout batch: ${await res.text()}`);
    }
    const batchData = await res.json();
    if (!batchData.data.batch) {
        throw new Error('Payout batch not found in response');
    }
    payoutBatchId = batchData.data.batch.batchId;
    return payoutBatchId;
}

async function approveBatchAndTriggerBoundary(baseUrl: string, context: any) {
    const res = await fetch(new URL('/payout/batch/action', baseUrl).toString(), {
        method: 'POST',
        headers: getAdminHeaders(context.actorId),
        body: JSON.stringify({
            batchId: payoutBatchId,
            targetStatus: 'APPROVED',
            actorId: context.actorId,
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to approve batch: ${await res.text()}`);
    }
    return await res.json();
}

async function verifyProviderBoundaryResult(baseUrl: string, context: any) {
    const res = await fetch(new URL(`/payout/item?payoutItemId=${payoutItemId}`, baseUrl).toString(), {
        headers: getAdminHeaders(context.actorId),
    });

    if (!res.ok) {
        throw new Error(`Could not fetch updated payout item: ${await res.text()}`);
    }
    const itemData = await res.json();
    const item = itemData.data.payoutItem;

    const envelope = item.providerEnvelope;
    if (!envelope) {
        throw new Error('Provider envelope was not saved on payout item.');
    }

    const flags = envelope.boundary;
    if (flags.providerTruth !== false || flags.businessTruthMutated !== false || flags.ownerStateMutated !== false) {
        throw new Error(`Boundary flags were not all false. Flags: ${JSON.stringify(flags)}`);
    }

    if (envelope.providerDomain !== 'payout') {
        throw new Error(`providerDomain is not 'payout'. Value: ${envelope.providerDomain}`);
    }

    if (item.executionSummary.actualProviderPayoutPerformed !== false) {
        throw new Error('actualProviderPayoutPerformed was incorrectly set to true.');
    }

    if (item.status !== 'PROCESSING') {
        throw new Error(`Item status should be PROCESSING, but was ${item.status}.`);
    }

    if (item.amountSummary.paidAmount > 0) {
        throw new Error('paidAmount should be 0 after provider simulation.');
    }
}

export const payoutProviderBoundarySmoke: SmokeRunner = {
  name: 'payout-provider-boundary',
  run: async (baseUrl: string): Promise<{ result: SmokeResult; message: string }> => {
    const context = { actorId: 'system-finance-smoke' };
    const steps: { name: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string }[] = [];

    const runStep = async (name: string, fn: () => Promise<any>) => {
      if (steps.some(s => s.status === 'FAIL')) {
        steps.push({ name, status: 'SKIPPED', message: 'Skipped due to previous step failure.' });
        return;
      }
      try {
        await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.' });
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
      }
    };

    await runStep('Create Test Payout Item', () => createTestPayoutItem(baseUrl, context));
    await runStep('Create Payout Batch', () => createPayoutBatch(baseUrl, context));
    await runStep('Approve Batch and Trigger Boundary', () => approveBatchAndTriggerBoundary(baseUrl, context));
    await runStep('Verify Provider Boundary Result', () => verifyProviderBoundaryResult(baseUrl, context));

    const finalResult: SmokeResult = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'Payout provider boundary smoke test passed.'
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    return { result: finalResult, message };
  },
};
