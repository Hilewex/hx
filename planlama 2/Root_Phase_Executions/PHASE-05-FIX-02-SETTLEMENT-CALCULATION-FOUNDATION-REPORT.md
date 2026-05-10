# PHASE-05-FIX-02 - Settlement Calculation Foundation

## 1. Amaç
Bu rapor, PHASE-05 source review sonucunda kısmi/foundation seviyede kalan settlement hesaplama hattını Ledger Foundation üzerine minimum ve güvenli seviyede kurmak için yapılan değişiklikleri ve doğrulama kanıtlarını belgeler.

Bu paket büyük finance engine, payout execution, payable lifecycle veya refund provider davranışı geliştirme paketi değildir.

## 2. Başlangıç Durumu İncelemesi

| Kontrol | Durum |
|---|---|
| Settlement service var mı? | VAR. `services/settlement` altında order kaynaklı settlement line lifecycle servisi mevcut. |
| Settlement contract var mı? | VAR. `packages/contracts/src/settlement.ts` içinde settlement line ve lifecycle contract mevcut. |
| Settlement calculation çalışıyor mu? | KISMİ/YOK. Mevcut servis order line'dan settlement line oluşturuyor, fakat deterministic calculation result contract'ı yoktu. |
| Platform share hesaplanıyor mu? | YOK. Mevcut `amountSummary.platformShareAmount` opsiyonel ama hesaplama hattı yoktu. |
| Supplier share hesaplanıyor mu? | YOK. Mevcut line net amount'u gross ile aynı bırakıyordu. |
| Creator/brand share var mı? | KISMİ/YOK. Contract alanları opsiyonel, hesaplama yok. Bu fix'te limitation flag olarak bırakıldı. |
| Settlement ledger'a bağlı mı? | HAYIR. Bu fix settlement calculation'ın ledger entry üretmediğini açıkça garanti eder. |
| Settlement payout/payable üretiyor mu? | Mevcut `services/payout` settlement line'dan payout item üretebiliyor; yeni calculation hattı payout/payable/paid_out üretmez. |
| Duplicate settlement guard var mı? | Lifecycle line create akışında idempotency var; yeni calculation hattına ayrı idempotency/fingerprint guard eklendi. |
| Smoke script var mı? | Ledger smoke vardı; settlement calculation için yeni targeted smoke eklendi. |

## 3. Yapılan Değişiklikler

1. `packages/contracts/src/settlement.ts`
   - `SettlementSourceType` güçlendirildi: `LEDGER_ENTRY`, `MANUAL_ADJUSTMENT`.
   - Minimum calculation contract eklendi:
     - `SettlementCalculationInput`
     - `SettlementCalculationLine`
     - `SettlementCalculationResult`
     - `SettlementCalculationSummary`
     - `SettlementCalculationLineType`
     - `SettlementStatus`
     - `SettlementLimitationFlag`
   - Summary contract içine boundary kanıtları eklendi:
     - `ledgerEntryCreated: false`
     - `payoutCreated: false`
     - `payableCreated: false`
     - `paidOutCreated: false`
     - `orderStateMutated/paymentStateMutated/refundStateMutated: false`

2. `services/settlement/src/settlement.ts`
   - `calculateSettlement(input)` eklendi.
   - Deterministic hesaplama:
     - `platformShareAmount = grossAmount * platformCommissionRate`
     - `supplierNetAmount = grossAmount - platformShareAmount`
     - Para tutarları 2 decimal'e yuvarlanır.
   - Settlement calculation lines:
     - `GROSS_SALE`
     - `PLATFORM_COMMISSION`
     - `SUPPLIER_NET`
   - Duplicate guard:
     - Aynı `idempotencyKey` ve aynı fingerprint tekrar çağrılırsa mevcut `settlementId` döner.
     - Aynı `idempotencyKey` farklı payload ile çağrılırsa `BLOCKED` ve `DUPLICATE_IDEMPOTENCY_KEY_CONFLICT` döner.
   - Calculation hattı ledger entry, payout, payable, paid_out veya owner state üretmez/mutate etmez.

3. `services/settlement/tsconfig.json`
   - Settlement paketinin mevcut monorepo import yapısı için `rootDir` ve include kapsamı düzeltildi.
   - Payout Jest smoke dosyası settlement typecheck kapsamından çıkarıldı.

4. `tests/smoke/suites/settlement-calculation-foundation.ts`
   - Targeted smoke eklendi:
     - Platform share ve supplier net deterministic mi?
     - Settlement calculation payout/payable/paid_out üretmiyor mu?
     - Order/payment/refund state mutate edilmiyor mu?
     - Duplicate calculation guard çalışıyor mu?
     - Aynı idempotency key farklı payload ile block ediliyor mu?

5. `tests/smoke/run-smoke.ts` ve root `package.json`
   - `settlement-calculation-foundation` suite registry'ye eklendi.
   - `smoke:settlement-calculation-foundation` script'i eklendi.

## 4. Bilinçli Limitations

- Creator share hesaplama bu pakette açılmadı; `CREATOR_SHARE_NOT_CALCULATED` limitation flag'i üretilebilir.
- Brand share hesaplama bu pakette açılmadı; `BRAND_SHARE_NOT_CALCULATED` limitation flag'i üretilebilir.
- Coupon/campaign sponsor etkisi tam işlenmedi; `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` limitation flag'i üretilebilir.
- Refund settlement impact tam işlenmedi; `REFUND_SETTLEMENT_IMPACT_NOT_CALCULATED` limitation flag'i üretilebilir.
- Calculation guard in-memory foundation seviyesindedir; Postgres settlement calculation persistence bu pakette yapılmadı.
- Mevcut settlement lifecycle action hattı (`applySettlementAction`) bu görev kapsamında değiştirilmedi.
- BFF settlement truth üretimi eklenmedi; calculation owner boundary `services/settlement` içinde tutuldu.

## 5. Komut Kanıtları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm --filter @hx/contracts --filter @hx/settlement run typecheck` | PASS | Contract ve settlement service typecheck tamamlandı. |
| `pnpm --filter @hx/contracts --filter @hx/settlement run build` | PASS | Contract ve settlement service build tamamlandı. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | `[PASS] settlement-calculation-foundation - Settlement calculation foundation smoke passed.` |

## 6. Kapanış Sonucu

PHASE-05-FIX-02 minimum settlement calculation foundation kapatıldı.

Settlement artık minimum seviyede:
- deterministic platform commission hesaplıyor,
- deterministic supplier net hesaplıyor,
- calculation line modeli ve summary üretiyor,
- idempotency/duplicate guard taşıyor,
- payout/payable/paid_out üretmediğini smoke ile kanıtlıyor,
- ledger/order/payment/refund state mutate etmediğini summary ve smoke ile kanıtlıyor.
