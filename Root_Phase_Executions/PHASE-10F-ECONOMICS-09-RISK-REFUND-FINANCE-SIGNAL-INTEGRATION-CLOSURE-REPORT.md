# PHASE-10F-ECONOMICS-09 - RISK / REFUND / FINANCE SIGNAL INTEGRATION FOUNDATION CLOSURE REPORT

## Degisen Dosyalar

- `packages/contracts/src/settlement.ts`
- `packages/contracts/src/settlement.d.ts`
- `services/settlement/src/settlement.ts`
- `tests/smoke/suites/settlement-payable-earning-signal-integration-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `PHASE-10F-ECONOMICS-09-RISK-REFUND-FINANCE-SIGNAL-INTEGRATION-CLOSURE-REPORT.md`

Not: Repo calisma agaci bu faz oncesinden de kirliydi. Build sonrasi mevcut `dist` / `tsbuildinfo` / `.next` dosyalari guncellenmis olabilir.

## Signal Alanlari

Supplier payable ve creator earning modeline foundation signal alanlari eklendi:

- `riskHoldActive?: boolean`
- `refundImpactPending?: boolean`
- `financeCorrectionPending?: boolean`
- `externalReviewRequired?: boolean`

`createSettlementFromOrder` path'inde payable/earning kayitlari settlement line `impactSummary` uzerinden bu alanlari tasir:

- `riskHoldActive`
- `refundImpactPending`
- `financeCorrectionPending`

`externalReviewRequired` foundation seviyesinde model alanidir ve otomatik dis servis execution sonucu uretilmez; default creation path'inde `false` kalir.

## Release Blocking Davranisi

Release eligibility guard'lari asagidaki signal alanlarini bloklayici hale getirdi:

- `riskHoldActive=true` -> `RISK_HOLD_ACTIVE`
- `refundImpactPending=true` -> `REFUND_IMPACT_PENDING`
- `financeCorrectionPending=true` -> `FINANCE_CORRECTION_PENDING`
- `externalReviewRequired=true` -> `EXTERNAL_REVIEW_REQUIRED`

Bu bloklar sadece release evaluation sonucunu etkiler. Kayit `PENDING` ise ve signal yoksa `RELEASE_ELIGIBLE` olabilir. Signal varsa status mutation yapilmaz.

## Signal Kaynaklari

Settlement source propagation foundation seviyesinde asagidaki okuma kaynaklarindan gelir:

- Risk: `listRiskCases({ targetId: orderId })`; aktif risk case varsa `riskHoldActive=true`, `sourceRefs` icine `RISK` evidence ref eklenir.
- Refund/cancel-return: `getCancelReturnRequestsByOrderId(orderId)`; aktif cancel/return state varsa `refundImpactPending=true`, `sourceRefs` icine `CANCEL_RETURN` evidence ref eklenir.
- Finance correction: `listFinanceCorrections({ targetId: orderId })`; aktif correction state varsa `financeCorrectionPending=true`, `sourceRefs` icine `FINANCE_CORRECTION` evidence ref eklenir.
- External review: sadece modele tasindi; bu fazda otomatik owner/review engine signal uretimi yok.

Sahte risk/refund/finance sonucu uretilmedi. Settlement sadece mevcut servislerdeki okunabilir evidence'i source ref olarak tasir.

## Otomatik Mutation

Otomatik mutation acilmadi:

- Provider payout yok.
- Payment instruction yok.
- Payout batch yok.
- Ledger append yok.
- Settlement finalize yok.
- Finance correction apply yok.
- Gercek refund mutation yok.
- Risk engine execution yok.

## Boundary Kapali Davranis

Release result boundary flags kapali kalir:

- `payoutCreated=false`
- `ledgerEntryCreated=false`
- `providerPayoutExecuted=false`
- `paymentInstructionCreated=false`

Payable/earning creation boundary flags kapali kalir:

- `payoutCreated=false`
- `ledgerEntryCreated=false`
- `providerPayoutExecuted=false`

Static guard su yasak pattern'leri yeni smoke kapsaminda taradi ve bulmadi:

- `executePayout`
- `createPayoutBatch`
- `providerPayout`
- `appendLedgerEntry`
- `applyFinanceCorrection`
- `paymentInstructionCreated: true`
- `payoutCreated: true`
- `ledgerEntryCreated: true`

## Yeni Smoke

Yeni smoke:

- `settlement-payable-earning-signal-integration-foundation`

Dogrulananlar:

- `riskHoldActive=true` release reject eder.
- `refundImpactPending=true` release reject eder.
- `financeCorrectionPending=true` release reject eder.
- `externalReviewRequired=true` release reject eder.
- Signal olmayan normal `PENDING` payable `RELEASE_ELIGIBLE` olabilir.
- Risk case evidence'i settlement source refs uzerinden payable/earning kaydina tasinir.
- Payout item olusmaz.
- Provider payout yoktur.
- Ledger append yoktur.
- Payment instruction yoktur.

## Smoke Sonuclari

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-signal-integration-foundation`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-release-eligibility-foundation`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-reversal-foundation`: PASS
- `pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL with default env, `ECONNREFUSED`
- `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL, `ECONNREFUSED`

Not: Ilk `typecheck` denemesi contracts `dist` henuz yenilenmeden settlement service'in eski declaration'lari gormesi nedeniyle dustu. `pnpm.cmd --filter @hx/contracts run build` ve root `build` sonrasi final `typecheck` PASS oldu. Local Postgres 5432 bu oturumda baglanti kabul etmedi.

## Kalan Limitations

- Signal integration foundation seviyesindedir.
- Payable/earning Postgres table migration'i eklenmedi.
- `externalReviewRequired` icin otomatik owner/review workflow source'u baglanmadi.
- Risk service settlement truth veya payout truth mutate etmez.
- Refund service otomatik settlement release/reversal cagrisi yapmaz.
- Finance correction service otomatik settlement release/reversal veya apply cagrisi yapmaz.
- Payout item create yok.
- Payout batch create yok.
- Provider payout yok.
- Payment instruction yok.
- Ledger append yok.
- Settlement finalize yok.
- Finance correction apply yok.
