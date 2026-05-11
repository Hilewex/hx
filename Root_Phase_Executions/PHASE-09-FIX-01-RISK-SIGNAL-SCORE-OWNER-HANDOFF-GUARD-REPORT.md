# PHASE-09-FIX-01 — Risk Signal / Score / Owner Handoff Guard Report

## 1. Görev Bilgisi
- **Görev adı:** PHASE-09-FIX-01 — Risk Signal / Score / Owner Handoff Guard
- **Görev tipi:** Kontrollü foundation implementation paketi.
- **Kod değişikliği yapıldı mı?:** Evet.
- **Nihai karar:** PASS WITH LIMITATION

## 2. Amaç
Bu paket, PHASE-09 source review içinde açık kalan `GAP-RISK-SIGNAL-HANDOFF` maddesini foundation seviyesinde kapatmak için uygulanmıştır. Amaç risk signal / score / case / review hattını business truth mutation'dan ayırmak, owner handoff evidence üretmek, Risk BFF'nin truth üretmediğini göstermek ve smoke seviyesinde non-mutation kanıtını güçlendirmektir.

Bu paket full fraud engine, full ML risk scoring, production karar motoru veya durable persistence/outbox implementasyonu değildir.

## 3. Kullanılan Referanslar
- `Root_Phase_Executions/PHASE-09-SOURCE-REVIEW-RISK-FRAUD-ANALYTICS-NOTIFICATION-BOUNDARY-REPORT.md`
- `Root_Phase_Executions/PHASE-09-SOURCE-REVIEW-REVISION-NOTE.md`
- `Root_Phase_Executions/PHASE-09-FIX-00-RISK-FRAUD-ANALYTICS-NOTIFICATION-ROUTE-BUILD-SMOKE-RUNTIME-RECOVERY-REPORT.md`
- `Root_Phase_Executions/PHASE-09-START-CONTEXT-HANDOFF-REPORT.md`
- `Root_Phase_Executions/PHASE-08-CLOSURE-REPORT.md`
- `Root_Phase_Executions/PHASE-08-FIX-05-PANEL-AUDIT-EVIDENCE-MAKER-CHECKER-READINESS-REPORT.md`
- `planlama 2/Readiness_Documents/PHASE-09-RISK-FRAUD-ANALYTICS-NOTIFICATION-READINESS.md`
- `planlama 2/Readiness_Documents/PHASE-12-DEPLOYMENT-OBSERVABILITY-SECURITY-RELEASE-GATE.md`
- `planlama 2/Readiness_Master_Plans/00-PRODUCTION_READINESS_WORKING_RULES.md`
- `planlama 2/Readiness_Master_Plans/04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `planlama 2/Readiness_Master_Plans/09-RELEASE_BLOCKER_REGISTER.md`
- `planlama/Asama_Belgeleri/aşama-2/OWNER_MATRIX.md`
- `planlama/Asama_Belgeleri/aşama-2/GUARD_MATRIX.md`
- `planlama/Asama_Belgeleri/aşama-3/IDEMPOTENCY_POLICIES.md`
- `planlama/Asama_Belgeleri/aşama-11/AUDIT_TAXONOMY.md`
- `planlama/Asama_Belgeleri/aşama-11/EVENT_TAXONOMY.md`
- `planlama/Asama_Belgeleri/aşama-14/ERROR_CODE_STANDARD.md`
- `planlama/Mimari_Konfigurasyon/TEST_STRATEJISI.md`
- `planlama/Sistem_Tasarimlari/49-fraud risk abuse sistemi.md`
- `planlama/Sistem_Tasarimlari/25-kural -yetki sistemi.md`
- `planlama/Sistem_Tasarimlari/40-admin sistemi.md`
- `planlama/Sistem_Tasarimlari/45-sipariş operasyon sistemi.md`
- `planlama/Sistem_Tasarimlari/47-finansal mutabakat  hakediş sistemi.md`
- `planlama/Sistem_Tasarimlari/54-payaut ödeme çıkış sistemi.md`
- `planlama/Sistem_Tasarimlari/22-moderasyon sistemi.md`

## 4. Değişen Dosyalar
- `packages/contracts/src/risk.ts`
- `services/risk/src/risk.ts`
- `services/risk/src/repository/postgres.ts`
- `services/risk/src/smoke-test.ts`
- `apps/bff/src/server/risk.ts`
- `tests/smoke/suites/risk-signal.ts`
- `tests/smoke/run-smoke.ts`
- `packages/contracts/src/index.d.ts` silindi; stale generated declaration shadowing kaldırıldı.
- `packages/contracts/src/risk.d.ts` silindi; stale generated declaration shadowing kaldırıldı.

Not: Typecheck/build komutları bazı `tsconfig.tsbuildinfo` çıktılarını güncelledi. Bunlar fonksiyonel source değişikliği değildir.

## 5. Kapsam Dışı Bırakılanlar
- Fraud ayrı boundary implementation.
- Fraud false-positive review workflow.
- Full ML scoring engine.
- Payment/order/payout/finance/moderation truth mutation.
- Durable audit/event/outbox persistence.
- Durable retry/DLQ/backoff.
- Analytics PII/non-mutation guard.
- Notification privacy/idempotency guard.
- Panel evidence full pipeline integration.
- Production observability dashboard.
- DB migration.

## 6. Başlangıç Gap'i
`GAP-RISK-SIGNAL-HANDOFF`, risk signal ve risk case hattının owner domain kararlarından yeterince ayrışmadığını, owner handoff evidence modelinin açık olmadığını ve smoke kapsamının risk non-mutation / handoff kanıtını yeterince göstermediğini belirtiyordu.

Bu paket başlangıç gap'ini risk contract, service, BFF validation ve smoke seviyesinde ele aldı.

## 7. Risk Contract / Model Foundation
`packages/contracts/src/risk.ts` içinde risk foundation modeli genişletildi:
- `RiskSignal`
- `RiskScore`
- `RiskCase`
- `RiskReviewDecision`
- `RiskOwnerHandoffEvidence`
- `RiskBoundaryFlags`
- `RiskSignalSource`
- `RiskTargetType`
- `RiskDecisionStatus`

Zorunlu boundary/evidence alanları model seviyesinde görünür hale getirildi:
- `riskSignalOnly: true`
- `businessTruthMutated: false`
- `ownerTruthMutatedByRisk: false`
- `orderTruthMutated: false`
- `paymentTruthMutated: false`
- `payoutTruthMutated: false`
- `financeTruthMutated: false`
- `moderationTruthMutated: false`
- `bffTruthMutated: false`
- `uiTruthMutated: false`
- `ownerHandoffRequired`
- `ownerDomainHandoff`
- `auditEvidenceRequired: true`
- `reasonCodeRequired: true`
- `correlationId`
- `idempotencyKey`
- `actorId` veya `systemActorId`
- `createdAt` / `requestedAt`

`RiskTargetType` foundation kapsamına `PAYOUT` eklendi. Bu ekleme payout truth mutation anlamına gelmez; sadece risk handoff evidence hedef tipinin açıkça ifade edilmesini sağlar.

## 8. Risk Service Foundation
Risk service artık foundation seviyesinde şunları yapar:
- Risk signal input'unu validate eder.
- `reasonCode`, `correlationId`, `idempotencyKey` eksikliğini reddeder.
- Risk score / severity / category üretir.
- Risk case oluşturur.
- Risk review decision üretir.
- Owner handoff evidence üretir.
- Audit/evidence object üretir.
- Duplicate idempotency davranışında `duplicate` / `alreadyProcessed` evidence döner.

Risk service şunları yapmaz:
- Payment status değiştirmez.
- Order status değiştirmez.
- Payout hold/release truth değiştirmez.
- Finance ledger/settlement truth değiştirmez.
- Moderation decision truth değiştirmez.
- Notification/event/outbox kayıtlarını business decision yerine kullanmaz.

Risk service yalnız risk domain kaydını ve risk evidence çıktısını üretir. Owner truth mutation bu pakette ve risk servisinde yoktur.

## 9. Risk BFF Route Boundary
Risk BFF route foundation seviyesinde:
- Request parse/validation yapar.
- `reasonCode`, `correlationId`, `idempotencyKey` eksikse 400 döner.
- Risk service'e delegasyon yapar.
- Standard response envelope yapısını korur.

Risk BFF route şunları yapmaz:
- Business truth üretmez.
- Reason code veya audit evidence uydurmaz.
- Owner domain adına state değiştirmez.
- Payment/order/payout/finance/moderation mutation tetiklemez.

## 10. Owner Handoff Evidence
Risk çıktısı aşağıdaki foundation karar statülerinden biriyle temsil edilir:
- `SIGNAL_RECORDED`
- `CASE_CREATED`
- `REVIEW_REQUIRED`
- `OWNER_HANDOFF_REQUIRED`
- `NO_ACTION_MONITOR`
- `ALREADY_PROCESSED`

Owner handoff evidence içinde şu alanlar üretilir:
- `targetDomain`
- `targetType`
- `targetId`
- `riskScore`
- `severity`
- `reasonCode`
- `correlationId`
- `idempotencyKey`
- `decisionStatus`
- `handoffRequired`
- `ownerTruthMutatedByRisk: false`

Foundation owner handoff mapping'i yalnız evidence üretir. Örnek owner domainler:
- `ORDER_OPERATIONS_OWNER`
- `PAYMENT_OWNER`
- `PAYOUT_OWNER`
- `FINANCE_REFUND_OWNER`
- `MODERATION_OWNER`
- `COMMERCE_OWNER`
- `AUTH_ACCESS_OWNER`

Bu owner domainler adına hiçbir state mutation yapılmaz.

## 11. Audit / Event / Idempotency Davranışı
Audit/evidence davranışı foundation seviyesindedir:
- Risk service audit evidence object üretir.
- Audit append varsa best-effort şekilde çağrılır.
- Audit/event kaydı business mutation yerine geçmez.
- Event consumer mutation bu paketin kapsamı değildir.
- Durable event/outbox bu pakette kurulmamıştır.

Idempotency davranışı:
- Signal/case/review akışında `idempotencyKey` zorunlu hale getirildi.
- Process-local / repository seviyesindeki mevcut duplicate guard korunarak görünür hale getirildi.
- Duplicate istek `duplicate: true`, `alreadyProcessed: true` ve `ALREADY_PROCESSED` evidence döner.
- Duplicate durumda owner truth mutation yapılmaz.

Limitation: Durable idempotency, durable audit/event/outbox ve retry/DLQ davranışı PHASE-12 veya ilgili persistence/eventing hardening paketine devredilmiştir.

## 12. Direct Mutation Boundary Review
- **Risk order truth mutate ediyor mu?** Hayır.
- **Risk payment truth mutate ediyor mu?** Hayır.
- **Risk payout truth mutate ediyor mu?** Hayır.
- **Risk finance truth mutate ediyor mu?** Hayır.
- **Risk moderation truth mutate ediyor mu?** Hayır.
- **Risk BFF truth üretiyor mu?** Hayır.
- **Risk UI truth üretiyor mu?** Hayır.
- **Risk event/outbox üzerinden business mutation yapıyor mu?** Hayır.

Risk sonucu hiçbir durumda `order cancelled`, `payment blocked`, `payout released/held`, `finance corrected`, `moderation removed` gibi owner truth sonucu üretmez.

## 13. Smoke / Test Sonuçları
| Komut | Sonuç | Exit Code | Not |
| --- | --- | --- | --- |
| `pnpm run typecheck` | PASS | 0 | Contract/service/BFF/smoke typecheck PASS. |
| `pnpm run build` | PASS | 0 | Build PASS. |
| `pnpm run smoke:risk-signal` | PASS | 0 | Valid signal, score/evidence, missing reason/correlation/idempotency guards, duplicate idempotency, case/review owner handoff ve non-mutation assertions PASS. |
| `pnpm run smoke:analytics` | PASS | 0 | Regression smoke PASS. |
| `pnpm run smoke:notification` | PASS | 0 | Regression smoke PASS. |
| `pnpm run smoke:event-audit` | PASS | 0 | Regression smoke PASS. |
| `pnpm run smoke:event-outbox` | PASS | 0 | Regression smoke PASS. |

## 14. Kapanan Maddeler
- `GAP-RISK-SIGNAL-HANDOFF` foundation seviyesinde kapandı.
- Risk owner handoff evidence üretimi eklendi.
- Risk non-mutation boundary flags contract ve smoke seviyesinde görünür hale getirildi.
- Risk idempotency foundation davranışı duplicate evidence ile görünür hale getirildi.
- Risk smoke coverage owner handoff, missing evidence guard ve business truth non-mutation yönünden güçlendirildi.

## 15. Açık Kalan Maddeler
- `GAP-FRAUD-REVIEW-HANDOFF`
- `GAP-ANALYTICS-PII-NON-MUTATION`
- `GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY`
- `GAP-EVENT-AUDIT-OUTBOX-DURABILITY`
- `GAP-PANEL-EVIDENCE-INTEGRATION`
- Durable audit/event/idempotency/outbox.
- Full ML risk/fraud engine.
- Production observability.

## 16. Ertelenen Maddeler
| Madde | Neden ertelendi | Devredilen phase/fix | Kapanış kriteri |
| --- | --- | --- | --- |
| Fraud Signal / Review / False Positive Guard | Bu paket yalnız risk handoff foundation kapsamındadır; fraud ayrı boundary bu scope'a dahil değildir. | PHASE-09-FIX-02 | Fraud signal/review contract, service boundary, false-positive guard ve smoke evidence PASS. |
| Analytics Event Taxonomy / PII / Non-Mutation Guard | Analytics PII ve taxonomy guard ayrı gap'tir. | PHASE-09-FIX-03 | Analytics event taxonomy, PII guard, non-mutation evidence ve smoke PASS. |
| Notification Dispatch / Template / Privacy / Idempotency Guard | Notification privacy/idempotency bu paketin risk scope'u dışındadır. | PHASE-09-FIX-04 | Notification dispatch/template/privacy/idempotency guard ve smoke PASS. |
| Event / Audit / Outbox Boundary Foundation | Event/audit/outbox boundary ayrı durability ve eventing gap'idir. | PHASE-09-FIX-05 | Event/audit/outbox boundary foundation, non-mutation evidence ve smoke PASS. |
| Risk/Fraud/Analytics/Notification Smoke Coverage Foundation | Cross-domain smoke matrix bu paketin dar risk scope'u dışındadır. | PHASE-09-FIX-06 | Panel/evidence/smoke matrix kapsamı PASS. |
| Durable audit/event/idempotency/outbox | Durable persistence, retry, DLQ ve migration gerektirir. | PHASE-12 veya persistence/eventing hardening | Durable persistence, retry/DLQ/backoff, idempotency store ve operational evidence PASS. |

## 17. Risk / Release Blocker Etkisi
Bu paket PHASE-09 source review risklerini tamamen kapatmaz. `GAP-RISK-SIGNAL-HANDOFF` foundation seviyesinde kapatılmıştır; ancak fraud, analytics PII, notification privacy/idempotency, durable outbox ve panel evidence integration açıkları geçerliliğini korur.

Risk boundary artık owner handoff ve non-mutation açısından daha net kanıt üretir. Buna rağmen production-ready claim yapılmamaktadır. Durable audit/event/idempotency/outbox ve production observability eksikleri release blocker değerlendirmesinde açık kalır.

## 18. Nihai Karar
Typecheck, build ve istenen regression smoke komutları PASS olmuştur. Risk signal / score / case / review hattı business truth mutation'dan ayrılmış, owner handoff evidence üretimi eklenmiş, BFF truth üretmeyen boundary olarak korunmuş ve smoke coverage bu davranışı kanıtlayacak şekilde güçlendirilmiştir.

Durable audit/event/idempotency/outbox, fraud boundary, analytics PII, notification privacy/idempotency ve panel evidence integration kapsam dışında kaldığı için nihai karar **PASS WITH LIMITATION**'dır.

## 19. Sonraki Önerilen Paket
PHASE-09-FIX-02 — Fraud Signal / Review / False Positive Guard

## 20. Baş Mimar İncelemesi İçin Not
Bu rapor baş mimar tarafından incelenmeden PHASE-09-FIX-02'ye geçilmemelidir. PHASE-09-FIX-01 burada durdurulmuştur.
