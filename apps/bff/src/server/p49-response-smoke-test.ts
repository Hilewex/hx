import * as fs from 'fs';
import * as path from 'path';

function checkFileContains(filePath: string, patterns: string[], forbiddenPatterns: string[] = []) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] File not found: ${filePath}`);
    return false;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  let success = true;

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      console.error(`[FAIL] Expected pattern not found in ${filePath}: ${pattern}`);
      success = false;
    }
  }

  for (const forbidden of forbiddenPatterns) {
    if (content.includes(forbidden)) {
      console.error(`[FAIL] Forbidden pattern found in ${filePath}: ${forbidden}`);
      success = false;
    }
  }

  if (success) {
    console.log(`[PASS] ${filePath}`);
  }
  return success;
}

async function runSmokeTest() {
  console.log('--- P49 Response Hardening Source Review Smoke Test ---');
  let overallSuccess = true;

  // 1. response.ts Logic Check
  const responseContent = fs.readFileSync(path.resolve('src/server/response.ts'), 'utf8');
  if (responseContent.includes("'transport'") && responseContent.includes('isNotFoundError')) {
    console.log('[PASS] response.ts: notFound category corrected and isNotFoundError added');
  } else {
    console.error('[FAIL] response.ts: category or helper missing');
    overallSuccess = false;
  }

  // 2. Raw Error Leakage check in all P49 handlers
  const handlers = [
    'src/server/risk.ts',
    'src/server/order-ops.ts',
    'src/server/finance-correction.ts',
    'src/server/settlement.ts',
    'src/server/payout.ts',
    'src/server/notification.ts',
    'src/server/analytics.ts'
  ];

  for (const handler of handlers) {
    overallSuccess = checkFileContains(handler,
      ['response.internalError', 'response.isNotFoundError'],
      ['internalError(..., error.message)', 'internalError(..., err.message)', 'internalError(..., e.message)', '{ error: error.message }']
    ) && overallSuccess;
  }

  // 3. payout.ts specific check (payoutItemId)
  overallSuccess = checkFileContains('src/server/payout.ts',
    ['query.payoutItemId', '{ payoutItemId }'],
    ['query.itemId']
  ) && overallSuccess;

  // 4. index.ts Fallback Check (P49 routes should not have || result.data)
  const indexContent = fs.readFileSync(path.resolve('src/server/index.ts'), 'utf8');
  const p49RouteKeys = [
    '/risk/',
    '/order-ops/',
    '/settlement/',
    '/payout/',
    '/analytics/',
    '/notification/',
    '/finance-correction/'
  ];

  for (const key of p49RouteKeys) {
    // Look for lines matching the key and check if they contain || result.data
    const lines = indexContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(key)) {
        // Check next few lines for sendJson
        for (let j = 1; j <= 5 && (i + j) < lines.length; j++) {
          if (lines[i + j].includes('sendJson') && lines[i + j].includes('|| result.data')) {
            console.error(`[FAIL] index.ts: Legacy fallback found for route ${key} at line ${i + j + 1}`);
            overallSuccess = false;
          }
        }
      }
    }
  }

  // 5. Source review: No @hx/*/src tarzı source import yok
  const serverFiles = fs.readdirSync(path.resolve('src/server'));
  for (const file of serverFiles) {
    if (file.endsWith('.ts')) {
      const content = fs.readFileSync(path.resolve('src/server', file), 'utf8');
      if (content.match(/from ['"]@hx\/.*\/src/)) {
        console.error(`[FAIL] Forbidden source import found in src/server/${file}`);
        overallSuccess = false;
      }
    }
  }

  if (overallSuccess) {
    console.log('\n[RESULT] ALL P49 SMOKE TESTS PASSED');
    process.exit(0);
  } else {
    console.error('\n[RESULT] P49 SMOKE TEST FAILED');
    process.exit(1);
  }
}

runSmokeTest();
