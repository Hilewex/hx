# PHASE-09-FIX-04 — Notification Dispatch / Template / Privacy / Idempotency Guard Report

## 1. Görev Bilgisi
- Görev adı: PHASE-09-FIX-04 — Notification Dispatch / Template / Privacy / Idempotency Guard
- Görev tipi: Kontrollü Foundation Implementation
- Kod değişikliği yapıldı mı?: Evet
- Nihai karar: PASS WITH LIMITATION

## 2. Amaç
Bu paket GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY gap'ini kapatmayı hedefler. Notification dispatch hattının business truth mutation'dan ayrılması, notification template'lerinde PII guard foundation kurulması, duplicate/idempotency davranışının eklenmesi, provider boundary evidence üretilmesi ve smoke test coverage ile desteklenmesi sağlanmıştır.

## 3. Sistem Dosyası Gereksinim Özeti
- `19- bildirim sistemi.md`: Sistemin mail, push, SMS, in-app notification göndermesi ve bunlarla ilgili policy, channel, ve recipient kurallarına değinir. Notification içeriği business domain kararlarına dayanır ama notification kendi başına business truth değiştirmez.
- `25-kural -yetki sistemi.md`: Actor type bazlı ve role bazlı boundary kurallarına vurgu yapar (Customer, Admin vs.).
- `EVENT_TAXONOMY.md` ve `AUDIT_TAXONOMY.md`: Notification event ve audit loglarının `businessTruthMutated: false` boundary kuralıyla yazılmasını şart koşar.
- `OWNER_MATRIX.md`: Bildirimin kime (hangi domain entity) ait olduğunu ifade eder (ör. müşteri kendi notification'ını okuyabilir).
- `TEST_STRATEJISI.md`: Smoke testlerin mock ile değil gerçek memory veya sandbox ile isolation sınırlarını test etmesi gerektiğini ifade eder.

## 4. Kullanılan Referanslar
- `Root_Phase_Executions/PHASE-09-SOURCE-REVIEW-RISK-FRAUD-ANALYTICS-NOTIFICATION-BOUNDARY-REPORT.md`
- `Root_Phase_Executions/PHASE-09-FIX-00-RISK-FRAUD-ANALYTICS-NOTIFICATION-ROUTE-BUILD-SMOKE-RUNTIME-RECOVERY-REPORT.md`
- `Root_Phase_Executions/PHASE-09-FIX-01-RISK-SIGNAL-SCORE-OWNER-HANDOFF-GUARD-REPORT.md`
- `Root_Phase_Executions/PHASE-09-FIX-02-FRAUD-SIGNAL-REVIEW-FALSE-POSITIVE-GUARD-REPORT.md`
- `Root_Phase_Executions/PHASE-09-FIX-03-ANALYTICS-EVENT-TAXONOMY-PII-NON-MUTATION-GUARD-REPORT.md`
- `planlama 2/Readiness_Documents/PHASE-09-RISK-FRAUD-ANALYTICS-NOTIFICATION-READINESS.md`
- `planlama/Asama_Belgeleri/aşama-2/OWNER_MATRIX.md`
- `planlama/Asama_Belgeleri/aşama-11/EVENT_TAXONOMY.md`
- `planlama/Asama_Belgeleri/aşama-11/AUDIT_TAXONOMY.md`

## 5. Değişen Dosyalar
- `packages/contracts/src/notification.ts`: PII ve Idempotency boundary flag ve evidence'ları eklendi (`piiDetected`, `piiMasked`, `duplicate` vb.).
- `services/notification/src/notification.ts`: Idempotency logic ve PII masking guard eklendi.
- `services/notification/src/repository/postgres.ts`: Veritabanı sorgusunda yeni statik boundary evidence'lar güncellendi.
- `tests/smoke/suites/notification.ts`: PII mask testleri ve Idempotency (duplicate dispatch) smoke senaryoları eklendi.

## 6. Kapsam Dışı Bırakılanlar
- Full notification provider ops
- Full SMS/e-mail/push integration
- Full campaign notification engine
- Durable outbox / DLQ / retry / backoff
- Panel evidence full pipeline integration
- Production delivery tracking system
- Production observability dashboard
- DB migration

## 7. Başlangıç Gap’i
**GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY**: Bildirim verilerindeki hassas müşteri verilerinin (PII) açıkça yer alması ve bildirim gönderme süreçlerinde idempotent/duplicate handle mekanizmalarının ve provider boundary kanıtlarının tam yetkin olmaması durumu.

## 8. Notification Contract / Model Foundation
NotificationRecord ve NotificationMutationResult arayüzlerine aşağıdakiler eklendi:
- `ownerTruthMutatedByNotification: false`
- `financeTruthMutated: false`
- `moderationTruthMutated: false`
- `customerTruthMutated: false`
- `supportTruthMutated: false`
- `bffTruthMutated: false`
- `uiTruthMutated: false`
- `providerBoundaryChecked: boolean`
- `templateRendered: boolean`
- `piiDetected: boolean`
- `piiMasked: boolean`
- `piiMinimized: boolean`
- `piiDroppedFields: string[]`
- `duplicate?: boolean`
- `alreadyProcessed?: boolean`

## 9. Notification Service Foundation
Notification service dispatch, record oluşturma, read ve archive işlemlerini gerçekleştirir. Validation, owner doğrulaması yapar, template body/title içerisindeki telefon, email veya adres bilgilerini tespit edip simple redacting uygular. Idempotency key parametresi gelirse postgres check mekanizmasıyla duplicity tespit edip `duplicate: true`, `alreadyProcessed: true` dönerek dispatch operasyonunu tekrar yapmaz. Owner truth mutate etmez (`businessTruthMutated: false`).

## 10. Notification BFF Route Boundary
BFF route auth context yardımıyla self notification rollerine izin verir ya da `INTERNAL_SERVICE` ile gönderilenleri geçirir. Notification içeriği veya kararını (truth) oluşturmaz, gelen isteği validasyonlardan sonra service'e iletir ve sonucunu REST formatında döner. BFF, UI truth vs. maskelemez, bunu service evidence'larından alır.

## 11. Template / Privacy Guard
`createNotification` servisi içerisinde `redactPII` basit bir regex foundation şeklinde kuruldu. Email (`[REDACTED_EMAIL]`), telefon (`[REDACTED_PHONE]`) ve Türkiye adres kalıplarını (`[REDACTED_ADDRESS]`) kapatır. Raw PII maskelenir, response veya audit objesinde string açık formatta kalmaz.

## 12. Provider Boundary Evidence
Gönderim esnasında `EMAIL_SANDBOX`, `PUSH_PARKED`, `SMS_NOT_CONFIGURED` vb stateler provider simülasyonundan geçer ve dönen attempt objesine `actualProviderDeliveryPerformed: false`, `providerBoundary: 'SANDBOX' | 'PARKED'` vs flag'leri kanıt olarak eklenir. Business fail sayılmaz, gönderim sonucu owner state'ini mutate etmez.

## 13. Audit / Event / Idempotency Davranışı
Dispatch isteğinde `idempotencyKey` verilmişse, duplicate operasyon service katmanından `duplicate: true`, `alreadyProcessed: true` flagi ile veritabanındaki eski sonuç olarak döner. Event outbox ve audit logs işlemleri, bu isteğe uygun action topic'leriyle (`notification.created`, `notification.delivery_attempted` vb.) event/audit reposuna append edilir. Tam durable patternler (retry/dlq) kapsam dışıdır.

## 14. Direct Mutation Boundary Review
- Notification order truth mutate ediyor mu?: Hayır (orderTruthMutated: false)
- Notification payment truth mutate ediyor mu?: Hayır (paymentTruthMutated: false)
- Notification payout truth mutate ediyor mu?: Hayır (payoutTruthMutated: false)
- Notification finance truth mutate ediyor mu?: Hayır (financeTruthMutated: false)
- Notification moderation truth mutate ediyor mu?: Hayır (moderationTruthMutated: false)
- Notification customer truth mutate ediyor mu?: Hayır (customerTruthMutated: false)
- Notification support truth mutate ediyor mu?: Hayır (supportTruthMutated: false)
- Notification BFF truth üretiyor mu?: Hayır (bffTruthMutated: false)
- Notification UI truth üretiyor mu?: Hayır (uiTruthMutated: false)
- Notification event/outbox üzerinden business mutation yapıyor mu?: Hayır.
- Provider result business decision üretiyor mu?: Hayır.

## 15. Smoke / Test Sonuçları
| Komut | Durum | Exit Code | Not |
|---|---|---|---|
| `pnpm run typecheck` | PASS | 0 | Typecheck başarılı, contract boundary update'leri güvenli |
| `pnpm run build` | PASS | 0 | Tüm paketler ve notification derlendi |
| `pnpm run smoke:notification` | PASS | 0 | Inbox actor guard, Idempotency duplicate ve PII guard smoke testleri başarılı |
| `pnpm run smoke:notification-provider-boundary` | PASS | 0 | Provider envelope boundary verified |
| `pnpm run smoke:analytics` | PASS | 0 | Analytics regression check başarılı |
| `pnpm run smoke:risk-signal` | PASS | 0 | Risk signal regression check başarılı |
| `pnpm run smoke:fraud-signal-review-false-positive-guard` | PASS | 0 | Fraud regression check başarılı |
| `pnpm run smoke:event-audit` | PASS | 0 | Audit regression check başarılı |
| `pnpm run smoke:event-outbox` | PASS | 0 | Outbox regression check başarılı |

## 16. Kapanan Maddeler
- GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY foundation seviyesinde kapandı.
- Notification template/privacy guard
- Notification provider boundary evidence
- Notification non-mutation guard
- Notification idempotency foundation
- Notification smoke coverage

## 17. Açık Kalan Maddeler
- GAP-EVENT-AUDIT-OUTBOX-DURABILITY
- GAP-PANEL-EVIDENCE-INTEGRATION
- Durable audit/event/idempotency/outbox
- Full provider production ops
- Production observability

## 18. Ertelenen Maddeler
- Event / Audit / Outbox Boundary Foundation → PHASE-09-FIX-05
- Risk/Fraud/Analytics/Notification Smoke Coverage Foundation → PHASE-09-FIX-06
- Durable audit/event/idempotency/outbox → PHASE-12 veya persistence/eventing hardening
- Full notification provider ops → PHASE-12 veya notification provider readiness
- Production observability/dashboard → PHASE-12

## 19. Risk / Release Blocker Etkisi
PII leak engellenmiş, duplicate gönderim limiti foundation seviyesinde testlere bağlanmış ve business transaction izolasyonu sağlanmıştır. Production-ready durumu hala yoktur, audit/outbox durability gap bulunmaktadır. Limitasyonlar kapsamında bu aşama için riskleri azaltır.

## 20. Nihai Karar
**PASS WITH LIMITATION**. Tüm contract/service/smoke coverage şartları, mask/drop privacy evidence'lar ve idempotency/duplicate davranışları sağlanıp test edilmiştir.

## 21. Sonraki Önerilen Paket
PHASE-09-FIX-05 — Event / Audit / Outbox Boundary Foundation

## 22. Baş Mimar İncelemesi İçin Not
Bu rapor baş mimar tarafından incelenmeden PHASE-09-FIX-05’e geçilmemelidir.
Görev sonunda dur.
