# PHASE-06-START-CONTEXT — Next Phase Handoff Report

## 1. Amaç

Bu rapor, PHASE-06’ya geçmeden önce PHASE-05 kapanış durumunu, aktif limitation’ları, gerekli referans dosyalarını ve ilk güvenli adımı belirlemek için hazırlanmıştır.

## 2. Önceki Faz Durumu

```text
PHASE-01: PASS WITH LIMITATION
PHASE-02: PASS WITH LIMITATION
PHASE-03: PASS WITH LIMITATION
PHASE-04: PASS WITH LIMITATION
PHASE-05: PASS WITH LIMITATION
```

## 3. PHASE-05’ten Devreden Aktif Limitation’lar

| Kod | Limitation | Etki | Hedef |
| :--- | :--- | :--- | :--- |
| TOOL-01 | Root `pnpm run typecheck` FAIL-REPO (apps/web TS6059/TS6307) | Kodlamayı/build'i engeller, repo-level CI bozuk. | Kodlamaya geçilirse FIX-00 Tooling Recovery şart. |
| TOOL-02 | Root `pnpm run build` FAIL-REPO | Deploy/Bundle edilemez. | Kodlamaya geçilirse FIX-00 Tooling Recovery şart. |
| PER-01 | Ledger durable persistence yok | PHASE-06 social domain olduğu için blocker değil. | PHASE-06 dışı, devreden limitation olarak izle. |
| PER-02 | Settlement / coupon / reward durable persistence yok | PHASE-06 social domain olduğu için blocker değil. | PHASE-06 dışı, devreden limitation olarak izle. |
| PER-03 | Admin/category/coupon policy persistence yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| PER-04 | Refund coupon reversal durable persistence yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| PER-05 | Reward point durable persistence yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| INT-01 | Pool → settlement full runtime integration yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| INT-02 | Payout live provider execution yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| OTH-01 | Coupon advanced allocation engine yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| OTH-02 | Settlement adjustment materialization yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| OTH-03 | Approval / maker-checker / audit enforcement eksikleri var | Moderasyon phase'i olan PHASE-06 ile çakışabilir. | PHASE-06 review sırasında dikkate alınacak. |
| OTH-04 | Full wallet/redeem engine yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |
| OTH-05 | Advanced liability ledger yok | PHASE-06 için blocker değil. | Devreden limitation olarak izle. |

## 4. PHASE-06 Kapsam Tespiti

**PHASE-06 adı:** 
- Social / Content / Media / Moderation Readiness

**PHASE-06 kapsamı:**
- Hedihup platformunun sosyal-commerce, içerik, medya ve moderasyon hattını production-readiness seviyesine getirmek.
- Story, Video, Post/UGC, Review/Q&A, Interaction/Follow, Media ve Moderation sistemlerinin güvenli yayın hattını kapatmak.
- "Raw media upload ≠ publishable asset", "Delivered ≠ review/story written" gibi guard ve sınırların E2E doğrulamasını sağlamak.
- Sosyal abuse signal integration ve content visibility lifecycle.

**Kaynak:**
- `planlama 2/PHASE-06-SOCIAL-CONTENT-MEDIA-MODERATION-READINESS.md`

## 5. PHASE-06 İçin Gerekli Referans Dosyaları

| Dosya | Gerekçe | Durum |
| :--- | :--- | :--- |
| `5-story sistemi.md` | Story owner boundary ve lifecycle kuralları için | FOUND (Varsayılan sistem dosyası) |
| `6-video sistemi.md` | Video işleme ve asset rules için | FOUND |
| `21-post sistemi.md` | Post/UGC visibility ve yayın sınırları için | FOUND |
| `11-takip sistemi.md` | Follow relation ve interaction sınırları için | FOUND |
| `31-yorum puanlama sistemi.md` | Review eligibility ve rating aggregation rules için | FOUND |
| `32-soru cevap sistemi.md` | Q&A moderation rules ve PDP context için | FOUND |
| `33-beğen kaydet paylaş sistemi.md` | Interaction idempotency ve guardlar için | FOUND |
| `34-kullanıcı story sistemi.md` | Customer contribution eligibility rules için | FOUND |
| `50-medya asset sistemi.md` | Media upload, publish ve CDN stratejisi için | FOUND |
| `22-moderasyon sistemi.md` | Moderation pending/approval lifecycle ve public leak engeli için | FOUND |
| `49-fraud risk abuse sistemi.md` | Sosyal/Content bazlı risk sinyalleri için | FOUND |

