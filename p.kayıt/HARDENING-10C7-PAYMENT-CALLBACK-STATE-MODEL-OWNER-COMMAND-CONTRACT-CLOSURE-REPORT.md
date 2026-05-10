# HARDENING-10C7 - Payment Callback State Model / Owner Command Contract Foundation Closure Report

## 1. Paket Adi

HARDENING-10C7 - Payment Callback State Model / Owner Command Contract Foundation

## 2. Amac

10C6 inventory kararina gore payment callback owner command contract foundation kuruldu. Payment/paymentAttempt state model gap'leri contract seviyesinde genisletildi, owner command decision/idempotency helper'lari saf model seviyesinde dogrulandi.

Bu paket worker runtime, payment state mutation implementation, order handoff, finance/risk mutation veya PayTR live initiate paketi degildir.

## 3. Degisen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/payment-callback-owner-command.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C7-PAYMENT-CALLBACK-STATE-MODEL-OWNER-COMMAND-CONTRACT-CLOSURE-REPORT.md`

`packages/contracts/src/index.ts` degismedi; `payment.ts` zaten export edildigi icin ek export gerekmedi.

## 4. State Model Genisletmesi

`PaymentState` mevcut degerler korunarak genisletildi:

- `PENDING`
- `UNKNOWN_RESULT`

`PaymentAttemptState` mevcut degerler korunarak genisletildi:

- `PENDING`
- `FAILED`
- `CANCELLED`
- `EXPIRED`
- `UNKNOWN_RESULT`

Bu degisiklik yalniz contract modelidir. Payment state mutation implementation eklenmedi.

## 5. PaymentAttempt Provider Reference Alanlari

`PaymentAttempt` uzerine optional provider/callback reference alanlari eklendi:

- `providerName`
- `providerReference`
- `providerEventId`
- `providerOrderId`
- `callbackRecordId`
- `lastCallbackAt`
- `lastCallbackStatus`

Bu alanlar PayTR `merchant_oid` stratejisinin ileride payment attempt/provider reference iliskisi olarak saklanabilmesi icindir. Repository davranisi veya persistence migration eklenmedi.

## 6. Owner Command Contract

`PaymentCallbackOwnerCommandType`, `PaymentCallbackOwnerCommand`, `PaymentCallbackOwnerCommandDecisionStatus` ve `PaymentCallbackOwnerCommandDecision` contract'lari eklendi.

Owner command source sabit olarak `provider_callback_worker` tasir. Boundary flags `createProviderBoundaryFlags()` ile false kalir. Bu contract owner mutation yetkisi vermez; yalniz ileride payment owner API'sine gidecek command modelini tanimlar.

`MARK_PAYMENT_UNKNOWN_RESULT` command type future-ready olarak union'a eklendi. Ancak bu pakette `unknown_result` icin `command_ready` uretilmez; reconciliation gerekir.

## 7. Idempotency Key Karari

`createPaymentCallbackOwnerCommandIdempotencyKey` eklendi.

Provider event id varsa format:

```text
payment-callback:payment:{providerName}:{providerEventId}:{paymentAttemptId}:{commandType}
```

Provider event id yoksa callback record id fallback format:

```text
payment-callback:payment:{providerName}:record:{callbackRecordId}:{paymentAttemptId}:{commandType}
```

Smoke ile su deterministic stringler dogrulandi:

- `payment-callback:payment:paytr:MERCHANT123:attempt-1:MARK_PAYMENT_SUCCEEDED`
- `payment-callback:payment:paytr:record:callback-1:attempt-1:MARK_PAYMENT_FAILED`

## 8. Decision Helper Davranisi

`decidePaymentCallbackOwnerCommand` eklendi.

Davranis:

