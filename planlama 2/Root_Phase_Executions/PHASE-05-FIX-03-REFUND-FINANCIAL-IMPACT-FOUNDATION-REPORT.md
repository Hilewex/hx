# PHASE-05-FIX-03 - Refund Financial Impact Foundation

## 1. Amaç
Bu rapor, PHASE-05 kapsamında refund finansal etkisinin minimum güvenli seviyede ledger evidence olarak temsil edilmesi için yapılan değişiklikleri ve doğrulama kanıtlarını belgeler.

Bu paket büyük finance engine, gerçek provider refund execution, settlement/payout execution veya payable lifecycle geliştirme paketi değildir.

## 2. Başlangıç Durumu İncelemesi

| Kontrol | Durum |
|---|---|
| Refund service var mı? | VAR. `services/refund` altında refund creation, process simulation ve state transition hattı mevcut. |
| Refund state modeli var mı? | VAR. `RefundState`: `CREATED`, `VALIDATED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `UNKNOWN_RESULT`, `RECONCILIATION_REQUIRED`, `CLOSED`. |
| Refund simulation mı, gerçek provider mı? | Simulation/foundation. `processRefund` ödeme referansı bulursa `simulateProviderRefund` çağırıyor; gerçek provider refund execution açılmadı. |
| Refund amount/currency taşıyor mu? | VAR. `RefundLine.amount/currency` ve `RefundAmountSummary` mevcut; mevcut create akışı amount source olmadığı için `0 TRY` ve warning üretiyor. |
| Partial refund modeli var mı? | KISMİ. Cancel/return state modelinde partial return/refund state'leri ve line amount modeli var. Bu fix finance impact tarafında amount bazlı partial refund destekler. |
| Refund ledger'a bağlı mı? | Öncesinde HAYIR. Bu fix ile finance service içinde `recordRefundFinancialImpact` ledger entry append eder. |
| Refund settlement'ı otomatik değiştiriyor mu? | HAYIR. Mevcut refund summary `actualSettlementMutationPerformed: false`; yeni finance impact de settlement adjusted üretmez. |
| Duplicate refund financial impact guard var mı? | Öncesinde YOK. Bu fix ile `idempotencyKey` + deterministic fingerprint guard eklendi. |
| BFF refund direct repository access yapıyor mu? | HAYIR. `apps/bff/src/server/refund.ts` `@hx/refund` service boundary'ye delegate ediyor. |
| Panel/UI refund finance truth üretiyor mu? | HAYIR. Panel direct refund/ledger write bulunmadı. Web bootstrap refund smoke/simulation çağrıları yapıyor, finance truth üretmiyor. |

## 3. Yapılan Değişiklikler

1. `packages/contracts/src/finance-ledger.ts`
   - Refund financial impact için minimum contract/model eklendi:
     - `RefundFinancialImpactCommand`
     - `RefundFinancialImpactResult`
     - `RefundFinancialImpactSummary`
     - `RefundFinancialImpactType`
     - `RefundFinancialImpactStatus`
     - `RefundFinancialImpactLimitationFlag`
   - Source reference alanları contract'a alındı:
     - `refundId`
     - `orderId?`
     - `orderLineId?`
     - `paymentId?`
     - `amount`
     - `currency`
     - `idempotencyKey`
   - Boundary kanıtları summary içine explicit yazıldı:
     - `settlementAdjustedCreated: false`
     - `payoutReversalCreated: false`
     - `orderStateMutated/paymentStateMutated/refundStateMutated: false`

2. `services/finance/src/finance.ts`
   - `recordRefundFinancialImpact(command)` eklendi.
   - Valid refund impact ledger'a append edilir:
     - `sourceType: REFUND`
     - `sourceId: refundId`
     - `entryType: REFUND`
     - `direction: DEBIT`
     - `amount/currency/idempotencyKey` zorunlu
   - Refund reversal ayrı append-only entry olarak desteklendi:
     - `entryType: REFUND_REVERSAL`
     - `direction: CREDIT`
     - `sourceEventId/originalRefundLedgerEntryId` ile önceki evidence'a referans taşır.
   - Duplicate guard:
     - Aynı `idempotencyKey` + aynı fingerprint tekrar çağrılırsa mevcut ledger entry döner, yeni entry oluşmaz.
     - Aynı `idempotencyKey` + farklı payload `DUPLICATE_IDEMPOTENCY_KEY_CONFLICT` ile reject edilir.
   - Finance service order/payment/refund owner state mutate etmez; settlement adjusted veya payout reversal state üretmez.

3. `tests/smoke/suites/refund-financial-impact-foundation.ts`
   - Targeted smoke eklendi:
     - Valid refund impact ledger append.
     - Missing `refundId`.
     - Missing `idempotencyKey`.
     - Missing amount/currency.
     - Zero/negative amount.
     - Duplicate same key + same payload no new entry.
     - Duplicate same key + different payload conflict.
     - Settlement adjusted/payout reversal state üretilmedi.
     - Order/payment/refund state mutate edilmedi.
     - Refund reversal append-only yeni entry.
     - `finance-ledger-foundation` smoke regresyonu.

4. `tests/smoke/run-smoke.ts` ve root `package.json`
   - `refund-financial-impact-foundation` suite registry'ye eklendi.
   - `smoke:refund-financial-impact-foundation` script'i eklendi.

## 4. Boundary Kararları

- Refund financial impact ledger entry / adjustment evidence olarak temsil edilir.
- Refund completed otomatik settlement adjusted değildir.
- Refund completed otomatik payout reversed değildir.
- Settlement adjustment ayrı sonraki adım olarak bırakıldı.
- BFF refund finance truth üretmez.
- Panel direct refund/ledger write yapmaz.
- Manual generic ledger append BFF route'u mevcut ve `requireFinanceRole` ile korunuyor; bu fix yeni BFF route açmadı.

## 5. Bilinçli Limitations

- Ledger persistence mevcut foundation seviyesinde in-memory append yapısını kullanır; Postgres refund financial impact persistence bu pakette yapılmadı.
- Refund service create akışında amount source hâlâ her durumda dolu değil; bu nedenle financial impact command amount'u explicit zorunlu alır.
- Gerçek provider refund execution açılmadı.
- Settlement lifecycle, payout execution ve payable lifecycle değiştirilmedi.
- Audit/approval workflow bu pakette eklenmedi.
- BFF refund financial impact route'u eklenmedi; service-level smoke yeterli tutuldu.

## 6. Boundary Regression Scan

| Tarama | Sonuç |
|---|---|
| `rg '@hx/persistence|get.*Repository|insert|update|delete' apps/bff/src/server -g '*.ts'` | Refund/finance ledger route'larında direct persistence bulunmadı. Genel BFF içinde service update çağrıları ve provider-callback persistence helper kullanımları mevcut. |
| `rg 'refund|ledger|finance|settlement|payout|recordRefundFinancialImpact|appendLedgerEntry' apps/panel apps/web -g '*.ts'` | Panel direct refund/ledger write bulunmadı. Web bootstrap refund simulation endpoint çağrıları yapıyor. |
| `rg 'recordRefundFinancialImpact|appendLedgerEntry|REFUND_REVERSAL|REFUND|settlementAdjusted|payoutReversal' services packages tests/smoke apps/bff/src/server -g '*.ts'` | Yeni refund impact sadece finance service ve targeted smoke içinde; BFF refund finance truth üretmiyor. |

## 7. Komut Kanıtları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm --filter @hx/contracts --filter @hx/finance run typecheck` | PASS | Contract ve finance service typecheck tamamlandı. |
| `pnpm --filter @hx/contracts --filter @hx/finance run build` | PASS | Contract ve finance service build tamamlandı. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | `[PASS] refund-financial-impact-foundation - Refund financial impact foundation smoke passed.` |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger foundation regresyonu tamamlandı. |

## 8. Kapanış Sonucu

PHASE-05-FIX-03 minimum refund financial impact foundation kapatıldı.

Refund finansal etkisi artık minimum seviyede:
- ledger'da `REFUND` entry olarak temsil ediliyor,
- refund reversal gerekiyorsa append-only `REFUND_REVERSAL` entry olarak temsil ediliyor,
- amount bazlı partial refund impact destekliyor,
- idempotency/fingerprint duplicate guard taşıyor,
- settlement adjusted veya payout reversed state üretmediğini smoke ile kanıtlıyor,
- order/payment/refund owner state mutate etmediğini summary ve smoke ile kanıtlıyor.
