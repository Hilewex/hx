const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('bash -c "pwd; ls -la; git rev-parse --show-toplevel 2>/dev/null || echo GIT_ROOT_BULUNAMADI"', { encoding: 'utf-8' });
  console.log('--- PHASE 1 ---');
  console.log(result);
  
  const files1 = execSync('bash -c "find . -path \\"*provider-callback*\\" -type f; find . -path \\"*payment*\\" -type f; find . -path \\"*order*\\" -type f; find . -path \\"*settlement*\\" -type f; find . -path \\"*reconciliation*\\" -type f; find . -path \\"*outbox*\\" -type f; find . -path \\"*audit*\\" -type f"', { encoding: 'utf-8' });
  console.log('--- PHASE 2 ---');
  console.log(files1);
  
  const grep1 = execSync('bash -c "grep -R \\"handleProviderCallbackIngestion\\\\|recordProviderCallbackEvent\\\\|verifyProviderCallbackSignature\\\\|existingByIdempotencyKey\\\\|existingByProviderEventId\\\\|simulatePaymentSuccess\\\\|createOrderFromPayment\\\\|createSettlementFromOrder\\\\|PaymentSucceeded\\\\|payment.succeeded\\\\|order.created\\\\|settlement.created\\\\|appendAuditLog\\\\|outbox\\" -n apps services packages infra package.json 2>/dev/null | head -300"', { encoding: 'utf-8' });
  console.log('--- PHASE 3 ---');
  console.log(grep1);

} catch(e) {
  console.error(e.message);
}
