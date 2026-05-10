# PHASE-02-FIX-01 — Checkout Payment Readiness Guard Report

## 1. Amaç

Bu fix paketinin amacı, checkout hazır değilken payment initiation başlatılmasını engellemektir.

## 2. Başlangıç Durumu

PHASE-02 Source Review sonucu:
- PARTIAL / NOT READY FOR CLOSURE

Ana blocker:
- Payment initiation invalid / blocked / not-ready checkout’u durdurmuyor.

## 3. Değiştirilen Dosyalar

| Dosya | Değişiklik | Gerekçe | Etki |
|---|---|---|---|
| `services/payment/src/payment.ts` | Checkout payment readiness guard eklendi; not-found/not-ready/invalid amount/currency durumları provider çağrısından önce deterministic failure döndürüyor. | Checkout hazır değilken payment initiation devam etmemeli. | Not-ready checkout için persisted payment attempt oluşmaz, provider çağrısı yapılmaz. |
| `tests/smoke/suites/payment-readiness-guard.ts` | Service-level smoke eklendi. | Live BFF/Postgres gerektirmeden payment readiness guard davranışını doğrulamak. | Ready checkout başarılı; missing/blocked/invalid amount checkout deterministic fail; provider envelope ve repo kaydı oluşmuyor. |
| `tests/smoke/run-smoke.ts` | `payment-readiness-guard` smoke suite kayıt edildi. | Targeted smoke runner üzerinden yeni guard testini çalıştırmak. | `tsx tests/smoke/run-smoke.ts payment-readiness-guard` kullanılabilir. |
| `package.json` | `smoke:payment-readiness-guard` script’i eklendi. | Fix sonrası targeted smoke komutunu standartlaştırmak. | `pnpm run smoke:payment-readiness-guard` çalışır. |

## 4. Eski Davranış

- `initiatePayment` checkout’u `getCheckoutReview(checkoutId)` ile okuyordu.
- Checkout bulunamazsa `FAILED` payment response oluşturup repository’ye idempotency ile kaydediyordu.
- Checkout state `REVIEW_READY` veya validation state `VALID` değilse sadece log/warning yazıyor, akışı durdurmuyordu.
- Bu nedenle blocked / invalid / not-ready checkout için amount hesaplama, payment id oluşturma ve provider initiation çağrısı yapılabiliyordu.
- Provider dönerse `PROVIDER_REDIRECT_READY` attempt persist edilebiliyordu.

## 5. Yeni Davranış

- Ödeme için kabul edilen checkout readiness karşılığı mevcut contract’a göre `state === 'REVIEW_READY'` ve `validationState === 'VALID'`.
- Checkout line validation sonuçlarında herhangi bir non-`VALID` state veya line error varsa checkout ödeme için hazır kabul edilmez.
- `summary.grandTotal` finite ve `> 0` olmalı.
- `summary.currency` boş olmamalı.
- Checkout bulunamazsa `CHECKOUT_NOT_FOUND` döner.
- Checkout blocked / not-ready ise `CHECKOUT_NOT_READY` döner.
- Amount geçersizse `CHECKOUT_AMOUNT_INVALID` döner.
- Currency eksikse `CHECKOUT_CURRENCY_INVALID` döner.
- Guard fail durumlarında persisted payment attempt oluşmaz ve provider çağrısı yapılmaz.
- Response contract uyumu için transient `INITIATION_FAILED` attempt objesi boş `paymentAttemptId` ile döner; bu attempt repository’ye kaydedilmez.

Beklenen cevap:
```text
Checkout hazır değilse payment initiation durur.
```

## 6. BFF Davranışı

- BFF payment route içinde checkout readiness hesabı eklenmedi.
- BFF truth owner değildir.
- BFF mevcut sahiplik kontrolünden sonra `initiatePayment` service sonucunu döndürmeye devam eder.
- Deterministic failure response payment service tarafından üretilir; raw internal exception sızdırılmaz.

## 7. Test / Smoke Kapsamı

| Senaryo | Kanıt | Sonuç |
|---|---|---|
| Checkout hazırsa payment initiation devam eder. | `payment-readiness-guard` smoke ready checkout case | PASS |
| Checkout bulunamazsa payment initiation durur. | `CHECKOUT_NOT_FOUND`, empty `paymentId`, empty `paymentAttemptId` | PASS |
| Checkout blocked/not-ready ise payment initiation durur. | `CHECKOUT_NOT_READY`, no provider envelope | PASS |
| Checkout amount invalid ise payment initiation durur. | `CHECKOUT_AMOUNT_INVALID`, no provider envelope | PASS |
| Not-ready checkout için payment attempt persist edilmez. | `getById` / `getByPaymentAttemptId` undefined assertions | PASS |
| Not-ready checkout için provider çağrısı yapılmaz. | `providerEnvelope === undefined` assertions | PASS |
| Mevcut başarılı provider metadata akışı kırılmadı. | `payment-initiation-provider-reference` smoke | PASS |

## 8. Komut Sonuçları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm run smoke:payment-readiness-guard` | PASS | Service-level guard smoke geçti. |
| `pnpm run smoke:payment-initiation-provider-reference` | PASS | Başarılı initiation/provider metadata regresyonu geçti. |
| `pnpm run typecheck` | PASS | Workspace typecheck geçti. |
| `pnpm run build` | PASS | Workspace build geçti. |
| `pnpm run smoke:payment-provider-boundary` | FAIL / BLOCKED | Live BFF setup step’inde `fetch failed`: `Setup: Create Customer, Storefront & Cart`. Guard service-level smoke ile doğrulandı. |

## 9. Kapsam Dışı Bırakılanlar

- Payment provider entegrasyonu genişletilmedi.
- Order oluşturma davranışına dokunulmadı.
- Finance, settlement, payout ve reconciliation alanlarına dokunulmadı.
- UI truth üretimi eklenmedi.
- BFF checkout readiness truth owner yapılmadı.
- Yeni checkout state eklenmedi; mevcut `REVIEW_READY` / `VALID` contract karşılığı kullanıldı.

## 10. Nihai Karar

PHASE-02-FIX-01 için checkout payment readiness guard source ve service-level smoke seviyesinde kapatıldı.

Kapanan kural:
```text
Checkout ready olmadan payment başlatılamaz.
```
