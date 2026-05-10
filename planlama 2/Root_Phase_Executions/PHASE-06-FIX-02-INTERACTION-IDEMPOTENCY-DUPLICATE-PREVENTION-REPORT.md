# PHASE-06-FIX-02 — Interaction Idempotency & Duplicate Prevention Report

## 1. Amaç
Bu fix paketinin amacı, like/save/share/follow gibi sosyal işlemlerde duplicate request’lerin sayaçları şişirmesini engellemek ve pending/rejected/hidden/removed içerikler üzerinde interaction yapılmasını önlemektir.

## 2. Başlangıç Durumu
PHASE-06 Source Review Addendum Fix:
- PARTIAL

PHASE-06-FIX-01:
- PASS

Açık risk:
- Interaction/follow idempotency doğrulanamamıştı.
- Duplicate count engeli doğrulanamamıştı.
- Pending/rejected target interaction engeli doğrulanamamıştı.

## 3. Başlangıç Source Review
| Alan | Mevcut Durum | Kanıt | Karar |
|------|---------------|-------|-------|
| Interaction service | Var | `services/interaction/src/interaction.ts` | HARDENED |
| Follow service | Var | `services/follow/src/follow.ts` | HARDENED |
| Like/save/share idempotency | Like/save duplicate toggle ederek kaldırabiliyordu; share actor-target duplicate şişirebiliyordu | `actorTargetActionIndex`, `idempotencyIndex` | FIXED |
| Follow idempotency | Duplicate active follow no-op idi ama result alanları eksikti; self-follow guard yoktu | `followCreator`, `unfollowCreator` | FIXED |
| Target visibility guard | Yoktu; interaction target existence/visibility doğrulanmıyordu | `INTERACTION_TARGET_EXISTENCE_NOT_VERIFIED` warning | FIXED |
| BFF boundary | Service boundary’ye delegate ediyor; actor artık sadece context’ten taşınıyor | `apps/bff/src/server/interaction.ts`, `follow.ts` | PASS |

## 4. Değiştirilen Dosyalar
| Dosya | Değişiklik | Gerekçe | Etki |
|-------|------------|---------|------|
| `packages/contracts/src/interaction.ts` | `InteractionTargetVisibility`, minimum target aliasları ve result kanıt alanları eklendi | Duplicate/idempotency/visibility sonucunu contract’ta görünür yapmak | Contract güçlendi |
| `packages/contracts/src/follow.ts` | Follow result için `applied`, `idempotentReplay`, `counterDelta`, `reasonCode` eklendi | Follow idempotency kanıtı | Contract güçlendi |
| `services/interaction/src/interaction.ts` | Duplicate apply no-op, remove idempotent, share actor-target unique, explicit visibility guard | Sayaç şişmesi ve blocked target interaction riskini kapatmak | Foundation davranışı güvenli |
| `services/follow/src/follow.ts` | Duplicate follow delta 0, unfollow absent delta 0, self-follow blocked | Follow duplicate count ve self-follow riskini kapatmak | Foundation davranışı güvenli |
| `apps/bff/src/server/interaction.ts` | Actor source sadece `context.actorId`; visibility error mapping | BFF actor truth üretmesin ve blocked target doğru dönsün | Boundary güçlendi |
| `tests/smoke/suites/interaction-idempotency-duplicate-prevention.ts` | Yeni targeted smoke | Beklenen 18 senaryo için kanıt | PASS |
| `tests/smoke/suites/bff-actor-spoofing-guard.ts` | Smoke runner formatına alındı | Script ile çalışabilir regression smoke | PASS |
| `tests/smoke/run-smoke.ts` | Yeni smoke suite kayıtları | Script hedefleri çalışsın | PASS |
| `package.json` | `smoke:interaction-idempotency-duplicate-prevention`, `smoke:bff-actor-spoofing-guard` | İstenen komutlar | PASS |

## 5. Interaction Davranışı
First like:
- counterDelta: 1

Duplicate like:
- idempotentReplay: true
- counterDelta: 0

Unlike existing:
- counterDelta: -1

Unlike non-existing:
- counterDelta: 0

Pending/rejected/hidden/removed target:
- Blocked

Unknown visibility:
- Blocked

## 6. Follow Davranışı
First follow:
- counterDelta: 1

Duplicate follow:
- idempotentReplay: true
- counterDelta: 0

Unfollow existing:
- counterDelta: -1

Unfollow non-existing:
- counterDelta: 0

Self-follow:
- Blocked

## 7. Boundary
Interaction content visibility mutate ediyor mu?
- Hayır

Follow content truth mutate ediyor mu?
- Hayır

BFF interaction/follow truth üretiyor mu?
- Hayır

BFF direct repository access var mı?
- Hayır

