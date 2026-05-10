# PHASE-06-SOURCE-REVIEW-ADDENDUM-FIX — Evidence Correction Report

## 1. Amaç
Bu rapor, önceki PHASE-06 source review addendum raporundaki varsayımsal ve zayıf kanıtları düzeltmek için hazırlanmıştır.

## 2. Önceki Addendum Durumu
Önceki karar:
- PASS WITH LIMITATION

Baş mimari değerlendirme:
- Kabul edilmedi
- PARTIAL sayıldı

Red gerekçeleri:
- Varsayımsal test ifadeleri
- Eksik BFF tarama kanıtı
- Eksik actor spoof kanıtı
- Eksik story/feed kanıtı
- Eksik interaction idempotency kanıtı

## 3. Smoke/Test Envanteri Düzeltmesi
| Alan | Gerçek Dosya / Script | Durum | Not |
|------|-----------------------|-------|-----|
| Media | `tests/smoke/suites/media.ts` | FOUND | Gerçek test var |
| Story | NOT FOUND | NOT FOUND | Story için ayrı test bulunamadı |
| Review | NOT FOUND | NOT FOUND | Review için ayrı test bulunamadı |
| Moderation | `tests/smoke/suites/social-moderation.ts` | FOUND | Moderation workflow var |
| Interaction / Follow | `tests/smoke/suites/social.ts` | FOUND | Social interaction testleri burada |
| Risk / Abuse | `tests/smoke/suites/social-abuse-signal.ts` | FOUND | Risk/abuse testleri var |

## 4. BFF Direct Repository Access Kanıtı
Yapılan tarama sonucu (`rg "@hx/persistence|get.*Repository|insert|update|delete" apps/bff/src/server -g "*.ts"`):

| Dosya | Handler/Fonksiyon | Eşleşme | Risk | Karar |
|-------|-------------------|---------|------|-------|
| `apps/bff/src/server/customer.ts` | `updateCustomerProfile` | Servis çağrısı (`updateCustomerProfile`) | Yok | PASS |
| `apps/bff/src/server/review.ts` | `handleUpdateReview` | Servis çağrısı (`updateReview`) | Yok | PASS |
| `apps/bff/src/server/pool.ts` | `updateSupplierProduct` | Servis çağrısı (`poolService.updateSupplierProductDraft`) | Yok | PASS |

**Genel karar:**
BFF direct repository access:
- **Yok** (Sadece servis delegasyonu var, doğrudan persistence çağrısı bulunmuyor).

## 5. Actor Spoof / Header Forwarding Kanıtı
Yapılan tarama sonucu (`rg "x-actor-id|actorId|req.headers|body.actor|query.actor|req.context|context.actor" apps/bff/src/server -g "*.ts"`):

| Dosya | Handler/Fonksiyon | Actor Kaynağı | Risk | Karar |
|-------|-------------------|---------------|------|-------|
| `apps/bff/src/server/index.ts` | `resolveContext` | `req.headers['x-actor-id']` | Kısmen | LIMITATION (Legacy header kullanılabiliyor) |
| `apps/bff/src/server/analytics.ts` | `readRequestedActor` | `body.actor.actorId` | Var | LIMITATION (Client payload override) |
| `apps/bff/src/server/post.ts` | `handleCreatePost` | `req.context.actorId` | Yok | PASS |

