# PHASE-06-FIX-04 — Moderation Decision / Audit / Maker-Checker Readiness Report

## 1. Amaç
Bu fix paketinin amacı, moderation decision akışlarının actor, reason/evidence, audit ve maker-checker foundation açısından güvenli olduğunu kanıtlamak/güçlendirmektir.

## 2. Başlangıç Durumu
PHASE-06-FIX-01:
- PASS

PHASE-06-FIX-02:
- PASS WITH LIMITATION

PHASE-06-FIX-03:
- PASS WITH LIMITATION

Açık riskler:
- Moderation maker-checker eksikliği.
- Audit/evidence zorunluluğu net değil.
- Risk/abuse signal moderation decision yerine geçmemeli.

## 3. Başlangıç Source Review
| Alan | Mevcut Durum | Kanıt | Karar |
|------|---------------|-------|-------|
| Moderation case | Case modeli ve snapshot vardı; target truth mutation flag false tutuluyordu | `packages/contracts/src/moderation.ts`, `services/moderation/src/moderation.ts` | PASS |
| Decision actor | Legacy `reviewModerationCase` actor almıyordu; audit `system`/`REVIEWER` ile yazılıyordu | `ReviewModerationCaseCommand`, `reviewModerationCase` | HARDENED |
| Decision evidence | Decision reason/evidence zorunlu değildi | `ReviewModerationCaseCommand` | HARDENED |
| Audit | Case create/review audit denemesi vardı; decision actor/evidence trace eksikti | `getAuditEventRepositories()` kullanımı | HARDENED |
| Maker-checker | Separate checker guard yoktu | Moderation service scan | HARDENED FOUNDATION |
| Risk signal boundary | Risk signal/case kendi risk truth’unu yazıyor, target/moderation truth mutate etmiyor | `services/risk/src/risk.ts` | PASS |
| Owner handoff | BFF decision sonrası owner helper çağırıyordu; story/media handoff yoktu | `apps/bff/src/server/moderation.ts` | PASS WITH LIMITATION |
| BFF boundary | BFF direct repository kullanmıyor, owner helper’lara delegate ediyor | `apps/bff/src/server/moderation.ts` | PASS |
| Panel/admin guard | BFF moderation route’ları admin/moderator guard altında; panel/web production direct service write yok | `guards.ts`, `apps/web/src/bootstrap/moderation.ts` | PASS WITH LIMITATION |

## 4. Değiştirilen Dosyalar
| Dosya | Değişiklik | Gerekçe | Etki |
|-------|------------|---------|------|
| `packages/contracts/src/moderation.ts` | Decision actor/evidence/maker-checker/result/record alanları eklendi; `REMOVE` decision tipi eklendi | Foundation decision contract | Contract güçlendi |
| `services/moderation/src/moderation.ts` | Actor, reason, evidence validation; maker-checker same actor guard; decision idempotency; audit/evidence result flag’leri eklendi | Güvenli decision foundation | Decision hardening |
| `services/moderation/src/repository/interface.ts` | Decision idempotency repository metotları eklendi | Same key duplicate/conflict davranışı | Repository contract güçlendi |
| `services/moderation/src/repository/in-memory.ts` | Decision idempotency store eklendi | Targeted smoke ve local foundation | PASS |
| `services/moderation/src/repository/postgres.ts` | Decision idempotency persistence table/read-write eklendi | Durable idempotency foundation | PASS |
| `apps/bff/src/server/moderation.ts` | Protected actor context, server-side fallback evidence, reasonCode, maker-checker context ve owner handoff flag service’e geçirildi; validation/conflict mapping eklendi | BFF truth üretmeden güvenli decision input sağlasın | Boundary korundu |
| `tests/smoke/suites/moderation-decision-audit-maker-checker.ts` | Yeni targeted smoke eklendi | Actor/evidence/audit/idempotency/maker-checker/risk/public leak kanıtı | PASS |
| `tests/smoke/run-smoke.ts` | Yeni suite kaydı | Smoke runner erişimi | PASS |
| `package.json` | `smoke:moderation-decision-audit-maker-checker` script’i eklendi | İstenen komut | PASS |
| `tests/smoke/suites/social.ts` | Moderation case lookup `limit=100` + `targetType` ile deterministik yapıldı | Uzun smoke oturumunda flaky case lookup | PASS |
| `services/moderation/src/test-persistence.ts` | Direct persistence test decision payload’u actor/reason/evidence ile güncellendi | Yeni validation ile uyum | PASS |
| `packages/persistence/p38-smoke-test.ts` | Pilot moderation review çağrısı actor/reason/evidence ile güncellendi | Yeni validation ile uyum | PASS |

## 5. Moderation Decision Davranışı
Actor olmadan decision:
- Rejected

Reason/evidence olmadan decision:
- Rejected

Approve decision:
- Accepted

Reject decision:
- Accepted

Idempotency:
- Supported

Same key different payload:
- Conflict

## 6. Audit / Evidence
Audit recorded:
- Evet

Evidence recorded:
- Evet

Decision actor traceable:
- Evet

Reason code traceable:
- Evet

## 7. Maker-Checker
Maker-checker enforced:
- Foundation

Same actor maker/checker:
- Rejected

Full workflow production-ready:
- Foundation

