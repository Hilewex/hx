# PHASE-10F-ECONOMICS-06 - SUPPLIER PAYABLE + CREATOR EARNINGS LIFECYCLE FOUNDATION CLOSURE REPORT

## Degisen Dosyalar

- `packages/contracts/src/settlement.ts`
- `packages/contracts/src/settlement.d.ts`
- `services/settlement/src/settlement.ts`
- `services/settlement/src/repository/interface.ts`
- `services/settlement/src/repository/in-memory.ts`
- `services/settlement/src/repository/postgres.ts`
- `tests/smoke/suites/settlement-payable-earning-lifecycle-foundation.ts`
- `tests/smoke/suites/settlement-from-order-economics-snapshot-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `PHASE-10F-ECONOMICS-06-SUPPLIER-PAYABLE-CREATOR-EARNINGS-CLOSURE-REPORT.md`

Not: Repo calisma agaci bu faz oncesinden de kirliydi. Build sonrasi mevcut `dist` / `tsbuildinfo` / `.next` dosyalari guncellenmis olabilir.

## Payable / Earning Modeli

Settlement contract tarafina iki ayri foundation kayit modeli eklendi:

- `SettlementSupplierPayable`
- `SettlementCreatorEarning`

Supplier payable minimum alanlari:

- `payableId`
- `settlementLineId`
- `orderId`
- `orderLineId`
- `partyType=SUPPLIER`
- `partyId`
- `amount`
- `currency`
- `sourceRefs`
- `status`
- `holdReasonCode`
- `createdAt`
- `updatedAt`
- `boundaryFlags`

Creator earning minimum alanlari:

- `earningId`
- `settlementLineId`
- `orderId`
- `orderLineId`
- `partyType=CREATOR`
- `partyId`
- `amount`
- `currency`
- `sourceRefs`
- `status`
- `holdReasonCode`
- `createdAt`
- `updatedAt`
- `boundaryFlags`

Boundary flag'leri sabit kapali tutuldu:

- `payoutCreated=false`
- `ledgerEntryCreated=false`
- `providerPayoutExecuted=false`

## Lifecycle State'leri

Yeni foundation status tipi:

- `PENDING`
- `HELD`
- `RELEASE_ELIGIBLE`
- `REVERSED`
- `PAYOUT_READY`

Bu fazda otomatik release veya payout-ready gecisi acilmadi. Settlement turetimi sadece:

- `PENDING`
- `HELD`

state'lerini uretir.

## Settlement Line'dan Turetme

`createSettlementFromOrder` settlement line kaydindan sonra ayrica lifecycle candidate uretir.

- `amountSummary.supplierShareAmount` pozitifse supplier payable olusur.
- `amountSummary.creatorShareAmount` pozitifse creator earning olusur.
- Supplier party id settlement line `partyId` veya `SUPPLIER` source ref uzerinden alinir.
- Creator party id bu foundation fazinda `CREATOR_STORE` source ref uzerinden alinir.
- Settlement line `sourceRefs` payable/earning kaydina kopyalanir.

Bu turetme payout item olusturmaz, ledger yazmaz, provider cagrisi yapmaz.

## Hold Davranisi

Settlement line status mapping:

- `PENDING` settlement line -> payable/earning `PENDING`
- `BLOCKED` settlement line -> payable/earning `HELD`

`BLOCKED` durumda `holdReasonCode=RISK_HOLD_RECOMMENDED` set edilir.

## Persistence

Foundation seviyesi icin in-memory settlement repository genisletildi:

- `createSupplierPayables`
- `createCreatorEarnings`
- `listSupplierPayables`
- `listCreatorEarnings`

Postgres repository icin yeni tablo migration'i eklenmedi. Postgres payable/earning write path bu fazda tablo configure edilmedigini belirten foundation error ile kapali kalir; smoke memory repository uzerinden dogrulandi.

## Boundary Durumu

Kesin yasakli davranislar eklenmedi:

- Provider payout yok.
- Payment instruction yok.
- Gercek para cikisi yok.
- Settlement finalize yok.
- Ledger append yok.
- Finance correction apply yok.
- Refund rollback mutation yok.

Payable/earning boundary flag'leri kapali:

- `payoutCreated=false`
- `ledgerEntryCreated=false`
- `providerPayoutExecuted=false`

Settlement calculation summary tarafinda mevcut kapali flag davranisi korunur:

- `ledgerEntryCreated=false`
- `payoutCreated=false`
- `payableCreated=false`

## Static Guard

Yeni smoke static guard asagidaki dosyalari taradi:

- `services/settlement/src/settlement.ts`
- `packages/contracts/src/settlement.ts`
- `tests/smoke/suites/settlement-payable-earning-lifecycle-foundation.ts`

Aranan yasak pattern'ler:

- `executePayout`
- provider payout call pattern
- `createPaymentInstruction`
- `appendLedgerEntry`
- `markPaid`
- `payoutCreated: true`
- `ledgerEntryCreated: true`
- `providerPayoutExecuted: true`

Bulgu: Yasak mutation call veya true boundary flag literal'i bulunmadi.

## Yeni Smoke

Yeni smoke:

- `settlement-payable-earning-lifecycle-foundation`

Dogrulananlar:

- Settlement line'dan supplier payable olusur.
- Settlement line'dan creator earning olusur.
- Supplier amount `supplierShareAmount` uzerinden tasinir.
- Creator amount `creatorShareAmount` uzerinden tasinir.
- `BLOCKED` settlement line `HELD` payable/earning uretir.
- Boundary flag'leri false kalir.
- Payout olusturulmaz.
- Ledger append yapilmaz.
- Provider payout yoktur.
- `sourceRefs` korunur.

## Smoke Sonuclari

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-lifecycle-foundation`: PASS
- `pnpm.cmd run smoke:settlement-from-order-economics-snapshot-foundation`: PASS
- `pnpm.cmd run smoke:admin-finance-ops-projection`: PASS
- `pnpm.cmd run smoke:finance-ledger-postgres-durability`: PASS with `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5432/hx_local_db`

Notlar:

- Ilk `finance-ledger-postgres-durability` denemesi default env ile `ECONNREFUSED` verdi; local Postgres 5432 override ile PASS oldu.
- Final `typecheck` tek basina PASS. Paralel `typecheck` + `build` denemesinde Next `.next/types` uretimiyle yaris oldugu icin gecici `.next/types` missing hatasi goruldu; build tek basina PASS, ardindan typecheck tek basina PASS.

## Kalan Limitations

- Supplier payable / creator earning kayitlari foundation lifecycle seviyesinde kalir.
- Postgres payable/earning tablo migration'i bu fazda eklenmedi.
- Release eligibility otomasyonu acilmadi.
- `PAYOUT_READY` otomatik gecisi yok.
- Payout item create yok.
- Ledger append yok.
- Provider payout yok.
- Settlement line status hala foundation state olarak `PENDING` veya risk hold varsa `BLOCKED` kalir.
