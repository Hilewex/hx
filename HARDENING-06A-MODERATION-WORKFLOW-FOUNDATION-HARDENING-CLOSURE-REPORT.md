# HARDENING-06A — Moderation Workflow Foundation Hardening Closure Report

## 1. Kısa Özet
- Paket amacı: Post, Review, UGC ve Q&A question create akışlarını moderation workflow foundation'a bağlamak ve moderation decision boundary'yi korumak.
- Yapılan implementation: Domain create akışlarında `PENDING` moderation state ve moderation case foundation entegrasyonu mevcut; BFF moderation create guard müşteri/creator direct-write'a kapalı; smoke suite `moderation-workflow` tamamlandı ve `package.json` / `run-smoke.ts` kaydı doğrulandı.
- Yapılmayanlar: Decision sonrası target owner protected command pipeline, risk/fraud signal entegrasyonu, abuse scoring, AI moderation ve full moderation panel UI yapılmadı.
- Nihai karar: PASS WITH LIMITATION. Kod typecheck/build geçti, BFF Postgres ile boot etti ve `smoke:moderation-workflow` PASS oldu; migration runner mevcut DB state nedeniyle shipment timeline migration'da durduğu ve `smoke:all` içinde 06A dışı suite fail'leri bulunduğu için limitation korundu.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06-00A-MODERATION-WORKFLOW-INVENTORY.md | Okundu | Moderation truth owner boundary referansı. |
| HARDENING-06-00B1-RISK-FRAUD-CORE-INVENTORY.md | Okundu | Risk/fraud 06A kapsam dışı tutuldu. |
| HARDENING-06-00B2-ABUSE-SIGNAL-COVERAGE-INVENTORY.md | Okundu | Abuse signal 06B borcu olarak kaldı. |
| HARDENING-05D-SOCIAL-ACTION-PERMISSION-ENFORCEMENT-CLOSURE-REPORT.md | Okundu | Social route permission baseline. |
| HARDENING-05C-PANEL-ADMIN-CREATOR-ROUTE-PROTECTION-CLOSURE-REPORT.md | Okundu | Admin/creator guard baseline. |
| planlama/21-post sistemi.md | Referans | Post domain hedef davranışı. |
| planlama/31-yorum ve puanlama sistemi.md | Referans | Review domain hedef davranışı. |
| planlama/32-soru cevap sistemi.md | Referans | Q&A domain hedef davranışı. |
| planlama/34-kullanıcı story sistemi.md | Referans | UGC/story hedef davranışı. |
| planlama/50-medya sistemş asset  sitemi.md | Referans | Media moderation bu paket kapsamı dışı. |
| planlama/25-kural -yetki sistemi.md | Referans | Guard ve permission modeli. |
| planlama/40-admin sistemi.md | Referans | Admin/operator/moderator modeli. |
| planlama/62-MASTER_IMPLEMENTATION_PLAN.md | Referans | 06B/06C ayrımı. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| tests/smoke/suites/moderation-workflow.ts | Smoke senaryosu guest/customer/creator negatifleri, operator create guard kontrolü, domain pending status kontrolleri, case targetType ve `targetTruthMutated=false` kontrolleriyle tamamlandı. | HARDENING-06A zorunlu smoke kapsamını gerçek route/response davranışına bağlamak. |
| HARDENING-06A-MODERATION-WORKFLOW-FOUNDATION-HARDENING-CLOSURE-REPORT.md | Bu rapor eklendi. | Paket kapanış ve test sonuçlarını dürüst kayıt altına almak. |

## 4. Moderation Route Guard Sonucu
- `apps/bff/src/server/moderation.ts` create case route'u `requireAdminOrOperator` altında.
- Guest direct create: smoke içinde 401 bekleniyor.
- Customer direct create: smoke içinde 403 bekleniyor.
- Creator direct create: smoke içinde 403 bekleniyor.
- Operator direct create: smoke içinde accepted bekleniyor; mevcut çalıştırmada Postgres bağlantısı olmadığı için 500 döndü.

## 5. Domain Moderation Case Integration Sonucu

### Post
- Create sonrası `STORE_POST` targetType ile moderation case oluşturma foundation kodu mevcut.
- Create sonrası status `SUBMITTED`, `moderationStatus=PENDING`.
- Domain create doğrudan APPROVED/REJECTED üretmiyor.

