# HARDENING-06E — Moderation / Risk / Abuse Smoke & Regression Closure Report

## 1. Kısa Özet
- Paket amacı: HARDENING-06A / 06B / 06C1 / 06C2 / 06D sonrası moderation-risk-abuse hattının birleşik smoke ve regression durumunu doğrulamak.
- Yapılan doğrulama: typecheck, build, Postgres BFF boot, zorunlu 06 smoke suite'leri, `smoke:all`, migration runner/idempotency ve legacy `x-actor-id` taraması çalıştırıldı.
- Yapılan küçük düzeltmeler: smoke fixture/token beklentileri 06C1 moderation owner handoff, canonical auth token ve media process admin guard davranışıyla hizalandı; `shipments.timeline` migration'ı idempotent hale getirildi.
- Yapılmayanlar: Yeni moderation feature, risk/fraud scoring, auto hold/block, provider sandbox, finance/payout/settlement abuse workflow, büyük refactor veya UI geliştirme yapılmadı.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06A-MODERATION-WORKFLOW-FOUNDATION-HARDENING-CLOSURE-REPORT.md | Okundu | 06A moderation foundation ve eski `targetTruthMutated=false` kabulü referans alındı. |
| HARDENING-06B-RISK-SIGNAL-CORE-GUARD-INGEST-HARDENING-CLOSURE-REPORT.md | Okundu | Risk ingest guard ve target truth boundary referans alındı. |
| HARDENING-06C1-SOCIAL-CONTENT-MODERATION-ENFORCEMENT-CLOSURE-REPORT.md | Okundu | Moderation decision sonrası owner domain transition davranışı referans alındı. |
| HARDENING-06C2-SOCIAL-ABUSE-SIGNAL-INTEGRATION-CLOSURE-REPORT.md | Okundu | Social abuse signal regression kapsamı referans alındı. |
| HARDENING-06D-COMMERCE-ABUSE-FRAUD-GUARD-INTEGRATION-CLOSURE-REPORT.md | Okundu | Commerce abuse signal ve kalan smoke fail listesi referans alındı. |
| HARDENING-06-00A-MODERATION-WORKFLOW-INVENTORY.md | Okundu | Moderation inventory baseline. |
| HARDENING-06-00B1-RISK-FRAUD-CORE-INVENTORY.md | Okundu | Risk/fraud core inventory baseline. |
| HARDENING-06-00B2-ABUSE-SIGNAL-COVERAGE-INVENTORY.md | Okundu | Abuse signal gap baseline. |
| HARDENING_PROGRESS_RECORD.md | Root'ta yok | Alternatif olarak `planlama/HARDENING_PROGRESS_RECORD (1).md` okundu. |
| planlama/62-MASTER_IMPLEMENTATION_PLAN.md | Okundu | Owner boundary ve acceptance disiplini. |
| planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md | Okundu | Progress ve risk/foundation bağlamı. |
| planlama/64-PACKAGE_EXECUTION_LOG.md | Okundu | Paket execution kayıtları. |
| planlama/65-ACTIVE_RISKS_AND_DECISIONS.md | Okundu | Aktif risk ve kararlar. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `tests/smoke/suites/moderation-workflow.ts` | Final domain truth beklentisi 06C1 owner handoff davranışına hizalandı. | Moderation case `targetTruthMutated=false` kalırken owner domain transition'ın APPROVED üretmesi artık beklenen davranış. |
| `tests/smoke/suites/others.ts` | Customer fixture `id=actorId` yaptı; storefront smoke geçerli CREATOR token kullandı. | Eski fixture auth/ownership drift'ini düzeltmek. |
| `tests/smoke/suites/social.ts` | Post feed kontrolü öncesi moderation case admin approve akışına bağlandı; eski manuel transition çıkarıldı. | PENDING content'in public/follow feed'de görünmemesi 06C1 sonrası beklenen davranış. |
| `tests/smoke/suites/media.ts` | `/media/process` çağrısına admin Authorization eklendi. | Media process admin/operator guard sonrası token fixture drift'ini düzeltmek. |
| `infra/migrations/20260430_002_shipment_timeline.sql` | `ADD COLUMN IF NOT EXISTS timeline JSONB` yapıldı. | Mevcut DB'de kolon var ama migration kaydı yoksa runner'ın idempotent geçmesi. |
| `HARDENING-06E-MODERATION-RISK-ABUSE-SMOKE-REGRESSION-CLOSURE-REPORT.md` | Bu rapor oluşturuldu. | 06E kapanış kanıtı. |

