# PHASE-10F-ECONOMICS-10 - PAYOUT CANDIDATE PREPARATION FOUNDATION CLOSURE REPORT

## Degisen Dosyalar

- `packages/contracts/src/payout.ts`
- `services/payout/src/payout.ts`
- `services/payout/src/repository/interface.ts`
- `services/payout/src/repository/in-memory.ts`
- `services/payout/src/repository/postgres.ts`
- `services/payout/src/repository/index.ts`
- `tests/smoke/suites/payout-candidate-preparation-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `PHASE-10F-ECONOMICS-10-PAYOUT-CANDIDATE-PREPARATION-CLOSURE-REPORT.md`

Not: Repo calisma agaci bu faz oncesinden de kirliydi. Build sonrasi mevcut `dist` / `tsbuildinfo` / `.next` dosyalari guncellenmis olabilir.

## Payout Candidate Modeli

Yeni foundation model:

- `PayoutCandidate`
- `payoutCandidateId`
- `partyType`
- `partyId`
- `sourcePayableIds[]`
- `sourceEarningIds[]`
- `totalAmount`
- `currency`
- `status`
- `blockingReasons[]`
- `warnings[]`
- `sourceRefs[]`
- `reviewRequired`
- `createdAt`
- `updatedAt`
- `boundaryFlags`

Boundary flags her candidate icin kapali kalir:

- `payoutExecuted=false`
- `providerInstructionCreated=false`
- `ledgerEntryCreated=false`

## Grouping Davranisi

`preparePayoutCandidates` release eligible settlement supplier payable ve creator earning kayitlarini okur.

Default grouping key:

- `partyType`
- `partyId`
- `currency`

Ayni grouping key altindaki kaynaklar tek candidate icinde toplanabilir. Bu sadece candidate preparation seviyesindedir:

- payout batch execution yok
- provider instruction yok
- transfer orchestration yok

`groupCandidates=false` verilirse kaynak basina ayri candidate hazirlanabilir.

## Blocking / Review Kurallari

Candidate olabilmek icin kaynak kaydin `RELEASE_ELIGIBLE` status'unde olmasi gerekir.

Asagidaki durumlarda candidate uretilmez:

- `HELD`
- `REVERSED`
- missing `sourceRefs`
- missing `partyId`
- `amount <= 0`
- `riskHoldActive=true`
- `refundImpactPending=true`
- `financeCorrectionPending=true`
- `externalReviewRequired=true`

Review visibility icin:

- inconsistent source chain -> `reviewRequired=true`, `INCONSISTENT_SOURCE_CHAIN_REVIEW_REQUIRED`
- duplicate payable/earning refs -> `reviewRequired=true`, `DUPLICATE_PAYABLE_OR_EARNING_REFS_REVIEW_REQUIRED`
- mixed currency guard modeli tanimli; grouping currency bazli oldugu icin default path mixed currency'yi ayni candidate'a toplamaz
- missing refs ve negative amount reject edilir; otomatik duzeltme yapilmaz

## Idempotency Davranisi

Candidate source fingerprint:

- sorted `sourcePayableIds`
- sorted `sourceEarningIds`

Ayni source payable/earning seti tekrar candidate yapildiginda yeni candidate uretilmez; mevcut candidate doner ve result `IDEMPOTENT` olur.

## Repository

In-memory payout repository candidate saklama ve source fingerprint lookup destekler.

Postgres candidate implementation eklenmedi. Postgres path bu faz icin bilincli olarak:

- `PAYOUT_CANDIDATE_POSTGRES_FOUNDATION_UNAVAILABLE`

hatasini verir.

Postgres tablo migration'i eklenmedi.

## Payout / Provider / Ledger Kapali

Bu fazda otomatik mutation acilmadi:

- provider payout yok
- payment instruction yok
- payout batch execution yok
- ledger append yok
- settlement finalize yok
- finance correction apply yok
- gercek para transferi yok

Yeni smoke static guard asagidaki yasak pattern'leri candidate foundation kapsaminda taradi:

- `executePayout`
- `providerPayout`
- `createPaymentInstruction`
- `createProviderTransfer`
- `appendLedgerEntry`
- `payoutExecuted: true`
- `providerInstructionCreated: true`
- `ledgerEntryCreated: true`

## Smoke Sonuclari

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd run smoke:payout-candidate-preparation-foundation`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-signal-integration-foundation`: PASS
- `pnpm.cmd run smoke:settlement-payable-earning-release-eligibility-foundation`: PASS
- `pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL, `ECONNREFUSED`

Not: Ilk `typecheck` denemesi contracts declaration dosyalari yenilenmeden payout service'in eski `@hx/contracts` tiplerini gormesi nedeniyle dustu. `pnpm.cmd --filter @hx/contracts run build` sonrasi root `typecheck` PASS oldu.

## Kalan Limitations

- Candidate preparation foundation seviyesindedir.
- Payout candidate Postgres migration'i eklenmedi.
- Postgres payout candidate repository unavailable error verir.
- Candidate review workflow owner/maker-checker engine'e baglanmadi.
- Mixed currency default grouping ile ayni candidate'a alinmaz; model warning'i foundation hazirligidir.
- Payout item create yok.
- Payout batch execution yok.
- Provider payout yok.
- Payment instruction yok.
- Ledger append yok.
- Settlement finalize yok.
- Finance correction apply yok.
- Gercek para transferi yok.