### Review
- Create sonrası `REVIEW` targetType ile moderation case oluşturma foundation kodu mevcut.
- Create sonrası status `SUBMITTED`, `moderationStatus=PENDING`, visibility `NOT_VISIBLE`.
- Domain create doğrudan APPROVED/REJECTED üretmiyor.

### UGC
- Create sonrası `UGC` targetType ile moderation case oluşturma foundation kodu mevcut.
- Create sonrası status `SUBMITTED`, `moderationStatus=PENDING`, visibility `NOT_VISIBLE`.
- Domain create doğrudan APPROVED/REJECTED üretmiyor.

### Q&A
- Question ask sonrası `QA_QUESTION` targetType ile moderation case oluşturma foundation kodu mevcut.
- Create sonrası status `SUBMITTED`, `moderationStatus=PENDING`, visibility `NOT_VISIBLE`.
- Answer/publish transition pipeline bu paket kapsamı dışında bırakıldı.

## 6. Boundary Review
- Moderation service target domain truth'u doğrudan mutate etmiyor.
- `targetTruthMutated=false` ve domain-specific truth flags false kalacak şekilde korunuyor.
- BFF truth owner olarak domain kararı üretmiyor.
- Event/audit kayıtları business mutation yerine geçirilmedi.
- Full panel direct-write bu paket kapsamında eklenmedi.

## 7. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | PowerShell policy nedeniyle `pnpm.cmd run typecheck` olarak çalıştırıldı; sandbox dışı çalıştırmada geçti. |
| `pnpm run build` | PASS | PowerShell policy nedeniyle `pnpm.cmd run build` olarak çalıştırıldı; sandbox dışı çalıştırmada geçti. |
| Docker Postgres | PASS | `docker compose -f infra/compose/docker-compose.local.yml up -d postgres`; `localhost:5433` TCP açık. |
| Migration | FAIL | `pnpm.cmd --filter @hx/persistence run migrate`; eski migration kayıt/state uyumsuzluğu nedeniyle `shipments.timeline already exists`. Moderation migration'ları önceden uygulanmış görünüyor. |
| BFF boot | PASS | Postgres env ile başlatıldı; `GET /health` 200 döndü. |
| `pnpm run smoke:health` | PASS | Docker/Postgres sonrası geçti. |
| `pnpm run smoke:auth-permission` | PASS | Docker/Postgres sonrası geçti. |
| `pnpm run smoke:admin-permission` | PASS | Docker/Postgres sonrası geçti. |
| `pnpm run smoke:social-permission` | PASS | Docker/Postgres sonrası geçti. |
| `pnpm run smoke:moderation-workflow` | PASS | Moderation workflow foundation hardening verified. |
| `pnpm run smoke:all` | PARTIAL | 06A suite PASS; customer retrieval 403, storefront creation 401 ve media process 401 gibi 06A dışı suite fail'leri var. |

## 8. Kalan Limitation'lar
- Decision sonrası target owner protected command pipeline HARDENING-06C'ye kaldı.
- Risk signal integration HARDENING-06B'ye kaldı.
- Abuse scoring yok.
- AI moderation yok.
- Full moderation panel UI yok.
- `smoke:all` içinde 06A dışı customer/storefront/media suite fail'leri kaldı.
- Migration runner mevcut DB state ile tam idempotent değil: `20260430_002_shipment_timeline.sql` `shipments.timeline already exists` hatasıyla durdu.
- `services/moderation/src/repository/postgres.ts` içinde `_idempotency` için runtime `CREATE TABLE IF NOT EXISTS` devam ediyor; production davranışı olarak bırakılmamalı, idempotent migration'a taşınmalı.

## 9. HARDENING-06B / 06C Hazırlığı
06B için:
- Risk signal guard ve domain signal integration borçları.
- Abuse signal coverage ve scoring pipeline.

06C için:
- Moderation decision sonrası target owner protected command transition borçları.
- Social content visibility enforcement borçları.
- Moderation decision event'inin sadece audit/event kalması, domain mutation için owner command gerektirmesi.

## 10. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekçe:
- `typecheck` PASS.
- `build` PASS.
- BFF boot PASS.
- `smoke:moderation-workflow` PASS.
- Post/Review/UGC/Q&A create sonrası moderation case oluşumu smoke ile doğrulandı.
- create moderation case route customer/creator direct create'e kapalı, operator/admin path smoke ile doğrulandı.
- `targetTruthMutated=false` ve target truth mutation boundary smoke ile doğrulandı.
- Limitation: migration runner mevcut DB state ile fail ediyor ve `smoke:all` içinde 06A dışı suite fail'leri var.
