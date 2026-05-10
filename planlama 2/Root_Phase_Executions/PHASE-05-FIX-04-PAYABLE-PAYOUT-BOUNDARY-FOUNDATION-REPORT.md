# PHASE-05-FIX-04 - Payable / Payout Boundary Foundation

## 1. Amaç
Bu rapor, PHASE-05 kapsamında settlement sonrası oluşabilecek payable/alacak ile gerçek payout execution arasındaki sınırı minimum güvenli seviyede kurmak için yapılan değişiklikleri ve doğrulama kanıtlarını belgeler.

Bu paket gerçek banka/provider payout entegrasyonu, live payout execution, settlement calculation genişletmesi veya refund provider davranışı geliştirme paketi değildir.

## 2. Başlangıç Durumu İncelemesi

| Kontrol | Durum |
|---|---|
| Payable modeli var mı? | KISMİ. Ayrı payable aggregate yoktu; payout item `ELIGIBLE` / `ON_HOLD` durumlarıyla payable benzeri kullanılıyordu. Bu fix contract'a explicit `PayableStatus` ekledi. |
| Payout item payable gibi mi kullanılıyor? | EVET. `PayoutItem.amountSummary.payableAmount`, `heldAmount`, `paidAmount` ve `status` üzerinden payable/payout karışık temsil ediliyordu. |
| Payout batch var mı? | VAR. `PayoutBatch` ve `createPayoutBatch` mevcut. Bu fix `payoutBatchId`, `items`, `providerMode` alanlarını minimum model için ekledi. |
| Payout lifecycle var mı? | VAR/KISMİ. Eski item lifecycle `ELIGIBLE`, `ON_HOLD`, `BATCHED`, `PROCESSING`, `PAID` vb. idi. Bu fix boundary için explicit `PayoutStatus`: `REQUESTED`, `APPROVED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `UNKNOWN_RESULT` ekledi. |
| Payable olmadan payout yapılabiliyor mu? | Öncesinde manuel/test item ile mümkün görünüyordu. Bu fix yeni `createPayoutItemFromSource` yolunda source/amount/currency/counterparty/idempotency zorunlu kıldı. |
| Duplicate payout guard var mı? | KISMİ. Idempotency key aynıysa mevcut item dönüyordu, fakat fingerprint conflict ve source duplicate conflict yoktu. Bu fix ikisini ekledi. |
| Payout provider gerçek mi simulation mı? | Foundation/simulation. `FoundationPayoutProviderAdapter` gerçek para çıkışı yapmaz ve `actualProviderPayoutPerformed: false` döner. |
| Payout succeeded ledger/settlement state mutate ediyor mu? | Mevcut provider approve akışı item/batch owner state'ini `PROCESSING` yapıyor; settlement/ledger/payment/refund truth mutate etmiyor. Bu fix summary/boundary flags ile ledger/settlement mutate edilmediğini explicit yaptı. |
| BFF payout direct repository access yapıyor mu? | HAYIR. `apps/bff/src/server/payout.ts` `@hx/payout` service boundary'ye delegate ediyor. |
| Panel payout direct write yapıyor mu? | HAYIR. Panel scan içinde payout/settlement direct write bulunmadı. |

## 3. Yapılan Değişiklikler

1. `packages/contracts/src/payout.ts`
   - Minimum payable/payout boundary contract eklendi:
     - `PayableStatus`
     - `PayoutStatus`
     - `PayoutSourceType`
     - `PayoutProviderMode`
     - `PayoutBoundarySummary`
     - `PayoutBoundaryLimitationFlag`
     - `CreatePayoutItemFromSourceCommand`
   - `PayoutItem` içine minimum source/counterparty/money lifecycle alanları eklendi:
     - `sourceType`, `sourceId`, `settlementId`, `counterpartyType`, `counterpartyId`
     - `amount`, `currency`
     - `payableStatus`, `payoutStatus`, `riskHold`
   - Boundary flags içine `ledgerTruthMutated: false` eklendi.
   - `PayoutBatch` içine minimum model için `payoutBatchId`, `items`, `providerMode` eklendi.

2. `services/payout/src/payout.ts`
   - `createPayoutItemFromSource(command)` eklendi.
   - Zorunlu alan validasyonları eklendi:
     - `sourceType`
     - `sourceId`
     - `counterpartyType`
     - `counterpartyId`
     - `amount > 0`
     - `currency`
     - `idempotencyKey`
   - Duplicate guard eklendi:
     - Aynı `idempotencyKey` + aynı deterministic fingerprint tekrar çağrılırsa mevcut payout item döner, yeni item oluşmaz.
     - Aynı `idempotencyKey` + farklı payload `DUPLICATE_IDEMPOTENCY_KEY_CONFLICT` ile reject edilir.
     - Aynı source/counterparty için farklı payload `DUPLICATE_PAYOUT_SOURCE_CONFLICT` ile reject edilir.
   - Payout item creation payable/payout boundary evidence olarak kalır:
     - `payableStatus: ELIGIBLE` veya `ON_HOLD`
     - `payoutStatus: REQUESTED`
     - `paidAmount: 0`
     - `actualProviderPayoutPerformed: false`
     - `settlementTruthMutated: false`
     - `ledgerTruthMutated: false`
   - Existing batch/provider foundation korunmuştur; provider approve sonrası item owner state `PROCESSING` olabilir, fakat gerçek provider payout ve settlement/ledger mutation yapılmaz.

3. `tests/smoke/suites/payable-payout-boundary-foundation.ts`
   - Targeted smoke eklendi:
     - Valid payable/payout item creation.
     - Missing source validation.
     - Missing/invalid amount/currency validation.
     - Duplicate same key + same payload no new item.
     - Duplicate same key + different payload conflict.
     - Duplicate source + different payload conflict.
     - Risk hold item `ON_HOLD`, `paidAmount: 0`.
     - Settlement calculation payable/payout/paid_out üretmez.
     - Boundary flags settlement/ledger/provider truth mutate etmez.

4. `tests/smoke/run-smoke.ts` ve root `package.json`
   - `payable-payout-boundary-foundation` suite registry'ye eklendi.
   - `smoke:payable-payout-boundary-foundation` script'i eklendi.

## 4. Boundary Kararları

- Settlement calculation payout değildir.
- Settlement calculation payable değildir.
- Payable paid_out değildir.
- Payout request para çıktı değildir.
- Payout provider sonucu provider truth değildir; foundation envelope içinde gerçek payout yapılmadığı belirtilir.
- Payout owner state değişimi settlement/ledger/payment/refund truth mutation sayılmaz.
- Ledger entry update/delete yapılmadı.
- Refund provider davranışına dokunulmadı.
- Settlement calculation davranışı genişletilmedi.
- BFF payout truth üretmez; sadece payout service boundary'ye delegate eder.
- Panel direct payout write yapmaz.

## 5. Bilinçli Limitations

- Ayrı persisted payable aggregate eklenmedi; payable boundary minimum seviyede `PayoutItem.payableStatus` ile temsil edildi.
- Duplicate/fingerprint guard bu foundation yolunda service-level in-memory guard kullanır; Postgres unique/fingerprint migration bu pakette yapılmadı.
- Gerçek banka/provider payout execution açılmadı.
- Approval workflow uygulanmadı; limitation flag olarak raporlandı.
- Audit workflow zorunlu enforcement seviyesine çıkarılmadı; limitation flag olarak raporlandı.
- BFF için yeni payable/payout write route açılmadı.

## 6. Boundary Regression Scan

| Tarama | Sonuç |
|---|---|
| `rg -n "@hx/persistence|get.*Repository|insert|update|delete" apps/bff/src/server/payout.ts apps/bff/src/server/settlement.ts -g "*.ts"` | Sonuç yok. BFF payout/settlement direct repository access yapmıyor. |
| `rg -n "payout|payable|settlement|paid_out|paidOut|createPayout|applyPayout" apps/panel -g "*.ts" -g "*.tsx"` | Sonuç yok. Panel direct payout/settlement write bulunmadı. |
| `rg -n "createPayoutItemFromSource|resetPayoutBoundaryGuardForTesting|PayableStatus|PayoutStatus|PayoutSourceType|DUPLICATE_PAYOUT_SOURCE_CONFLICT|actualProviderPayoutPerformed|settlementTruthMutated|ledgerTruthMutated" services/payout packages/contracts/src/payout.ts tests/smoke/suites/payable-payout-boundary-foundation.ts -g "*.ts"` | Yeni boundary contract/service/smoke yüzeyi doğrulandı. |

## 7. Komut Kanıtları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm --filter @hx/contracts --filter @hx/payout run typecheck` | PASS | Contract ve payout service typecheck tamamlandı. |
| `pnpm --filter @hx/contracts --filter @hx/payout run build` | PASS | Contract ve payout service build tamamlandı. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | `[PASS] payable-payout-boundary-foundation - Payable / payout boundary foundation smoke passed.` |
| `pnpm run smoke:payout-provider-boundary` | FAIL / ENV | BFF sunucusu açık olmadığı için `fetch failed`; targeted service-level smoke bu fix için PASS. |

## 8. Kapanış Sonucu

PHASE-05-FIX-04 minimum payable / payout boundary foundation kapatıldı.

Payable/payout sınırı artık minimum seviyede:
- source/amount/currency/counterparty/idempotency zorunlu alıyor,
- payable status ile payout status'u ayrı temsil ediyor,
- payout request'in paid_out olmadığını `paidAmount: 0` ve provider false flags ile kanıtlıyor,
- duplicate idempotency ve duplicate source conflict guard taşıyor,
- settlement/ledger/payment/refund truth mutate etmediğini summary ve smoke ile kanıtlıyor,
- gerçek provider payout execution açmıyor.
