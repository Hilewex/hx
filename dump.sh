#!/bin/bash
echo '--- PHASE 1 ---'
pwd
ls -la
git rev-parse --show-toplevel 2>/dev/null || echo GIT_ROOT_BULUNAMADI
echo '--- PHASE 2 ---'
find . -path "*provider-callback*" -type f
find . -path "*payment*" -type f
find . -path "*order*" -type f
find . -path "*settlement*" -type f
find . -path "*reconciliation*" -type f
find . -path "*outbox*" -type f
find . -path "*audit*" -type f
echo '--- PHASE 3 ---'
grep -RE "handleProviderCallbackIngestion|recordProviderCallbackEvent|verifyProviderCallbackSignature|existingByIdempotencyKey|existingByProviderEventId|simulatePaymentSuccess|createOrderFromPayment|createSettlementFromOrder|PaymentSucceeded|payment.succeeded|order.created|settlement.created|appendAuditLog|outbox" apps services packages infra package.json 2>/dev/null | head -300
