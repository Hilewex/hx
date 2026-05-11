# PHASE-09-FIX-03 — Analytics Event Taxonomy / PII / Non-Mutation Guard Report

## 1. Görev Bilgisi
- **Görev adı:** PHASE-09-FIX-03 — Analytics Event Taxonomy / PII / Non-Mutation Guard
- **Görev tipi:** Foundation Implementation / Security & Privacy Guard
- **Kod değişikliği yapıldı mı?:** Evet
- **Nihai karar:** PASS WITH LIMITATION

## 2. Amaç
Bu paketin temel amacı, risk, fraud ve analytics hizmetlerinin domain isolation (sınır) pratiklerini sağlamlaştırmanın bir parçası olarak `GAP-ANALYTICS-PII-NON-MUTATION` bulgusunu foundation seviyesinde kapatmaktır. Analytics event ingestion hattı, PII maskeleme ve taxonomy kontrolleriyle güçlendirilirken, analitik davranışlarının hiçbir business truth/owner state üzerinde doğrudan mutation yapmadığı foundation boundary bayraklarıyla kanıtlanmıştır.

## 3. Sistem Dosyası Gereksinim Özeti
- **48-arka paln analatik ölçümleme sistemi.md:** Analitik sistemin salt-okunur (read-model) ve analiz/hesaplama odaklı çalışması gerektiğini vurgular. Business state veya truth doğrudan analitik pipeline üzerinden yazılmamalı/mutasyona uğramamalıdır.
- **25-kural -yetki sistemi.md:** Sistem sınırları ve actor izinleri dahilinde hareket edilmesi gerektiğini; analitiğin izinsiz veya sahte actor bilgileriyle event işlememesi gerektiğini belirtir.
- **EVENT_TAXONOMY.md:** Event adlandırmalarının canonical olması gerektiğini (örn. raw event, derived metric, decision signal ayrımı), `event_name`'in belirli standartlara (fiil + sonuç vb.) uymasını zorunlu kılar. Unknown/invalid event tiplerinin rejected olması önemlidir.
- **OWNER_MATRIX.md:** Hangi servisin hangi verinin (truth) "owner" (sahibi) olduğunu belirler. Analitik, event truth owner değildir ve sipariş/ödeme vb. owner state mutasyonu yapamaz.
- **TEST_STRATEJISI.md:** Boundary, PII ve mutation durumlarının smoke testlerle (ve non-mutation bayraklarıyla) runtime’da açıkça izlenebilir ve assert edilebilir olmasını talep eder.

## 4. Kullanılan Referanslar
- `planlama/Sistem_Tasarimlari/48-arka paln analatik ölçümleme sistemi.md`
- `planlama/Sistem_Tasarimlari/25-kural -yetki sistemi.md`
- `planlama/Asama_Belgeleri/aşama-11/EVENT_TAXONOMY.md`
- `planlama/Asama_Belgeleri/aşama-11/AUDIT_TAXONOMY.md`
- `planlama/Asama_Belgeleri/aşama-2/OWNER_MATRIX.md`
- `Root_Phase_Executions/PHASE-09-SOURCE-REVIEW-RISK-FRAUD-ANALYTICS-NOTIFICATION-BOUNDARY-REPORT.md`
- `Root_Phase_Executions/PHASE-09-SOURCE-REVIEW-REVISION-NOTE.md`

## 5. Değişen Dosyalar
- `packages/contracts/src/analytics.ts`: Event record ve mutation result arayüzlerine PII, non-mutation evidence ve taxonomy check bayrakları eklendi.
- `services/analytics/src/analytics.ts`: `sanitizePII` fonksiyonu, regex bazlı taxonomy kontrolü eklendi; dönüş objelerine yeni bayraklar yansıtıldı.
- `services/analytics/src/repository/postgres.ts`: Veritabanı sorgularının dönüştürülmesinde (mapper) PII ve diğer evidence bayraklarının okunması eklendi.
- `tests/smoke/suites/analytics.ts`: Taxonomy validation, guest spoof denial, PII redaksiyonu (masking) test senaryoları eklendi.