- `candidate.shouldReject=true` ise `candidate_rejected` doner.
- `signatureVerified=false` ise `command_ready` donmez.
- `replayDetected=true` ise `command_ready` donmez.
- `normalizedStatus=succeeded` ve `verificationStatus !== verified` ise `command_ready` donmez.
- `pending` ve `unknown_result` icin `candidate_requires_reconciliation` doner.
- paymentAttemptId yoksa `missing_payment_attempt` doner ve command olusmaz.
- `ownerCommandCandidate=NONE` icin command olusmaz.
- Valid succeeded/failed candidate icin command, idempotency key ve boundary false uretilir.

`PaymentCallbackOwnerCommandCandidate` -> `PaymentCallbackOwnerCommandType` mapper eklendi. `NONE` command type'a map edilmez.

## 9. PayTR Merchant OID / Lookup Plan Karari

`PaymentCallbackLookupStrategy`, `PaymentCallbackLookupPlan` ve `createPaytrPaymentCallbackLookupPlan` eklendi.

PayTR lookup plan:

- primary: `provider_reference`
- fallbacks: `payment_attempt_id`, `idempotency_key`, `manual_reconciliation`
- providerReferenceStrategy: `paytr_merchant_oid_as_provider_reference`
- requiresInitiateContract: `true`
- boundary false

Bu sadece plan/contract'tir. Repository providerReference lookup implementation eklenmedi. PayTR initiate `merchant_oid` contract implementation eklenmedi.

## 10. Smoke Senaryolari

Yeni pure smoke suite: `payment-callback-owner-command`

Dogrulanan senaryolar:

- Succeeded candidate + paymentAttemptId -> `command_ready`, `MARK_PAYMENT_SUCCEEDED`
- Failed candidate + paymentAttemptId -> `command_ready`, `MARK_PAYMENT_FAILED`
- Pending candidate -> reconciliation, command yok
- Unknown result -> reconciliation, command yok
- Missing paymentAttemptId -> `missing_payment_attempt`, command yok
- Signature failed -> `candidate_rejected`, command yok
- Replay detected -> `candidate_rejected`, command yok
- Unsupported verification with succeeded -> `command_ready` degil
- ProviderEventId ile idempotency key
- CallbackRecordId fallback idempotency key
- PayTR lookup plan
- Payment/paymentAttempt state extension compile/runtime assertion

## 11. Degismeyen / Yasakli Alanlar

Asagidaki alanlara implementation degisikligi yapilmadi:

- Worker/consumer/polling runtime
- BFF route/handler
- `apps/bff/src/server/provider-callback.ts`
- Payment repository behavior
- Payment state mutation implementation
- `services/payment/src/payment.ts` callback processing
- `simulatePaymentSuccess` davranisi
- Order create/order handoff
- Finance correction/risk signal
- Migration/persistence behavior
- PayTR live initiate request
- Gercek merchant key/salt/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 12. Calistirilan Komutlar ve Sonuclari

1. `pnpm --filter @hx/contracts run build` - PASS
2. `pnpm run typecheck` - PASS
3. `pnpm run build` - PASS
4. `pnpm run smoke:payment-callback-owner-command` - PASS
5. `pnpm run smoke:payment-callback-candidate` - PASS
6. `pnpm run smoke:paytr-callback-mapping` - PASS
7. `pnpm run smoke:provider-boundary` - PASS

## 13. Boundary Sonucu

Provider boundary flags false kalir:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

Owner command helper payment truth mutate etmez. Worker/order/finance/risk etkisi yoktur.

## 14. Kalan Limitler

- Worker runtime yok.
- Payment owner mutation implementation yok.
- Repository providerReference lookup yok.
- PayTR initiate merchant_oid contract implementation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Reconciliation runtime yok.
- Real PayTR E2E yok.

## 15. Nihai Karar

**PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz state model ve owner command contract foundation kurar. Worker runtime, payment owner mutation implementation, providerReference lookup, PayTR initiate merchant_oid contract, order handoff, reconciliation, finance/risk linkage ve real PayTR E2E sonraki paketlerde ele alinacaktir.