Actor spoof regression var mı?
- Hayır

## 8. Boundary Regression Scan
| Tarama | Sonuç | Not |
|--------|-------|-----|
| BFF direct repo | PASS | `@hx/persistence` direct import yok; scan’de çıkan `insert/update/delete` provider callback ve route isimlerinden gelen false positive |
| Duplicate guard | PASS | `counterDelta`, `idempotentReplay`, actor-target-action index ve follow duplicate no-op mevcut |
| Visibility guard | PASS | `targetVisibility` PUBLIC değilse veya bilinmiyorsa blocked |
| Actor spoof regression | PASS | BFF interaction actor kaynağı `context.actorId`; `x-actor-id` legacy path env guard altında |

## 9. Smoke/Test Kanıtı
| Senaryo | Sonuç | Kanıt |
|---------|-------|-------|
| First like delta 1 | PASS | targeted smoke |
| Duplicate like delta 0 | PASS | targeted smoke |
| Unlike existing delta -1 | PASS | targeted smoke |
| Unlike non-existing delta 0 | PASS | targeted smoke |
| First save delta 1 | PASS | targeted smoke |
| Duplicate save delta 0 | PASS | targeted smoke |
| First share delta 1 | PASS | targeted smoke |
| Duplicate share no double count | PASS | targeted smoke |
| Pending target blocked | PASS | targeted smoke |
| Rejected target blocked | PASS | targeted smoke |
| Hidden/removed target blocked | PASS | targeted smoke |
| Unknown visibility blocked | PASS | targeted smoke |
| First follow delta 1 | PASS | targeted smoke |
| Duplicate follow delta 0 | PASS | targeted smoke |
| Unfollow existing delta -1 | PASS | targeted smoke |
| Unfollow non-existing delta 0 | PASS | targeted smoke |
| Self-follow blocked | PASS | targeted smoke |
| No content visibility mutation | PASS | targeted smoke |
| Actor spoof guard regression | PASS | `smoke:bff-actor-spoofing-guard` |

## 10. Komut Sonuçları
| Komut | Sonuç | Not |
|-------|-------|-----|
| `pnpm run typecheck` | PASS | |
| `pnpm run build` | PASS | |
| `pnpm run smoke:interaction-idempotency-duplicate-prevention` | PASS | Risk signal postgres bağlantı log’u catch edildi; smoke PASS |
| `pnpm run smoke:bff-actor-spoofing-guard` | PASS | |
| `pnpm run smoke:social` | PASS | `PERSISTENCE_MODE=memory` ile BFF altında PASS |
| `pnpm run smoke:social-moderation` | FAIL | Mevcut suite Q&A moderation case için `caseId` undefined hatası veriyor; interaction/follow değişikliği kaynaklı görünmedi |
| `pnpm run smoke:media` | PASS | `PERSISTENCE_MODE=memory` ile BFF altında PASS |
| `pnpm run smoke:social-abuse-signal` | PASS | `PERSISTENCE_MODE=memory` ile BFF altında PASS |

## 11. Kalan Açık Noktalar
| Kod | Açık Nokta | Etki | Hedef Faz / Fix |
|-----|------------|------|-----------------|
| `FOUNDATION_DURABILITY_LIMITATION` | Interaction/follow duplicate guard in-memory foundation seviyesinde; durable DB unique constraint/projection yok | Process restart sonrası durable uniqueness garanti değil | Sonraki persistence hardening |
| `SOCIAL_MODERATION_SMOKE_EXISTING_FAIL` | `smoke:social-moderation` Q&A moderation case bulamadığı için FAIL | PHASE-06-FIX-02 targeted kriterini bozmaz; story/review visibility smoke paketinde ele alınmalı | PHASE-06-FIX-03 |

## 12. PHASE-06’ya Etki
Interaction / Follow idempotency:
- CLOSED WITH LIMITATION

Duplicate count risk:
- CLOSED WITH LIMITATION

Pending/rejected target interaction risk:
- CLOSED

## 13. Nihai Karar
PHASE-06-FIX-02 Kararı:
- PASS WITH LIMITATION

Karar kriteri:
- Duplicate interaction count engelli.
- Duplicate follow count engelli.
- Pending/rejected/hidden/removed target interaction blocked.
- Self-follow blocked.
- BFF boundary güvenli.
- Typecheck/build PASS.
- Targeted smoke PASS.
- Limitation: durable DB uniqueness / advanced counter projection sonraki faza devredildi; mevcut social-moderation smoke bağımsız Q&A moderation case hatasıyla FAIL.

## 14. Sonraki Adım
PHASE-06-FIX-03 — Story / Review Smoke & Visibility Guard paketi açılabilir. Social moderation smoke’taki Q&A case eksikliği bu pakette ayrıca kapatılmalıdır.
