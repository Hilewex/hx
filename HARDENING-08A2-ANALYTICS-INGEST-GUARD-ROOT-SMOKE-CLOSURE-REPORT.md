# HARDENING-08A2 - Analytics Ingest Guard & Root Smoke Closure Report

## 1. Kisa Ozet
- Paket amaci: Analytics ingest hattini BFF context guard altina almak, body actor spoof riskini kapatmak, analytics event modelini 08A1 event/audit standardiyla hizalamak ve root `smoke:analytics` kaniti uretmek.
- Yapilan implementation:
  - BFF `/analytics/event/ingest` route'u context actor policy ile normalize edildi.
  - Guest analytics davranisi anonymous-safe allowlist ile sinirlandi.
  - Customer/creator actor ve subject spoof denemeleri 403 ile kapatildi.
  - Admin/operator system analytics event path'i acik policy ile tanimlandi.
  - Analytics contract ve service canonical actor/subject/target/correlation/causation/schemaVersion/boundary alanlariyla genisletildi.
  - Analytics audit/outbox append mevcut foundation uzerinden 08A1 correlation/schema/idempotency alanlariyla hizalandi.
  - Root `smoke:analytics` suite/script/registry eklendi.
  - Postgres analytics metric snapshot sorgularinda `"window"` kolon quote eksigi duzeltildi.
