# HARDENING-06C2 — Social Abuse Signal Integration Closure Report

## 1. Kısa Özet
- **Paket Amacı:** Review, Follow, Post, UGC ve Q&A alanlarında temel abuse signal üretimini Risk servisine bağlamak ve foundation seviyesinde abuse tespiti sağlamak.
- **Yapılan Implementation:**
    - Tüm sosyal domainlerde (Review, Follow, Post, UGC, Q&A) Risk servisi entegrasyonu tamamlandı.
    - `createInternalRiskSignal` kullanılarak standart sinyal üretimi sağlandı.
    - Duplicate review, repeated follow, spam-like content (Post/UGC/QA) ve limit aşımı (Edit limit, Follow limit) durumları için sinyaller eklendi.
    - 05D permission guard'larının aktifliği doğrulandı (Regression kontrolü yapıldı).
- **Yapılmayanlar:** Otomatik hesap bloklama, otomatik içerik reddi, AI tabanlı abuse tespiti bu paket kapsamında değildir.
- **Nihai Karar:** PASS

## 2. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `services/review/src/review.ts` | `REVIEW_EDIT_LIMIT_EXCEEDED_ATTEMPT` sinyali eklendi. | Edit limiti aşımı denemelerini izlemek. |
| `services/follow/src/follow.ts` | `FOLLOW_LIMIT_EXCEEDED_ATTEMPT` sinyali ve 100 takip limiti eklendi. | Anormal takip sayılarını yakalamak. |
| `services/post/src/post.ts` | `REPEATED_REJECTED_CONTENT_PATTERN` sinyali eklendi. | Sürekli reddedilen içerik giren creator'ları izlemek. |
| `services/ugc/src/ugc.ts` | `REPEATED_REJECTED_UGC_PATTERN` sinyali eklendi. | Sürekli reddedilen UGC giren kullanıcıları izlemek. |
| `services/question-answer/src/qa.ts` | `SPAM_LIKE_QUESTION` sinyali eklendi. | Soru-cevap alanındaki spam girişimlerini izlemek. |

## 3. Abuse Signal Sonuçları

### Review
- **Sinyal Durumu:** Duplicate review denemesi ve edit limiti aşımında oluşur.
- **Truth Mutate:** Hayır. Hata fırlatılır.
- **Risk reasonCode:** `DUPLICATE_REVIEW_ATTEMPT`, `REVIEW_EDIT_LIMIT_EXCEEDED_ATTEMPT`

### Follow
- **Sinyal Durumu:** Aktif takibi tekrar takip etme denemesi ve 100 takip limiti aşımında oluşur.
- **Truth Mutate:** Hayır.
- **Risk reasonCode:** `REPEATED_FOLLOW_ATTEMPT`, `FOLLOW_LIMIT_EXCEEDED_ATTEMPT`

### Post
- **Sinyal Durumu:** "Spam" içeren içeriklerde ve 3'ten fazla reddedilmiş postu olan creator'ların yeni denemelerinde oluşur.
- **Truth Mutate:** Hayır.
- **Risk reasonCode:** `SPAM_LIKE_CONTENT`, `REPEATED_REJECTED_CONTENT_PATTERN`

### UGC
- **Sinyal Durumu:** "Spam" içeren caption'larda ve 3'ten fazla reddedilmiş UGC'si olan kullanıcıların yeni denemelerinde oluşur.
- **Truth Mutate:** Hayır.
- **Risk reasonCode:** `SPAM_LIKE_CONTENT`, `REPEATED_REJECTED_UGC_PATTERN`

### Q&A
- **Sinyal Durumu:** Aynı soruyu tekrar sorma denemesinde ve "spam" içeren sorularda oluşur.
- **Truth Mutate:** Hayır.
- **Risk reasonCode:** `REPEATED_QUESTION_ATTEMPT`, `SPAM_LIKE_QUESTION`

## 4. Boundary Review
- **Risk social truth mutate ediyor mu?** Hayır. `targetTruthMutated=false` korunuyor.
- **Abuse signal permission yerine geçti mi?** Hayır. Permission guard'lar (05D) hala ilk bariyerdir.
- **Abuse signal eligibility yerine geçti mi?** Hayır. Veri bazlı uygunluk kuralları ayrı çalışır.
- **BFF truth üretti mi?** Hayır. BFF sadece istekleri ilgili servislere yönlendirir ve guard'ları çalıştırır.

## 5. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm run smoke:social-abuse-signal` | PASS | Tüm sosyal abuse senaryoları doğrulandı. |
| `pnpm run smoke:risk-signal` | PASS | Genel risk sinyal akışı doğrulandı. |
| `pnpm run smoke:social-permission` | PASS | 05D guard'larının hala aktif olduğu doğrulandı. |
| `pnpm run smoke:social-moderation` | PASS | Moderasyon akışının bozulmadığı doğrulandı. |
| `pnpm run typecheck` | PASS | Tip hatası yok. |
| `pnpm run build` | PASS | Build başarılı. |

## 6. Kalan Limitation’lar
- Foundation seviyesinde statik limitler kullanıldı (örn. Follow limit 100).
- AI abuse detection yok.
- Otomatik block/reject yok (Risk servisi sadece izler, aksiyon almaz).
- Commerce abuse (sepette fraud vb.) 06D paketine bırakıldı.

## 7. Nihai Karar
Karar: **PASS**

PASS şartları:
- [x] typecheck PASS
- [x] build PASS
- [x] smoke:social-abuse-signal PASS
- [x] Review/Follow/Post/UGC/Q&A için en az foundation signal üretimi var
- [x] Risk social truth mutate etmiyor
- [x] targetTruthMutated=false korunuyor

Sıradaki önerilen paket:
- **HARDENING-06D — Commerce Abuse / Fraud Guard Integration**