Not:
- Separate checker guard service seviyesinde enforced. Full queue, assignment, approval UI ve multi-step maker-checker workflow bu pakette üretilmedi.

## 8. Risk / Abuse Boundary
Risk signal moderation decision yerine geçiyor mu?
- Hayır

Risk signal visibility truth mutate ediyor mu?
- Hayır

Risk signal evidence/case input olabilir mi?
- Evet

## 9. Owner Handoff / Visibility
Decision BFF içinde visibility truth mutate ediyor mu?
- Hayır

Decision owner service handoff yapıyor mu?
- Kısmen

Pending/rejected public leak regression:
- PASS

Not:
- BFF handoff mevcut kapsamda `STORE_POST`, `REVIEW`, `UGC`, `QA_QUESTION`, `QA_ANSWER` için owner helper kullanıyor. Media/store-story handoff bu pakette genişletilmedi.

## 10. Panel / Admin Boundary
Panel direct moderation write var mı?
- Hayır

Admin/moderator role guard var mı?
- Evet

Actor context server-side mı?
- Evet

Not:
- `apps/web/src/bootstrap/moderation.ts` demo/bootstrap BFF çağrıları içeriyor; production panel direct service write tespit edilmedi. Maker-checker UI workflow yok.

## 11. Boundary Regression Scan
| Tarama | Sonuç | Not |
|--------|-------|-----|
| BFF direct repo | PASS | `apps/bff/src/server/moderation.ts` içinde `@hx/persistence` veya repository direct access yok; broader scan’deki insert/update/delete sonuçları unrelated route/service delegate isimleri |
| Decision actor/evidence/audit | PASS | Contract + service validation + targeted smoke PASS |
| Maker-checker guard | PASS WITH LIMITATION | Same actor maker/checker blocked; full production workflow/UI yok |
| Risk signal boundary | PASS | Risk signal/case `targetTruthMutated=false`, `moderationTruthMutated=false`; decision yerine geçmiyor |
| Public leak regression | PASS | Targeted smoke + story/review/Q&A visibility regression PASS |
| Panel direct moderation write | PASS | Production panel direct moderation write tespit edilmedi; web bootstrap demo BFF çağrısı var |

## 12. Smoke/Test Kanıtı
| Senaryo | Sonuç | Kanıt |
|---------|-------|-------|
| Decision without actor rejected | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Decision without reason/evidence rejected | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Approve with actor/reason/evidence | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Reject with actor/reason/evidence | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Duplicate same key safe | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Duplicate different payload conflict | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Same actor maker/checker blocked | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Risk signal not decision | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Risk signal no visibility mutation | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Audit recorded | PASS | `smoke:moderation-decision-audit-maker-checker` |
| Evidence recorded | PASS | `smoke:moderation-decision-audit-maker-checker` |
| visibilityTruthMutatedByBff false | PASS | `smoke:moderation-decision-audit-maker-checker` |
| social-moderation regression | PASS | `smoke:social-moderation` |
| social-abuse-signal regression | PASS | `smoke:social-abuse-signal` |
| story/review/qa visibility regression | PASS | `smoke:story-review-qa-visibility-guard` |

## 13. Komut Sonuçları
| Komut | Sonuç | Not |
|-------|-------|-----|
| `pnpm run typecheck` | PASS | Final rerun PASS |
| `pnpm run build` | PASS | Final rerun PASS |
| `pnpm run smoke:moderation-decision-audit-maker-checker` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:social-moderation` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:social-abuse-signal` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:bff-actor-spoofing-guard` | PASS | |
| `pnpm run smoke:story-review-qa-visibility-guard` | PASS | |
| `pnpm run smoke:interaction-idempotency-duplicate-prevention` | PASS | Risk signal postgres bağlantı log’u catch edildi; smoke PASS |
| `pnpm run smoke:media` | PASS | |
| `pnpm run smoke:social` | PASS | Case lookup deterministik hale getirildi |

## 14. Kalan Açık Noktalar
| Kod | Açık Nokta | Etki | Hedef Faz / Fix |
|-----|------------|------|-----------------|
| MC-UI-01 | Full maker-checker queue/assignment/approval UI yok | Foundation guard var; production workflow readiness sınırlı | PHASE-06 closure sonrası workflow fazı |
| OH-01 | Media/store-story moderation owner handoff BFF decision path’e eklenmedi | Mevcut handoff post/review/ugc/Q&A ile sınırlı | İlgili domain owner handoff genişletmesi |

## 15. PHASE-06’ya Etki
Moderation decision readiness:
- CLOSED WITH LIMITATION

Audit/evidence readiness:
- CLOSED

Maker-checker readiness:
- CLOSED WITH LIMITATION

Risk/abuse boundary:
- CLOSED

## 16. Nihai Karar
PHASE-06-FIX-04 Kararı:
- PASS WITH LIMITATION

Karar kriteri:
- Decision actor/reason/evidence zorunlu.
- Audit/evidence recorded.
- Same actor maker/checker blocked.
- Risk signal decision yerine geçmiyor.
- BFF visibility truth mutate etmiyor.
- Typecheck/build PASS.
- Targeted smoke PASS.
- Limitation: full maker-checker production workflow/UI ve media/store-story handoff genişletmesi sonraki faza bırakıldı.

## 17. Sonraki Adım
PHASE-06 closure readiness değerlendirilebilir.
