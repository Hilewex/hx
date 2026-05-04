# HARDENING-06B — Risk Signal Core Guard & Ingest Hardening Closure Report

## 1. Kısa Özet
- **Paket amacı**: Risk servisinin core signal ingest hattını güvenli hale getirmek ve commerce domain-triggered risk signal üretimini başlatmak.
- **Yapılan implementation**: BFF route guard'lar sıkılaştırıldı, internal signal helper standardı oluşturuldu, Payment ve Order servislerine risk signal entegrasyonu eklendi. BFF port 3001 standardı sağlandı. Signal listeleme ve doğrulama endpoint'leri eklendi.
- **Yapılmayanlar**: Full fraud scoring, otomatik hold/block mekanizmaları ve gelişmiş risk decision pipeline'ları kapsam dışı bırakıldı.
- **Nihai karar**: **PASS** (Tüm zorunlu smoke senaryoları 3001 portu üzerinden başarıyla doğrulandı).

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06-00B1-RISK-FRAUD-CORE-INVENTORY.md | Okundu | Kılavuz alındı |
| HARDENING-06-00B2-ABUSE-SIGNAL-COVERAGE-INVENTORY.md | Okundu | Kılavuz alındı |
| 49-fraud risk abuse sistemi.md | Okundu | Mimari temel alındı |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `apps/bff/src/server/risk.ts` | `requireRiskOperator` guard eklendi. `handleListRiskSignals` eklendi. | Güvenlik ve kanıt üretimi. |
| `apps/bff/src/server/index.ts` | URL parsing standardı (3001) ve yeni rotalar eklendi. | Port standardı ve erişilebilirlik. |
| `services/risk/src/risk.ts` | `listRiskSignals` eklendi, `targetTruthMutated=false` korundu. | Kanıt ve boundary koruması. |
| `services/risk/src/repository/` | `listSignals` implementasyonu (Postgres & In-Memory). | Veri doğruluğu kanıtı. |
| `services/payment/src/payment.ts` | Invalid amount/currency için signal eklendi. | Payment risk foundation. |
| `services/order/src/order.ts` | Payment state mismatch için signal eklendi. | Order risk foundation. |
| `tests/smoke/suites/risk-signal.ts` | Yeni smoke test suite (Gerçek HTTP doğrulamalı). | Acceptance kanıtı. |

## 4. Risk Route Guard Sonucu
- **create risk signal guard**: `requireRiskOperator` (ADMIN veya RISK_OPERATOR) ile korunuyor.
- **davranış**:
    - Guest: 401 (Unauthorized) - **VERIFIED**
    - Customer/Creator: 403 (Forbidden) - **VERIFIED**
    - Admin/Operator: 201 (Success) - **VERIFIED**
- BFF 3001 portu üzerinden yapılan çağrılar doğru guard davranışını doğrulamıştır.

## 5. Risk Signal Ingest Sonucu
- **Signal modeli**: `source`, `target`, `reasonCode` ve `metadata` alanları standartlaştırıldı.
- **Internal Helper**: `createInternalRiskSignal` ile domain servisleri actor context'ten bağımsız güvenli signal üretebiliyor.
- **Truth Persistence**: `targetTruthMutated=false` korunmaktadır, risk servisi domain mutation yapmaz.
- **Persistence Verification**: Yeni eklenen `/risk/signal/list` endpoint'i ile sinyallerin repository'ye yazıldığı smoke test içinde doğrulanmıştır.

## 6. Payment Risk Signal Sonucu
- **Signal Tetikleyicileri**:
    - `INVALID_AMOUNT` (Amount <= 0)
    - `UNSUPPORTED_CURRENCY` (Currency !== 'TRY')
- **Bff/Service Boundary**: Payment truth payment servisinde kalır, risk sadece signal alır. Smoke test ile `PAYMENT_SIGNAL` source doğrulanmıştır.

## 7. Order Risk Signal Sonucu
- **Signal Tetikleyicileri**:
    - `PAYMENT_NOT_SUCCEEDED` (Başarısız ödeme ile sipariş denemesi)
- **Ayrım**: Payment succeeded ≠ order_created ayrımı korunmuş ve anomali durumları signal olarak raporlanmıştır. Smoke test ile `ORDER_SIGNAL` source doğrulanmıştır.

## 8. Boundary Review
- **Risk target truth mutate ediyor mu?**: Hayır.
- **Risk permission yerine geçti mi?**: Hayır.
- **Risk eligibility yerine geçti mi?**: Hayır.
- **BFF truth üretti mi?**: Hayır.
- **targetTruthMutated=false korunuyor mu?**: Evet (Smoke test ile doğrulandı).

## 9. Smoke/Test Sonuçları

| Komut/Senaryo | Sonuç | Kanıt/Not |
|---|---|---|
| pnpm run typecheck | PASS | Tüm monorepo tipleri tutarlı. |
| pnpm run build | PASS | Derleme hatasız tamamlandı. |
| pnpm run smoke:health | PASS | BFF 3001 portunda ayakta. |
| pnpm run smoke:auth-permission | PASS | Auth/Session güvenliği tam. |
| pnpm run smoke:risk-signal | PASS | Tüm guard ve ingest akışları OK. |
| Guest create signal | PASS | 401 Unauthorized dönüyor. |
| Customer create signal | PASS | 403 Forbidden dönüyor. |
| Admin create signal | PASS | 201 Created ve Persistence OK. |
| Payment invalid amount signal | PASS | Repository'ye signal yazıldı. |
| Order non-success payment signal | PASS | Repository'ye signal yazıldı. |
| targetTruthMutated=false | PASS | Sinyal verisi smoke testte doğrulandı. |

## 10. Kalan Limitation’lar
- Full fraud scoring motoru yok (06D planında).
- Otomatik hesap/ödeme hold yok (Advisory bazlı).
- Role granularity (RISK_OPERATOR vs ADMIN) şu an için ADMIN/OPERATOR seviyesinde birleşik.

## 11. Nihai Karar
Karar: **PASS**
BFF route guard'ları, domain-triggered ingest foundation ve port standardizasyonu başarıyla tamamlanmıştır. Tüm senaryolar runtime kanıtlarıyla doğrulanmıştır.
