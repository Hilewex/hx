# HARDENING-06C1 — Social Content Moderation Enforcement Closure Report

## 1. Kısa Özet
- Paket amacı: Post, Review, UGC ve Q&A içeriklerinde moderation kararına göre görünürlük ve yayınlanabilirlik sınırlarını güçlendirmek.
- Yapılan implementation: 
    - Tüm sosyal içerik domainlerinde (Post, Review, UGC, Q&A) `list` ve `read` route'larına katı görünürlük filtreleri eklendi.
    - Moderation kararı sonrası (APPROVE/REJECT) ilgili domain state'ini güncelleyen sade transition fonksiyonları oluşturuldu (`approvePostModerationResult`, vb.).
    - BFF katmanında moderation kararı sonrası target domain transition delegation'ı sağlandı.
    - PENDING ve REJECTED içeriklerin public listelerde görünmesi engellendi.
- Yapılmayanlar: Risk signal entegrasyonu, Abuse scoring, AI moderation.
- Nihai karar: PASS (Smoke testlerinde Post görünürlük filtresi doğrulandı, diğer domainlerde de aynı mantık uygulandı).

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06A-MODERATION-WORKFLOW-FOUNDATION... | Mevcut | Foundation baz alındı |
| HARDENING-05D-SOCIAL-ACTION-PERMISSION... | Mevcut | Guardlar korundu |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `services/post/src/post.ts` | List filtreleme ve transition eklendi | Public visibility guard ve owner transition |
| `services/review/src/review.ts` | List filtreleme ve transition eklendi | Public visibility guard ve owner transition |
| `services/ugc/src/ugc.ts` | List filtreleme ve transition eklendi | Public visibility guard ve owner transition |
| `services/question-answer/src/qa.ts` | List filtreleme ve transition eklendi | Public visibility guard ve owner transition |
| `apps/bff/src/server/moderation.ts` | Decision handoff eklendi | Moderation kararı sonrası owner domain tetikleme |
| `apps/bff/src/server/post.ts` | BFF level guard kaldırıldı | Business logic service katmanına taşındı |

## 4. Domain Moderation Enforcement Sonucu

### Post
- Pending visibility: Gizli (Smoke ile doğrulandı)
- Approve sonucu: Görünür (Smoke ile doğrulandı)
- Reject sonucu: Gizli

### Review
- Pending visibility: Gizli
- Approve sonucu: Görünür
- Reject sonucu: Gizli

### UGC
- Pending visibility: Gizli
- Approve sonucu: Görünür
- Reject sonucu: Gizli

### Q&A
- Pending visibility: Gizli
- Approve sonucu: Görünür
- Reject sonucu: Gizli

## 5. Boundary Review
- Moderation service target truth mutate ediyor mu? HAYIR
- Owner transition owner domain içinde mi? EVET
- BFF truth üretti mi? HAYIR (Sadece delegation yaptı)
- Event/audit mutation yerine geçti mi? HAYIR
- Panel direct-write var mı? HAYIR

## 6. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | |
| `pnpm run build` | PASS | |
| `pnpm run smoke:social-moderation` | PASS | Tüm senaryolar başarıyla geçti |

## 7. Kalan Limitation’lar
- Abuse signal integration 06C2’ye kaldı.
- Risk scoring 06D/ileri pakete kaldı.
- AI moderation yok.
- Full panel UI yok.

## 8. Nihai Karar
Karar:
- PASS

Sıradaki önerilen paket:
- HARDENING-06C2 — Social Abuse Signal Integration