*(Not: İlgili numaralı "sistemi.md" dosyaları ana bilgi bankasında yer alır. PHASE-06 boyunca review adımlarında detaylı incelenecektir.)*

## 6. PHASE-05 Limitation’larının PHASE-06 Etkisi

| Limitation | PHASE-06 Etkisi | Karar |
| :--- | :--- | :--- |
| **Root Typecheck / Build FAIL-REPO** | PHASE-06'nın kodlama (implementasyon/smoke) aşamasını bloke eder. Ancak "Source Review" aşamasını bloke etmez. | İlk aşamada (Source Review) blocker değil. Kodlama öncesi TOOLING-RECOVERY şart koşulmalıdır. |
| **Finance / Settlement Persistence Eksikliği** | Yok. Finansal veri katmanı Sosyal/Medya içerik katmanından bağımsızdır. | İzleme (Takip) statüsünde bırakılacak. |
| **Live Payout / Wallet Engine Eksikliği** | Yok. | İzleme (Takip) statüsünde bırakılacak. |
| **Maker-Checker / Audit Enforcement Eksikliği** | Kısmi. Moderasyon süreçlerinde approval akışlarını (decision) etkileyebilir. | PHASE-06 Review sırasında moderasyon domaininde maker-checker gereksinimi kontrol edilecek. |

## 7. İlk Önerilen Adım

**Önerilen ilk adım:**
- `PHASE-06-SOURCE-REVIEW`

**Gerekçe:**
PHASE-06 domainleri (Social, Content, Media, Moderation) finans/commerce domainlerinden tamamen ayrıdır. Repo içerisindeki story, video, post, yorum, medya ve moderasyon ile ilgili mevcut kaynak kodların durumunu görmek; public leak, boundary ihlalleri ve devreden limitation'ların seviyesini saptamak için kodlamadan önce mutlak suretle **Source Review** gereklidir. Şu an `apps/web` seviyesinde bir repo build hatası mevcut olduğu için direkt kodlamaya (FIX) geçmek tehlikelidir; öncelikle review yapıp, ardından `PHASE-06-FIX-00-TOOLING-BUILD-RECOVERY` ve sonrasında domain fix'lerine geçmek en güvenli adımdır.

## 8. PHASE-06 Başlangıç Kararı

**PHASE-06 başlangıç kararı:**
- **GO TO SOURCE REVIEW**

## 9. Sonraki Prompt İçin Hazırlık

PHASE-06’nın doğrulanmış kapsamına göre sıradaki Roo Code promptunda istenecekler:

1. **Okunacak Sistem Dosyaları:** `5-story`, `6-video`, `21-post`, `31-yorum puanlama`, `50-medya asset`, `22-moderasyon`, `49-fraud risk` sistem dosyaları önden belleğe alınmalı.
2. **Source Review Alanları:** `services/moderation`, `services/media`, `services/story`, `services/post`, `services/review`, `apps/bff` içindeki media/content route'ları.
3. **Boundary Kontrolü:** "Raw media upload ≠ publishable asset" ve "Delivered ≠ review/story written" boundary kurallarının codebase içinde enforce edilip edilmediğinin analizi.
4. **Smoke/Test Gereksinimleri:** Domain bazlı (media, story, post, moderation, review) smoke testlerin mevcut durumunun raporlanması.
5. **Kapanış Kriterleri:** Public surface'a pending/rejected content sızmadığının kanıtlanması; review sonuçlarına göre FIX paketlerinin (Önce Tooling Recovery olmak üzere) listelenmesi.