- Yapilmayanlar:
  - Notification BFF guard veya delivery hardening yapilmadi.
  - Outbox consumer/worker/retry scheduler yazilmadi.
  - Full BI/dashboard veya advanced aggregation sistemi yazilmadi.
  - Analytics risk/permission/eligibility/business truth owner yapilmadi.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-08A1-EVENT-ENVELOPE-AUDIT-CONTRACT-FOUNDATION-CLOSURE-REPORT.md` | FOUND | 08A1 event/audit/outbox boundary ve canonical field standardi korundu. |
| `HARDENING-08-00A-ANALYTICS-EVENT-AUDIT-INVENTORY.md` | FOUND | Analytics BFF guard/body spoof ve root smoke eksigi temel alindi. |
| `HARDENING-08-00B-NOTIFICATION-DELIVERY-USER-COMMUNICATION-INVENTORY.md` | FOUND | Notification guard/delivery 08B kapsaminda birakildi. |
| `HARDENING-07-FINAL-CLOSURE-REPORT.md` | FOUND | Event/outbox consumer borcu limitation olarak korundu. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | Event/audit business mutation yerine gecmez ilkesi korundu. |
| `planlama/HARDENING_PROGRESS_RECORD (1).md` | FOUND | Kanit yoksa basari yok ilkesi uygulandi. |
| `planlama/48-arka paln analatik olcumleme sistemi.md` | FOUND | Analytics karar vermez, karar sistemlerini besler ilkesi referans alindi. |
| `planlama/asama-11/EVENT_TAXONOMY.md` | FOUND | Event truth owner degildir; unknown/degraded/correlation kurallari referans alindi. |
| `planlama/asama-11/AUDIT_TAXONOMY.md` | FOUND | Audit business truth yerine gecmez ilkesi korundu. |
| `planlama/asama-2/OWNER_MATRIX.md` | FOUND | Analytics measurement owner; business/risk/permission owner degil. |
| `planlama/asama-2/GUARD_MATRIX.md` | FOUND | Auth/scope/ownership/idempotency guard zinciri uygulandi. |
| `planlama/asama-5/API_ERROR_CATALOG.md` | FOUND | 401/403/400 ayrimi canonical hata diliyle hizalandi. |
| `planlama/TEST_STRATEJISI.md` | FOUND | Typecheck/build/smoke kapanis kaniti zorunlulugu uygulandi. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | BFF/UI truth uretmez ve event ile state mutate edilmez kurali korundu. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Faz 10 analytics/event/audit foundation hedefiyle hizalandi. |

## 3. Degisen Dosyalar
| Dosya | Degisiklik | Gerekce |
|---|---|---|
| `packages/contracts/src/analytics.ts` | Analytics actor/subject/target/correlation/causation/schemaVersion ve boundary flag alanlari eklendi. | Analytics event contract 08A1 standardina yaklastirildi. |
| `services/analytics/src/analytics.ts` | Command validation, payload guard, canonical metadata, audit/outbox alignment ve boundary result alanlari guclendirildi. | Analytics ingest body-driven truth riskini azaltmak ve 08A1 uyumu saglamak. |
| `services/analytics/src/repository/in-memory.ts` | Event/snapshot/dashboard seed boundary flag output'lari eklendi. | Smoke ve service response boundary kaniti. |
| `services/analytics/src/repository/postgres.ts` | Boundary flag mapping eklendi; metric snapshot SQL `"window"` quote eksigi duzeltildi. | Postgres runtime analytics ingest smoke'unun gercek calismasi. |
| `apps/bff/src/server/analytics.ts` | Ingest guard, anonymous-safe allowlist, context actor normalization, spoof deny ve admin/system policy eklendi. | Body actor spoof riskini kapatmak. |
| `tests/smoke/suites/analytics.ts` | Root BFF-level analytics smoke suite eklendi. | Guest deny, anonymous allow, customer/creator/admin allow, spoof deny, validation ve boundary kaniti. |
| `tests/smoke/run-smoke.ts` | `analytics` suite registry'ye eklendi. | `smoke:analytics` ve `smoke:all` kapsaminda calismasi. |
| `package.json` | `smoke:analytics` scripti eklendi. | Targeted root smoke komutu. |
| `packages/*/dist`, `services/*/dist`, `apps/*/dist` | Build komutu tarafindan yeniden uretildi. | `pnpm run build` PASS kaniti; generated artifact. |

## 4. Analytics BFF Guard Sonucu
- Guest restricted event: anonymous-safe allowlist disindaki eventler 401/403 canonical deny alir.
- Guest anonymous-safe event: allowlist icindeki eventler `ANONYMOUS` actor olarak normalize edilir.
- Customer own event: actor body'den alinmaz; context `CUSTOMER` actor ile normalize edilir.
- Customer spoofed actor: body `actorId`/`actor.actorId` context ile uyusmazsa 403.
- Creator own event: context `CREATOR` actor ile normalize edilerek allowed.
- Admin/operator system event: admin/operator context ile allowed; body `SYSTEM` actor talebi varsa command actor `SYSTEM`, metadata `submittedBy` admin/operator olarak korunur.
- Context actor / body actor ayrimi: BFF body actor'a guvenmez; body actor yalniz consistency kontrolu icin okunur.
- BFF truth owner oldu mu? Hayir. BFF guard/normalization/delegation katmaninda kaldi.

## 5. Analytics Command / Event Validation Sonucu
- `eventName` bos olamaz; BFF 400, service `ANALYTICS_EVENT_NAME_REQUIRED` uretir.
- `metricFamily`, `metricType`, `dataQualityState` runtime allowlist ile kontrol edilir.
- `eventType`, `surface`, `source` guvenli string/default ile normalize edilir.
- Actor/subject/target ayrildi: actor context'ten gelir; subject/target canonical command alanlari olarak tasinir.
- `correlationId`, `causationId`, `schemaVersion` command, metadata, audit ve outbox payload schema tarafinda korunur.
- Payload/metadata body-driven olabilir; ancak payload object olmak zorunda ve minimal 16KB size guard eklendi.
- Invalid/degraded/corrected/unknown-result davranisi: mevcut exclusion korunur; `UNKNOWN_RESULT`, `DEGRADED`, `INVALID`, `CORRECTED` RAW_COUNT snapshot artisi uretmez.

## 6. Analytics Boundary Sonucu
- `analyticsTruth:true` sadece analytics event/snapshot domaini icin kullanildi.
- `businessTruthMutated:false` response, event, snapshot, metadata, audit/outbox payload seviyesinde korunur.
- `ownerStateMutated:false` korunur.
- `permissionTruth:false` korunur.
- `eligibilityTruth:false` korunur.
- `riskDecisionTruth:false` korunur.
- `eventTruthMutated:false` korunur.
- Dashboard/metric business truth degildir; dashboard seed response `analyticsTruthMutated:false` ve business boundary flag'leri false tasir.

## 7. Event / Audit / Outbox Alignment
- Analytics ingest audit/outbox append mevcut foundation uzerinden devam ediyor.
- Audit actor artik saved analytics actor'a gore yaziliyor; correlation/schema metadata tasiniyor.
- Outbox payload schema `analytics.event_ingested.v1` / `analytics.metric_snapshot_updated.v1` formatinda 08A1 producer policy ile hizali.
- Outbox delivery guarantee verilmedi; `outboxDeliveryGuaranteed:false` ve 08A1 `deliveryGuaranteed:false` korunur.
- Consumer/worker/retry scheduler bu pakete sokulmadi.

## 8. Smoke/Test Sonuclari
| Komut/Senaryo | Sonuc | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Root workspace typecheck gecti. |
| `pnpm run build` | PASS | Root workspace build gecti. |
| BFF boot | PASS | Port 3001; `PERSISTENCE_MODE=postgres`, `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db`, `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=false`. |
| `pnpm run smoke:health` | PASS | Health check passed. |
| `pnpm run smoke:event-audit` | PASS | 08A1 event/audit/outbox regression gecti. |
| `pnpm run smoke:analytics` | PASS | Guest restricted deny, anonymous allow, customer/creator/admin allow, spoof deny, eventName validation, boundary flags, metric snapshot boundary, correlation/schema verified. |
| `pnpm run smoke:all` | PASS | Registry'deki tum suite'ler PASS; `analytics` dahil calisti. |

## 9. Kalan Limitation'lar
- Full BI/dashboard sistemi yok.
- Advanced analytics aggregation yok.
- Event/outbox consumer yok.
- Outbox retry scheduler yok.
- Notification BFF guard ve delivery hardening 08B'ye kaldi.
- Root notification smoke henuz yok.
- Analytics audit/outbox append var ama delivery garantisi yok.
- Anonymous/public tracking policy dar allowlist ile sinirli; ileride event taxonomy genisletilebilir.
- Postgres migration degistirilmedi; yeni canonical analytics alanlari metadata/payload seviyesinde korunur.
- Git metadata bu workspace path'inde bulunmadigi icin `git status/diff` kaniti alinamadi.

## 10. Boundary Review
| Boundary | Sonuc | Not |
|---|---|---|
| Analytics business truth owner oldu mu? | Hayir | `businessTruthMutated:false` smoke ile dogrulandi. |
| Analytics permission/eligibility/risk owner oldu mu? | Hayir | `permissionTruth:false`, `eligibilityTruth:false`, `riskDecisionTruth:false` dogrulandi. |
| BFF truth owner oldu mu? | Hayir | BFF sadece guard/normalization/delegation yapti. |
| Body actor spoof kapandi mi? | Evet | Customer spoofed actor smoke 403 ile dogrulandi. |
| Event/audit/outbox business mutation gibi sunuldu mu? | Hayir | Boundary flag'leri false, delivery guarantee yok. |
| Notification guard bu pakete sokuldu mu? | Hayir | 08B kapsaminda kaldi. |
| Consumer/worker bu pakete sokuldu mu? | Hayir | Sadece append/status/boundary foundation korundu. |

## 11. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekce:
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- BFF boot: PASS.
- `pnpm run smoke:health`: PASS.
- `pnpm run smoke:event-audit`: PASS.
- `pnpm run smoke:analytics`: PASS.
- `pnpm run smoke:all`: PASS.
- Guest/spoofed actor deny davranisi net.
- Customer own event allowed.
- Creator own event allowed.
- Admin/system analytics path allowed ve metadata source korunuyor.
- Analytics business truth mutate etmiyor.
- BFF truth owner olmuyor.
- Body actor spoof kapandi.

Siradaki onerilen paket:
- HARDENING-08B - Notification Delivery Boundary Hardening