## 6. Kapsam Dışı Bırakılanlar
- Full analytics warehouse (veri ambarı) kurulumu
- Full BI/reporting dashboard veya veri gölü (Data Lake) kurulumu
- Production ML / AI engine geliştirilmesi
- Durable (dayanıklı) event / outbox / DLQ mekanizmaları
- Notification privacy/idempotency guard (PHASE-09-FIX-04'e devredildi)
- Panel evidence full pipeline integration

## 7. Başlangıç Gap’i
**GAP-ANALYTICS-PII-NON-MUTATION:**
Analitik eventlerinin, yapısal olarak veya dikkatsiz payload gönderimi nedeniyle raw PII içeriklerini loglaması; analitik verilerin, "owner" olmadığı domainlerin state mutasyonlarını gizlice (side-effect) yapabileceği riskini taşıması; ingestion hattında taksonomi/onaylı isim kontrolü eksikliği.

## 8. Analytics Contract / Model Foundation
Aşağıdaki boundary flag ve alanları eklenmiştir:
- `piiDetected`, `piiMasked`, `piiMinimized`, `piiDroppedFields`
- `analyticsEventOnly: true`
- `ownerTruthMutatedByAnalytics: false`, `financeTruthMutated: false`, `moderationTruthMutated: false`, vb.
- `allowedEventType`, `eventTaxonomyChecked: true`, `auditEvidenceRequired: true`
- Duplicate koruması için `duplicate` ve `alreadyProcessed` evidence bayrakları.

## 9. Analytics Service Foundation
Analytics Service (`AnalyticsService.ingestAnalyticsEvent`):
- PII taraması (email, phone, ipaddress, fullname vb.) yaparak PII maskelemeyi uygular (masklanan keyler için değere `[REDACTED]` atanır ve evidence olarak dönülür).
- Gelen event isminin `ALLOWED_EVENT_NAMES_REGEX` kuralına (`^[a-z0-9_\-]+$`) uyup uymadığını kontrol ederek bilinmeyen taksonomiyi reddeder.
- Veri kayıt anında tüm "non-mutation" bayraklarını `false` değerleriyle döner (örneğin `orderTruthMutated: false`).
- Duplicate (idempotencyKey eşleşmesi) anında owner state/truth mutasyon bayraklarının yine `false` olduğunu garanti eder.

## 10. Analytics BFF Route Boundary
BFF:
- Token ve auth bağlamından gelen rol ile payload içindeki actor bilgisini uyuşturur, guest/spoof denemelerini `403` veya `401` ile reddeder.
- Analitik servis çağırma hazırlığını yapar. Sadece event context validation yapar ve "truth" üretmez. Kararlar (taxonomy, PII drop) servise aittir.

## 11. Event Taxonomy Guard
Taksonomi kuralı olarak event name alanı harf, rakam, alt çizgi ve tire karakterlerinden oluşmalıdır (`/^[a-z0-9_\-]+$/`). Uymayan isimler (örn. boşluk, noktalama içerenler) exception fırlatarak `400 Bad Request` yanıtı ürettirir ve sisteme kaydedilmez. Sessiz kabul (silently accepted) davranışı engellenmiştir.

## 12. PII / Privacy Guard
`sanitizePII` fonksiyonu kullanılarak rekürsif bir JSON ağacı taraması yapılır:
- `email`, `phone`, `fullname`, `address`, `ipaddress` vb. bilinen PII kelime köklerini key bazında yakalar.
- PII yakalandığında raw datayı tutmaz, yerine `[REDACTED]` koyarak minimize eder ve bunu `piiMasked: true` ve `piiDroppedFields` flagleriyle belirtir. Storage içinde de salt maskelenmiş hali kalır.

## 13. Audit / Event / Idempotency Davranışı
- Gelen command `idempotencyKey` taşıyorsa analitik storage üzerinde kontrol yapılır. Tekrar eden event için state mutasyon (analyticsTruth vs.) false bırakılır ve result içerisinde `duplicate: true`, `alreadyProcessed: true` flagleri evidence olarak dışa vurulur.
- Ingestion sonrası async audit/outbox (foundation memory implementasyonu üzerinden) tetiklenir ancak tam durable outbox sonraki pakete bırakılmıştır (limitation).

## 14. Direct Mutation Boundary Review
- **Analytics order truth mutate ediyor mu?** Hayır (`orderTruthMutated: false`).
- **Analytics payment truth mutate ediyor mu?** Hayır (`paymentTruthMutated: false`).
- **Analytics payout truth mutate ediyor mu?** Hayır (`payoutTruthMutated: false`).
- **Analytics finance truth mutate ediyor mu?** Hayır (`financeTruthMutated: false`).
- **Analytics moderation truth mutate ediyor mu?** Hayır (`moderationTruthMutated: false`).
- **Analytics customer truth mutate ediyor mu?** Hayır (`customerTruthMutated: false`).
- **Analytics BFF truth üretiyor mu?** Hayır (`bffTruthMutated: false`).
- **Analytics UI truth üretiyor mu?** Hayır (`uiTruthMutated: false`).
- **Analytics event/outbox üzerinden business mutation yapıyor mu?** Hayır, event consumer'ları bu truth'a dayanarak "owner" entity mutasyonu yapamazlar (owner mutation kuralı).

## 15. Smoke / Test Sonuçları

| Komut | PASS/FAIL | Exit Code | Not |
|-------|-----------|-----------|-----|
| `pnpm run typecheck` | PASS | 0 | Başarılı |
| `pnpm run build` | PASS | 0 | Başarılı |
| `pnpm run smoke:analytics` | PASS | 0 | Taxonomy invalidity ve PII masking başarıyla doğrulandı |
| `pnpm run smoke:risk-signal` | PASS | 0 | Regression: Sorunsuz çalıştı |
| `pnpm run smoke:fraud-signal-review-false-positive-guard` | PASS | 0 | Regression: Sorunsuz çalıştı |
| `pnpm run smoke:notification` | PASS | 0 | Regression: Sorunsuz çalıştı |
| `pnpm run smoke:event-audit` | PASS | 0 | Regression: Sorunsuz çalıştı |
| `pnpm run smoke:event-outbox` | PASS | 0 | Regression: Sorunsuz çalıştı |

## 16. Kapanan Maddeler
- `GAP-ANALYTICS-PII-NON-MUTATION` foundation seviyesinde kapandı.
- Analytics event taxonomy guard eklendi.
- Analytics PII mask / drop guard eklendi.
- Analytics non-mutation guard (evidence) sağlandı.
- Analytics idempotency (duplicate/alreadyProcessed) foundation tamamlandı.
- Analytics smoke coverage PII testini içerecek şekilde genişletildi.

## 17. Açık Kalan Maddeler
- `GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY`
- `GAP-EVENT-AUDIT-OUTBOX-DURABILITY`
- `GAP-PANEL-EVIDENCE-INTEGRATION`
- Durable audit/event/idempotency/outbox
- Full analytics warehouse/dashboard
- Production observability

## 18. Ertelenen Maddeler
- **Notification Dispatch / Template / Privacy / Idempotency Guard**: Notification truth mutation kontrolü. (PHASE-09-FIX-04)
- **Event / Audit / Outbox Boundary Foundation**: Durable olmayan yapıların (memory) veritabanına geçirilmesi/katılaştırılması. (PHASE-09-FIX-05)
- **Risk/Fraud/Analytics/Notification Smoke Coverage Foundation**: Kapsamın daha da büyütülmesi. (PHASE-09-FIX-06)
- **Durable audit/event/idempotency/outbox**: Hardening phase (PHASE-12).
- **Full analytics warehouse/dashboard**: İleri düzey BI implementasyonları (Later).

## 19. Risk / Release Blocker Etkisi
Yapılan düzenlemeler PII data leakage riskini minimuma indirir ve analitiğin cross-domain mutation potansiyeli yaratma "owner/boundary violation" release blocker'ını (GAP-ANALYTICS-PII-NON-MUTATION) çözüme ulaştırır. Analitik artık salt güvenli event kabul eden bir read-model ingest pipeline görevini yürütür.

## 20. Nihai Karar
Karar: **PASS WITH LIMITATION**.
Typecheck, build ve tüm regresyon testleri başarılı. İstenen tüm taxonomy, PII ve mutation limitleri entegre edildi. Outbox/durability konuları limitation olarak kalmıştır.

## 21. Sonraki Önerilen Paket
**PHASE-09-FIX-04 — Notification Dispatch / Template / Privacy / Idempotency Guard**

## 22. Baş Mimar İncelemesi İçin Not
Bu rapor baş mimar tarafından incelenmeden PHASE-09-FIX-04’e geçilmemelidir. Görev tamamlanmıştır.