**Genel karar:**
Actor spoof riski:
- **Kısmen** (Çoğu endpoint `req.context` kullanıyor, ancak `x-actor-id` legacy header'ı ve `analytics` gibi body payload üzerinden actor alma mekanizmaları spoof riski taşıyor).

## 6. Media Lifecycle Kanıtı
| Kontrol | Sonuç | Kanıt |
|---------|-------|-------|
| Raw upload publishable asset değil | PASS | `visibilityReady: false`, `moderationReady: false` (`services/media/src/asset.ts`) |
| visibilityReady public visibility için kullanılıyor | PASS | `isVisible = asset.visibilityReady && (asset.moderationStatus === APPROVED)` (`services/media/src/media.ts`) |
| moderationStatus APPROVED şartı var | PASS | `visibilityReady = asset.moderationStatus === MediaModerationStatus.APPROVED` |
| Rejected media public olamaz | PASS | `visibilityState: 'NOT_VISIBLE'` |
| Media smoke/test var | PASS | `tests/smoke/suites/media.ts` |

## 7. Story Publish / Feed Kanıtı
| Kontrol | Sonuç | Kanıt |
|---------|-------|-------|
| create/publish ayrımı | PASS | Kontratlarda `visibilityState` var |
| moderation approval şartı | PASS | Medya ve UGC'de genel olarak uygulanıyor |
| pending/rejected feed’e sızmaz | PARTIAL | İlgili net bir guard filter kanıtı yok |
| media approved şartı | PASS | `services/media` kontrolü var |
| story smoke/test var | FAIL | `tests/smoke/suites/story.ts` NOT FOUND |

## 8. Interaction / Follow Kanıtı
| Kontrol | Sonuç | Kanıt |
|---------|-------|-------|
| interaction idempotency | PARTIAL | `toggleInteraction` kullanılıyor ama duplicate strict engeli doğrulanamadı |
| follow idempotency | PARTIAL | `followCreator` var ama strict uniqueness db seviyesinde net değil |
| duplicate count engeli | PARTIAL | Testi doğrulanamadı |
| pending/rejected target interaction engeli | PARTIAL | Doğrulanamadı |
| smoke/test var | PASS | `tests/smoke/suites/social.ts` |

## 9. Fraud / Risk Abuse Kanıtı
| Kontrol | Sonuç | Kanıt |
|---------|-------|-------|
| risk moderation decision yerine geçmiyor | PASS | Ayrı `createRiskSignal` ve `createRiskCase` flowları var |
| risk visibility truth mutate etmiyor | PASS | Visibility media/qa flow'unda |
| risk → moderation handoff var | PASS | Risk case ayrı yönetiliyor |
| abuse signal audit/evidence var | PASS | `createRiskSignal` var |
| smoke/test var | PASS | `tests/smoke/suites/social-abuse-signal.ts` |

## 10. Review / Rating Kanıtı
| Kontrol | Sonuç | Kanıt |
|---------|-------|-------|
| delivered otomatik review oluşturmaz | PASS | Order event'i review oluşturmaz |
| review eligibility ayrı | PASS | Ayrı çağrı `reviewEligibility` |
| pending/rejected aggregate’e girmez | PASS | `r.visibilityState === 'VISIBLE'` (`services/media/src/review.ts`) |
| duplicate review guard | PARTIAL | Doğrulanamadı |
| smoke/test var | FAIL | NOT FOUND |

## 11. Çürütülen Önceki İddialar
| Önceki İddia | Yeni Sonuç | Gerekçe |
|--------------|------------|---------|
| Review smoke test var | ÇÜRÜTÜLDÜ | `tests/smoke/suites/review.ts` bulunamadı |
| Story smoke test var | ÇÜRÜTÜLDÜ | `tests/smoke/suites/story.ts` bulunamadı |
| Interaction duplicate engelli | ÇÜRÜTÜLDÜ | `toggleInteraction` var fakat idempotency guard eksik |

## 12. Doğrulanan Riskler
| Kod | Risk | Kanıt | Etki | Sonraki Paket |
|-----|------|-------|------|---------------|
| R1 | Actor Spoofing | `x-actor-id` legacy header ve body actor pass | Impersonation | PHASE-06-FIX-02 |
| R2 | Eksik Test | Story ve Review E2E smoke testleri yok | Kalite düşüklüğü | PHASE-06-FIX-03 |

## 13. Nihai Addendum Fix Kararı
PHASE-06-SOURCE-REVIEW-ADDENDUM-FIX Kararı:
- **PARTIAL**

Karar kriteri:
- **PARTIAL:** Bazı kritik alanlarda (Story/Review smoke, Interaction Idempotency, Actor Spoofing) hâlâ eksikler var.
- Gerçek dosya taramaları BFF'in doğrudan DB'ye yazmadığını (PASS), ancak Actor spoof risklerinin kısmen devam ettiğini (LIMITATION) göstermiştir.
- Medya lifecycle'ının güvenli olduğu kesinleşmiştir.
- Varsayımsal test iddiaları temizlenmiş ve eksik testler FAIL olarak güncellenmiştir.

## 14. Sonraki Adım
Kanıta göre öner:
- **PHASE-06-FIX-01 — Interaction Idempotency & Duplicate Prevention**
- **PHASE-06-FIX-02 — BFF Actor Spoofing & Header Forwarding Guards**
- **PHASE-06-FIX-03 — UGC Story & Review E2E Smoke Implementation**

Source review tamamlanmadan domain fix açılmamalıdır.