## 4. 06 Suite Doğrulama Sonuçları
| Suite / Komut | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Son çalıştırma PASS. |
| `pnpm run build` | PASS | Son çalıştırma PASS. |
| BFF boot | PASS | PID 12580, port 3001, `PERSISTENCE_MODE=postgres`, `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=false`. |
| `pnpm run smoke:health` | PASS | Health check geçti. |
| `pnpm run smoke:auth-permission` | PASS | 8 permission check geçti. |
| `pnpm run smoke:admin-permission` | PASS | Admin/operator permission suite geçti. |
| `pnpm run smoke:social-permission` | PASS | Social permission scenarios geçti. |
| `pnpm run smoke:commerce-permission` | PASS | Commerce ownership/permission scenarios geçti. |
| `pnpm run smoke:moderation-workflow` | PASS | 06C1 owner handoff ve moderation truth flag doğrulandı. |
| `pnpm run smoke:risk-signal` | PASS | Risk guard/ingest scenarios geçti. |
| `pnpm run smoke:social-moderation` | PASS | Social moderation enforcement geçti. |
| `pnpm run smoke:social-abuse-signal` | PASS | Social abuse signals ve `targetTruthMutated=false` geçti. |
| `pnpm run smoke:commerce-abuse-signal` | PASS | Commerce abuse/fraud signals ve boundary checks geçti. |

## 5. smoke:all Analizi
| Suite | Fail / Durum | Sınıf | 06 Regression mı? | Aksiyon |
|---|---|---|---|---|
| customer | Pre-fix 403, final PASS | TEST FIXTURE DRIFT | Hayır | Smoke profile id fixture actor ownership ile hizalandı. |
| storefront | Pre-fix 401, final PASS | TEST FIXTURE DRIFT | Hayır | Legacy `Bearer admin-token` yerine CREATOR dev token kullanıldı. |
| social | Pre-fix feed miss, final PASS | INTENDED BEHAVIOR AFTER HARDENING | Hayır | PENDING post public feed'e alınmadı; smoke admin moderation approve ile hizalandı. |
| media | Pre-fix `/media/process` 401, final PASS | TEST FIXTURE DRIFT | Hayır | Admin token eklendi. |
| moderation-workflow | Pre-fix domain truth breach, final PASS | TEST FIXTURE DRIFT | Hayır | 06A beklentisi 06C1 owner handoff sonrası güncellendi. |
| catalog | SKIPPED | NEEDS SEPARATE PACKAGE | Hayır | Catalog smoke not implemented olarak kaldı. |
| search | SKIPPED | NEEDS SEPARATE PACKAGE | Hayır | Search smoke not implemented olarak kaldı. |
| `pnpm run smoke:all` | PASS with catalog/search SKIPPED | NEEDS SEPARATE PACKAGE | Hayır | İmplemente suite'lerin tamamı PASS. |

## 6. Regression Fix Sonuçları
- Küçük smoke fixture düzeltmeleri yapıldı: customer ownership fixture, storefront auth token, social moderation approval, media process admin token, moderation workflow 06C1 expectation.
- Düzelen fail'ler: customer 403, storefront 401, social feed miss, media 401, moderation-workflow domain truth breach.
- Ayrı pakete kalanlar: catalog/search smoke implementation; production-grade full E2E coverage.

## 7. Migration / Idempotency Durumu
- İlk migration denemesi env verilmediği için default `localhost:5432` ile `ECONNREFUSED` aldı; PASS sayılmadı.
- `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db` ile migration çalıştırıldı.
- `shipments.timeline` mevcut kolon / eksik migration kaydı borcu `ADD COLUMN IF NOT EXISTS` ile düzeltildi.
- Migration runner final PASS aldı; ikinci tekrar çalıştırmada tüm migration'lar skip edildi ve idempotency doğrulandı.
- `services/moderation/src/repository/postgres.ts` içinde runtime `_idempotency` için `CREATE TABLE IF NOT EXISTS` devam ediyor; bu production-readiness teknik borcu olarak ayrı pakete kalmalı.

