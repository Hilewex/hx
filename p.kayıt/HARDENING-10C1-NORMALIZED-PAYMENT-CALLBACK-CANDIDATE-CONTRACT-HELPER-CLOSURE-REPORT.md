# HARDENING-10C1 - Normalized Payment Callback Candidate Contract/Helper Closure Report

## 1. Kapsam

10C1 paketi, 10C0 inventory kararındaki normalized payment callback candidate modelini generic contract/helper seviyesinde kodladı.

Bu paket:

- Provider-specific PayTR mapping eklemez.
- Payment state mutation eklemez.
- Order handoff eklemez.
- Finance/risk mutation üretmez.
- Worker/queue/reconciliation runtime eklemez.
- BFF provider callback route davranışını değiştirmez.

## 2. Eklenen Contract

`packages/contracts/src/payment.ts` içine aşağıdaki generic contract alanları eklendi:

- `NormalizedPaymentCallbackStatus`
- `PaymentCallbackOwnerCommandCandidate`
- `NormalizedPaymentCallbackCandidate`
- `PaymentCallbackCandidateDecisionInput`
- `PaymentCallbackCandidateDecision`

Candidate modeli provider callback kaydını payment owner transition adayı olarak temsil eder. Model business truth değildir.

## 3. Eklenen Helper

`decidePaymentCallbackCandidate` saf karar fonksiyonu eklendi.

Ürettiği alanlar:

- `ownerCommandCandidate`
- `shouldProcess`
- `shouldReconcile`
- `shouldReject`
- `rejectionReason`

`createNormalizedPaymentCallbackCandidate` helper'ı eklendi. Bu helper candidate üretirken boundary flag'lerini `createProviderBoundaryFlags()` ile false tutar.

## 4. Karar Özeti

Process adayı olan minimum status'lar:

- `succeeded`
- `failed`
- `pending`
- `cancelled`
- `expired`

Reject/no-op adayı olan status'lar:

- `duplicate`
- `signature_failed`
- `unsupported`
- `rejected_amount_mismatch`
- `rejected_currency_mismatch`
- `rejected_reference_missing`
- `payment_attempt_not_found`
- `rejected_identity_conflict`
- `rejected_replay`
- `rejected_freshness`

Reconciliation adayı olan status'lar:

- `pending`
- `expired`
- `unknown_result`
- `unsupported`
- mismatch/reference/identity/not-found reject durumları

`paymentAttemptId` yoksa owner command candidate üretilmez; candidate reject + reconciliation/manual match adayı olarak kalır.

## 5. Smoke Coverage

Yeni suite:

- `tests/smoke/suites/payment-callback-candidate.ts`

Yeni script:

- `pnpm run smoke:payment-callback-candidate`

Smoke coverage:

- succeeded -> process candidate
- failed -> process candidate
- pending -> process + reconcile candidate
- duplicate -> reject/no-op
- signature_failed -> reject/no-op
- amount mismatch -> reject + reconcile
- unknown_result without paymentAttemptId -> no owner command + reject + reconcile
- boundary flags false invariant
- pure decision helper behavior

## 6. Verification

Çalıştırılan komutlar:

```text
pnpm --filter @hx/contracts run typecheck
pnpm run smoke:payment-callback-candidate
```

Sonuç:

```text
PASS - contracts typecheck
PASS - payment-callback-candidate smoke
```

## 7. Dokunulmayan Alanlar

Aşağıdaki alanlara dokunulmadı:

- `apps/bff/src/server/provider-callback.ts`
- `services/payment/src/payment.ts`
- provider secret/env/config
- `.env.example`
- worker/consumer/queue
- reconciliation runtime
- order handoff
- finance correction
- risk signal üretimi
- migration/persistence davranışı
- `HARDENING_PROGRESS_RECORD`

Git komutu çalıştırılmadı.

## 8. Nihai Karar

**HARDENING-10C1 COMPLETE**

Normalized payment callback candidate contract/helper hazırdır. Domain processing hâlâ başlamamıştır. Sıradaki implementation paketi PayTR-specific mapping foundation veya async worker foundation olmalıdır; payment owner mutation bu paketin kapsamı dışındadır.
