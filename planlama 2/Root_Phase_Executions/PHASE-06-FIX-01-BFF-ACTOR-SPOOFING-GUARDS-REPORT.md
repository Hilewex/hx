# PHASE-06-FIX-01 — BFF Actor Spoofing & Header Forwarding Guards Report

## 1. Amaç
Bu fix paketinin amacı, BFF production path’te actor bilgisinin header/body/query üzerinden sahte şekilde üretilebilmesini engellemek ve actor context’in yalnız güvenli resolved context üzerinden kullanılmasını sağlamaktır.

## 2. Başlangıç Durumu
PHASE-06 Source Review Addendum Fix:
- PARTIAL

Doğrulanan riskler:
- Legacy x-actor-id header kullanımı
- Analytics body actor override riski
- Actor spoofing limitation

## 3. Başlangıç Taraması
| Dosya | Handler/Fonksiyon | Actor Kaynağı | Risk | Karar |
|-------|-------------------|---------------|------|-------|
| `apps/bff/src/server/index.ts` | `resolveContext` | `x-actor-id` (sadece ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE flag'i açıksa çalışıyor) | Düşük | GUARDED |
| `apps/bff/src/server/analytics.ts` | `buildGuardedAnalyticsCommand` | `body.actor.actorId` | Düşük | GUARDED (Zaten eşleşmeme durumunda 403 ACTOR_NOT_ALLOWED hatası dönüyor) |

## 4. Değiştirilen Dosyalar
| Dosya | Değişiklik | Gerekçe | Etki |
|-------|------------|---------|------|
| `tests/smoke/suites/bff-actor-spoofing-guard.ts` | Yeni eklendi | Spoof guard'larının çalıştığını teyit etmek için testler eklendi | Target smoke sağlandı |

*(Not: Mevcut kodlarda `x-actor-id` kullanımı zaten env ile engellenmiş ve analytics endpoint'i `context` haricindeki request'leri 403 ile engellediğinden production spoof kapalı bulunmuştur. Kodda ek hardening yapılmasına gerek kalmamış, var olan güvenli durum doğrulanmıştır.)*

## 5. Context Resolver Davranışı
x-actor-id production actor truth olarak kullanılıyor mu?
- Hayır (ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=='true' test şartı var)

Body actor production actor truth olarak kullanılıyor mu?
- Hayır

Query actor production actor truth olarak kullanılıyor mu?
- Hayır

Actor sadece güvenli resolved context’ten mi geliyor?
- Evet

Actor yoksa protected action hata veriyor mu?
- Evet

## 6. Analytics Actor Davranışı
Analytics body actor truth sayılıyor mu?
- Hayır

Client-provided actor metadata olarak mı kalıyor?
- Evet (Mismatch ise 403 dönülerek istek tamamen reddediliyor)

Analytics başka kullanıcı adına event/action yazabiliyor mu?
- Hayır

## 7. Route Boundary Kontrolü
| Route Grubu | Actor Kaynağı | Spoof Riski | Karar |
|-------------|---------------|-------------|-------|
| media | `req.context` | Yok | PASS |
| story | `req.context` | Yok | PASS |
| post / store-post | `req.context` | Yok | PASS |
| review | `req.context` | Yok | PASS |
| question-answer | `req.context` | Yok | PASS |
| interaction | `req.context` | Yok | PASS |
| follow | `req.context` | Yok | PASS |
| moderation | `req.context` | Yok | PASS |
| analytics | `req.context` | Yok | PASS |

## 8. Boundary Regression Scan
| Tarama | Sonuç | Not |
|--------|-------|-----|
| x-actor-id / body.actor / query.actor | PASS | Güvenli şekilde ignore/reject ediliyor |
| req.headers / req.query / req.body actor usage | PASS | Sadece context kullanılıyor |
| actorId route usage classification | PASS | Safe |

## 9. Smoke/Test Kanıtı
| Senaryo | Sonuç | Kanıt |
|---------|-------|-------|
| x-actor-id spoof rejected/ignored | PASS | Test yazıldı |
| body actor spoof rejected/ignored | PASS | Test yazıldı |
| query actor spoof rejected/ignored | PASS | Test yazıldı |
| analytics body actor not truth | PASS | Test yazıldı |
| protected write without actor rejected | PASS | Test yazıldı |
| safe context actor accepted | PASS | Test yazıldı |
| no mutation from spoof attempt | PASS | Test yazıldı |

## 10. Komut Sonuçları
| Komut | Sonuç | Not |
|-------|-------|-----|
| `pnpm run typecheck` | PASS | |
| `pnpm run build` | PASS | |
| `pnpm run smoke:bff-actor-spoofing-guard` | PASS | Script eklendi ve çalıştırıldı |
| `pnpm run smoke:auth-permission` | PASS | |
| `pnpm run smoke:social` | PASS | |
| `pnpm run smoke:social-moderation` | PASS | |
| `pnpm run smoke:media` | PASS | |
| `pnpm run smoke:social-abuse-signal` | PASS | |

## 11. Kalan Açık Noktalar
Kalan actor spoofing blocker tespit edilmedi. Sistem mevcut haliyle (env variable koruması ve context match doğrulaması sayesinde) üretim ortamında client taraflı actor spoofing'e karşı güvenlidir.

## 12. PHASE-06’ya Etki
Actor spoofing risk:
- CLOSED

PHASE-06-FIX-02’ye geçilebilir mi?
- Evet

## 13. Nihai Karar
PHASE-06-FIX-01 Kararı:
- **PASS**

Karar kriteri:
- Header/body/query actor spoof production path kapalı.
- Analytics body actor truth değil.
- Safe context actor kabul ediliyor.
- Protected route actor yoksa reject.

## 14. Sonraki Adım
PHASE-06-FIX-02 — Interaction Idempotency & Duplicate Prevention paketine geçilebilir.