## 8. Legacy x-actor-id Durumu
| Dosya | Kullanım | Kritik mi? | Aksiyon |
|---|---|---|---|
| `apps/bff/src/server/context.ts` | `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=true` ise legacy actor header kabul edebiliyor. | Orta | 06 smoke'larında kapalı doğrulandı; legacy cleanup paketinde kaldırılmalı/degrade edilmeli. |
| `apps/bff/src/server/index.ts` | `x-actor-id` okunuyor ve context resolver'a veriliyor. | Orta | Primary actor source olarak kullanılmadı; legacy cleanup'a kalmalı. |
| `apps/bff/src/server/customer-address.ts` | Birçok handler doğrudan `req.headers['x-actor-id']` okuyor. | Yüksek | HARDENING-LEGACY-ACTOR-HEADER-CLEANUP / customer address guard paketi. |
| `apps/bff/src/server/customer-support.ts` | Direct `x-actor-id` / `x-actor-type` gerekiyor. | Orta | Support/customer legacy guard cleanup paketi. |
| `apps/bff/src/server/customer-social.ts` | Direct `x-actor-id` / `x-actor-type` gerekiyor. | Orta | Customer social legacy guard cleanup paketi. |
| `apps/bff/src/server/customer-reward.ts` | Direct `x-actor-id` / `x-actor-type` gerekiyor. | Orta | Customer reward legacy guard cleanup paketi. |
| `apps/bff/src/server/customer-contribution.ts` | Direct `x-actor-id` okuyor. | Orta | Customer contribution legacy guard cleanup paketi. |
| `apps/bff/src/server/pool.ts` | Direct `x-actor-id` actor context extraction. | Orta | Pool/supplier/admin protected action hardening paketi. |
| `apps/bff/src/server/store-post.ts` | Creator id direct `x-actor-id` header'dan alınıyor. | Orta | Legacy store route cleanup paketi. |
| `apps/bff/src/server/store-story.ts` | Direct `x-actor-id` header extraction. | Orta | Store story legacy guard cleanup paketi. |
| `apps/bff/src/server/store-message.ts` | Customer/creator message routes direct header kullanıyor. | Orta | Store message guard cleanup paketi. |
| `tests/smoke/*` | 06 smoke'larında legacy header primary actor source değil. | Düşük | Yeni smoke'lar Authorization token standardını kullanmalı. |

## 9. Boundary Review
- Moderation target truth owner oldu mu? Hayır. Moderation case truth kendi domaininde kaldı; 06C1 handoff owner domain fonksiyonlarına delegasyon yapıyor.
- Risk target truth owner oldu mu? Hayır. Risk signal kayıtları advisory ve `targetTruthMutated=false`.
- BFF truth owner oldu mu? Hayır. BFF validation/delegation/response mapping rolünde kaldı.
- Event/audit business mutation yerine geçti mi? Hayır.
- Guest commerce / guest social boundary korundu mu? Evet; commerce abuse smoke guest checkout açık, guest review kapalı doğruladı.
- Permission / eligibility / risk / moderation ayrımı korundu mu? Evet; permission smoke'ları ve risk/moderation smoke'ları birlikte PASS.

## 10. Kalan Limitation'lar
- `smoke:all` içinde catalog ve search suite'leri SKIPPED / not implemented.
- Runtime moderation `_idempotency` table creation borcu devam ediyor.
- Distributed rate limit yok; guest checkout velocity process-local foundation.
- Full fraud scoring yok.
- Auto hold/block yok.
- Full moderation panel UI yok.
- Provider sandbox yok.
- Finance/payout/settlement abuse ileri pakete kaldı.
- Legacy `x-actor-id` kullanan eski BFF route aileleri kaldı.

## 11. HARDENING-06 Final Kapanış Hazırlığı
| Paket | Durum | Kapanış Notu |
|---|---|---|
| 06A | PASS WITH LIMITATION | Moderation workflow foundation kuruldu; 06C1 sonrası owner handoff ile beklenti güncellendi. |
| 06B | PASS | Risk signal guard/ingest core doğrulandı. |
| 06C1 | PASS | Social moderation enforcement ve owner transition doğrulandı. |
| 06C2 | PASS | Social abuse signals ve risk boundary doğrulandı. |
| 06D | PASS WITH LIMITATION | Commerce abuse/fraud observation signals doğrulandı; ağır fraud engine kapsam dışı. |
| 06E | PASS WITH LIMITATION | 06 mandatory smoke suite'leri PASS; `smoke:all` implemente suite'lerde PASS, catalog/search SKIPPED limitation. |

## 12. Nihai Karar
Karar: PASS WITH LIMITATION

Gerekçe:
- typecheck PASS.
- build PASS.
- BFF boot PASS.
- 06 zorunlu smoke suite'leri PASS.
- 06 kaynaklı regression kalmadı.
- `smoke:all` implemente suite'lerde PASS; catalog/search SKIPPED olarak ayrı paket borcu.
- Boundary ihlali tespit edilmedi.

Sıradaki önerilen adım:
- HARDENING-06-FINAL-CLOSURE.
