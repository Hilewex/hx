import * as moderation from './moderation';
import { closePool } from '@hx/persistence';

async function testPersistence() {
  const mode = process.env.PERSISTENCE_MODE || 'memory';
  console.log(`--- Testing Moderation Persistence (${mode}) ---`);
  
  try {
    // 1. Create Case
    console.log('1. Creating case...');
    const createResult = await moderation.createModerationCase({
      target: { targetType: 'STORE_POST', targetId: 'post_123' },
      source: 'USER_REPORT',
      contentText: 'Test content',
      idempotencyKey: 'test_key_' + Date.now()
    });
    console.log('Create result:', createResult);

    if (!createResult.caseId) throw new Error('Case ID not returned');

    // 2. Get Case
    console.log('2. Getting case...');
    const getResult = await moderation.getModerationCase({ caseId: createResult.caseId });
    console.log('Get result status:', getResult.data.status);
    console.log('targetTruthMutated:', getResult.data.targetTruthMutated);

    if (getResult.data.targetTruthMutated !== false) {
      throw new Error('SECURITY_VIOLATION: targetTruthMutated must be false');
    }

    // 3. Review Case
    console.log('3. Reviewing case...');
    const reviewResult = await moderation.reviewModerationCase({
      caseId: createResult.caseId,
      decision: 'APPROVE',
      note: 'Looks good'
    });
    console.log('Review result:', reviewResult);

    // 4. List Cases
    console.log('4. Listing cases...');
    const listResult = await moderation.listModerationCases({ targetType: 'STORE_POST' });
    console.log('List result count:', listResult.items.length);

    console.log('--- Test Completed Successfully ---');
  } catch (error) {
    console.error('--- Test Failed ---');
    console.error(error);
    process.exit(1);
  } finally {
    if (mode === 'postgres') {
      await closePool();
    }
  }
}

testPersistence();
