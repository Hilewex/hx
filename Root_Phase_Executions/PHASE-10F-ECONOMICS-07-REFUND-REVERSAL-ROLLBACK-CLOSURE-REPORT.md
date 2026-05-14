# PHASE-10F-ECONOMICS-07 - REFUND / REVERSAL / ROLLBACK FOUNDATION CLOSURE REPORT

## Degisen Dosyalar

- `packages/contracts/src/settlement.ts`
- `packages/contracts/src/settlement.d.ts`
- `services/settlement/src/settlement.ts`
- `services/settlement/src/repository/interface.ts`
- `services/settlement/src/repository/in-memory.ts`
- `services/settlement/src/repository/postgres.ts`
- `tests/smoke/suites/settlement-payable-earning-reversal-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `PHASE-10F-ECONOMICS-07-REFUND-REVERSAL-ROLLBACK-CLOSURE-REPORT.md`

Not: Repo calisma agaci bu faz oncesinden de kirliydi. Build sonrasi mevcut `dist` / `tsbuildinfo` / `.next` dosyalari guncellenmis olabilir.

## Reversal Modeli

Settlement contract tarafina supplier payable ve creator earning icin reversal foundation command/result modeli eklendi:

- `ReverseSettlementSupplierPayableCommand`
- `ReverseSettlementCreatorEarningCommand`
- `SettlementSupplierPayableReversal`
- `SettlementCreatorEarningReversal`
- `SettlementSupplierPayableReversalResult`
- `SettlementCreatorEarningReversalResult`

Minimum reversal alanlari:

- `sourceRefundId` veya `refundId`
- `settlementLineId`
- `payableId` / `earningId`
- `reasonCode`
- `reversalAmount`
- `actorId` / `systemActor`
- `idempotencyKey`
- `sourceRefs`
- `createdAt`

## Status Davranisi

Otomatik reverse edilen statuslar:

- `PENDING`
- `HELD`
- `RELEASE_ELIGIBLE`

Bu statuslarda payable/earning kaydi `REVERSED` yapilir ve reversal sonucu `status=REVERSED` doner.

Review required davranisi:

- `PAYOUT_READY` bu fazda otomatik reverse edilmez.
- Sonuc `status=REVIEW_REQUIRED` ve `PAYOUT_READY_REVERSAL_REQUIRES_MANUAL_REVIEW` warning'i ile doner.
- Payable/earning status'u degistirilmez.

Idempotent davranis:

- Ayni `idempotencyKey` ve ayni command fingerprint tekrar gelirse sonuc `IDEMPOTENT` doner.
- Zaten `REVERSED` durumdaki payable/earning icin tekrar reverse cagrisi mutation yapmadan idempotent sonuc uretir.
- Ayni `idempotencyKey` farkli payload ile gelirse `DUPLICATE_IDEMPOTENCY_KEY_CONFLICT` ile reject edilir.

## Amount Guard

- `reversalAmount > 0` zorunlu.
- `reversalAmount` mevcut payable/earning amount'unu asamaz.
- Partial reversal bu fazda desteklenmedi.
- `reversalAmount` mevcut amount'tan kucukse `PARTIAL_REVERSAL_NOT_SUPPORTED` ile reject edilir.
- Bu faz sadece full reversal yapar; remaining amount field eklenmedi.

## Boundary Flags

Reversal result ve reversal kaydi asagidaki kapali boundary flag'lerini tasir:

- `ledgerEntryCreated=false`
- `providerPayoutReversed=false`
- `payoutMutationPerformed=false`
- `financeCorrectionCreated=false`

Kesin kapali kalan davranislar:

- Provider refund yok.
- Provider payout reversal yok.
- Payment instruction yok.
- Gercek para cikisi yok.
- Ledger append yok.
- Payout execution yok.
- Settlement finalize yok.
- Finance correction apply yok.

## Repository

In-memory settlement repository genisletildi:

- `getSupplierPayableById`
- `getCreatorEarningById`
- `reverseSupplierPayable`
- `reverseCreatorEarning`

Postgres settlement repository icin payable/earning reversal tablo path'i bu fazda acilmadi. Ilgili methodlar foundation table configure edilmedigini belirten error ile kapali kalir:

- `SETTLEMENT_SUPPLIER_PAYABLE_POSTGRES_FOUNDATION_TABLE_NOT_CONFIGURED`
- `SETTLEMENT_CREATOR_EARNING_POSTGRES_FOUNDATION_TABLE_NOT_CONFIGURED`

Yeni migration eklenmedi. Finance ledger Postgres path'ine yazma yok.

## Refund Service Entegrasyonu

Refund service'e otomatik baglanti yapilmadi.

Bu fazda refund service settlement reversal fonksiyonlarini cagirmiyor. Reversal foundation izole settlement smoke ile dogrulandi.

## Static Guard

Yeni smoke static guard asagidaki dosyalari taradi:

- `services/settlement/src/settlement.ts`
- `packages/contracts/src/settlement.ts`
- `tests/smoke/suites/settlement-payable-earning-reversal-foundation.ts`

Aranan yasak pattern'ler:

- `appendLedgerEntry`
- `executePayout`
- `providerPayout`
- `reverseProviderPayout`
- `createPaymentInstruction`
- `financeCorrectionCreated: true`
- `ledgerEntryCreated: true`
- `providerPayoutReversed: true`
- `payoutMutationPerformed: true`

Bulgu: Yasak mutation call veya true boundary flag literal'i bulunmadi.

## Yeni Smoke

Yeni smoke:

- `settlement-payable-earning-reversal-foundation`

Dogrulananlar:

- `PENDING` supplier payable reverse edilir.
- `HELD` creator earning reverse edilir.
- `REVERSED` ikinci cagrida idempotent davranir.
- Amount asimi reject edilir.
- Partial reversal reject edilir.
- `PAYOUT_READY` otomatik reverse edilmez, review required doner.
- Ledger append yoktur.
- Provider payout reversal yoktur.
- Finance correction yoktur.
- Reversal `sourceRefs` korunur.

## Smoke Sonuclari

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-reversal-foundation`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-lifecycle-foundation`: PASS
- `pnpm.cmd run smoke:settlement-from-order-economics-snapshot-foundation`: PASS
- `pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL with default env, `ECONNREFUSED`
- `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL, `ECONNREFUSED`

Not: Bu oturumda local Postgres 5432 baglanti kabul etmedi. Settlement reversal foundation memory smoke'lari gecmistir; finance ledger Postgres durability smoke'u dis servis bagimliligi nedeniyle tamamlanamadi.

## Kalan Limitations

- Supplier payable / creator earning reversal kayitlari foundation seviyesinde kalir.
- Postgres payable/earning reversal tablo migration'i eklenmedi.
- Partial reversal desteklenmez.
- Remaining amount field yok.
- `PAYOUT_READY` otomatik reverse edilmez; manual review gerekir.
- Refund service otomatik settlement reversal cagrisi yapmaz.
- Ledger append yok.
- Provider refund yok.
- Provider payout reversal yok.
- Finance correction create/apply yok.
