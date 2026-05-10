# PHASE-06-SOCIAL-CONTENT-MEDIA-MODERATION-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunun sosyal-commerce, içerik, medya ve moderasyon hattını production-readiness seviyesine getirmektir.

Bu fazın ana kapsamı:

```text
Story → Video → Post/UGC → Review/Q&A → Interaction/Follow → Media → Moderation
```

Bu fazın ana hedefi:

```text
Sosyal içerikler, ürün/ticaret bağlamıyla uyumlu; eligibility, media lifecycle, moderation ve abuse guard’larıyla güvenli şekilde yayına hazır hale getirilmelidir.
```

Kritik ayrımlar:

```text
Delivered ≠ review/story written
Raw media upload ≠ publishable asset
Moderation approved ≠ commercial active
Social interaction ≠ purchase eligibility
Event emitted ≠ owner state mutated
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- story sistemi
- video sistemi
- kullanıcı story sistemi
- post / UGC sistemi
- takip sistemi
- beğen / kaydet / paylaş interaction sistemi
- yorum / puanlama sistemi
- soru-cevap sistemi
- medya / asset sistemi
- moderasyon sistemi
- sosyal abuse signal integration
- content visibility / publication lifecycle
- media processing / derivative / CDN readiness
- delivered ürün eligibility etkileri
- creator store sosyal içerik yüzeyleri

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- ranking/recommendation production scoring
- search/indexing production ops
- checkout/payment/order implementation
- finance/settlement/payout implementation
- full frontend visual polish
- full admin/creator/supplier panel polish
- production deployment gate

Bu faz sosyal/content domain correctness ve güvenli yayın hattını kapatır. Ekran çizimleri ve tam yüzey UX PHASE-10’da ele alınacaktır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `5-story sistemi.md`
2. `6-video sistemi.md`
3. `21-post sistemi.md`
4. `11-takip sistemi.md`
5. `31-yorum puanlama sistemi.md`
6. `32-soru cevap sistemi.md`
7. `33-beğen kaydet paylaş sistemi.md`
8. `34-kullanıcı story sistemi.md`
9. `50-medya asset sistemi.md`
10. `22-moderasyon sistemi.md`
11. `2-fenomen mağaza sistemi.md`
12. `3-kullanıcı müşteri sistemi.md`
13. `49-fraud risk abuse sistemi.md`
14. `48-arka plan analitik ölçümleme sistemi.md`
15. `25-kural -yetki sistemi.md`
16. `OWNER_MATRIX.md`
17. `GUARD_MATRIX.md`
18. `PERMISSION_MATRIX.md`
19. `TRANSITION_POLICIES.md`
20. `CRITICAL_JOURNEY_CHECKLIST.md`
21. `ACCEPTANCE_CRITERIA_PACK.md`
22. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Post / UGC Foundation

Kayıtlara göre:

- P21 — Post / UGC Foundation — PASS
- P21 Source Review Fix — BFF Media Package Boundary — PASS

Bu kayıt post/UGC foundation’ın kurulduğunu gösterir.

### 6.2 Review / Rating Foundation

- P22 — Review / Rating Foundation — PASS
- P22 Source Review Fix — BFF Actor Handling — PASS

Bu kayıt review/rating foundation ve actor handling düzeltmesi olduğunu gösterir.

### 6.3 Q&A Foundation

- P23 — Q&A Foundation — PASS

Bu kayıt Q&A foundation olduğunu gösterir.

### 6.4 Interaction Foundation

- P24 — Interaction Foundation — PASS
- P24 Source Review Fix — Service Guards & BFF Handler — PASS

Bu kayıt interaction action guardlarının güçlendirildiğini gösterir.

### 6.5 Follow Feed Foundation

- P25 — Follow Feed Foundation — PASS

Bu kayıt takip/feed foundation olduğunu gösterir.

### 6.6 Story / Media / Moderation Foundation

- P29 — Story Foundation — PASS
- P30 — Media / Asset Foundation — PASS
- P31 — Moderation Foundation — PASS

Bu kayıt story, media ve moderation foundation olduğunu gösterir.

### 6.7 HARDENING-04 Media Runtime

HARDENING-04 hattı medya runtime ve stub remediation çalışmaları yapmıştır.

### 6.8 HARDENING-06 Moderation / Risk / Abuse

HARDENING-06 hattında:

- moderation workflow foundation hardening
- risk signal core guard
- social content moderation enforcement
- social abuse signal integration
- commerce abuse/fraud observation
- moderation/risk/abuse smoke regression

çalışılmıştır.

### 6.9 PX Domain Kayıtları

PX kayıtlarına göre:

- PX-FENOMEN-05 — Store Post / Follow Feed Foundation — PASS
- PX-KULLANICI-04 — Customer Contribution Eligibility — PASS

Bu kayıtlar creator store post/follow ve customer contribution eligibility açısından önemlidir.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Full moderation panel UI yok
2. AI moderation yok
3. Runtime moderation idempotency production-readiness borcu
4. Distributed rate limit yok
5. Real media storage / CDN / transcoding / derivative pipeline yok
6. Raw media upload ile publishable asset ayrımı production seviyesinde doğrulanmalı
7. Review/story eligibility delivered-line bazında E2E doğrulanmalı
8. Return/refund sonrası review/story/point etkileri doğrulanmalı
9. Social abuse signals advisory seviyeden production policy’ye bağlanmalı
10. Creator store post/story/media yönetimi production panel ile bağlıdır
11. Frontend social surfaces PHASE-10’da doğrulanmalı
12. Ranking/feed ordering PHASE-07’ye bağlıdır

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Story Lifecycle Readiness

Kontrol edilecek:

- Story owner truth nerede?
- Fenomen story, mağaza story ve kullanıcı ürün story ayrımları net mi?
- Story draft / pending / approved / rejected / published / archived state’leri var mı?
- Story visibility moderation ile uyumlu mu?
- Story product tag binding doğru mu?
- Story expired / archived behavior net mi?
- Story analytics event truth gibi kullanılmıyor mu?

Beklenen sonuç:

```text
Story görünürlüğü owner state + moderation-safe publication ile belirlenir.
```

---

### 8.2 User Product Story Eligibility

Kontrol edilecek:

- Kullanıcı story hakkı delivered order line ile mi açılıyor?
- Product tag zorunlu mu?
- Kullanıcı aynı ürün için kaç story oluşturabilir?
- Return/refund sonrası story eligibility ne olur?
- Moderation reject story görünürlüğünü kapatıyor mu?
- UI veya BFF story eligibility truth üretiyor mu?

Beklenen sonuç:

```text
Delivered ≠ story written.
Delivered yalnız story eligibility açabilir.
```

---

### 8.3 Video / Media Asset Lifecycle

Kontrol edilecek:

- Raw upload hangi state’e düşüyor?
- Upload tamamlandıktan sonra asset publishable oluyor mu, olmamalı mı?
- Thumbnail / derivative / transcoding stratejisi var mı?
- Video duration / size / format policy var mı?
- Object storage / CDN strategy net mi?
- Broken media public yüzeye çıkıyor mu?
- Media security scan veya policy gate var mı?

Beklenen sonuç:

```text
Raw media upload ≠ publishable asset.
```

---

### 8.4 Post / UGC Readiness

Kontrol edilecek:

- Creator store post owner boundary
- Post draft/pending/published/rejected/archived lifecycle
- Post product/store binding
- Post visibility moderation-safe mi?
- Post follow feed’e nasıl giriyor?
- Post interaction counters truth mu projection mı?
- Post media asset publishable state’e bağlı mı?

Beklenen sonuç:

```text
Post public yüzeye yalnız moderation-safe ve media-ready durumda çıkar.
```

---

### 8.5 Follow / Feed Readiness

Kontrol edilecek:

- Follow relation owner boundary
- Guest follow yapabilir mi, yapmamalı mı?
- Followed creator feed nasıl üretiliyor?
- Follow relation feed ranking truth üretir mi?
- Follow action abuse signal üretiyor mu?
- Suspended/restricted creator feed visibility nasıl?

Beklenen sonuç:

```text
Follow social truth’tur; ranking ve discovery truth değildir.
```

---

### 8.6 Interaction Readiness

Kontrol edilecek:

- Like/save/share action guardları
- Guest share istisnası varsa sınırı
- Duplicate like/save idempotency
- Unlike/remove interaction guardları
- Interaction counter projection truth mu?
- Abuse/risk signal üretimi
- Interaction analytics business truth gibi kullanılıyor mu?

Beklenen sonuç:

```text
Interaction truth sosyal owner alanında kalır; permission/eligibility üretmez.
```

---

### 8.7 Review / Rating Readiness

Kontrol edilecek:

- Review eligibility delivered order line’a bağlı mı?
- Verified purchase badge nasıl oluşuyor?
- Bir order line için duplicate review engeli var mı?
- Return/refund sonrası review durumu ne olur?
- Rating score aggregation projection mı?
- Moderation pending/rejected review public görünmüyor mu?
- Review abuse signal var mı?

Beklenen sonuç:

```text
Auth sahibi olmak review hakkı değildir.
Review eligibility delivered purchase ile açılır.
```

---

### 8.8 Q&A Readiness

Kontrol edilecek:

- Kullanıcı soru sorma permission/guard
- Ürün görünür/aktif değilse soru açılıyor mu?
- Supplier answer draft mı?
- Platform/admin approval gerekiyor mu?
- Q&A PDP ortak product context’te mi görünür?
- Moderation visibility nasıl?
- Q&A support ticket veya store message ile karışıyor mu?

Beklenen sonuç:

```text
Q&A ürün bazlıdır; destek ticket veya mağaza mesajı değildir.
```

---

### 8.9 Moderation Workflow Readiness

Kontrol edilecek:

- Moderation case creation hangi domainlerden geliyor?
- Pending content public yüzeye çıkıyor mu?
- Approve/reject/takedown owner command ile mi çalışıyor?
- Moderator panel direct write yapıyor mu?
- Moderation decision social/content owner transition’a nasıl bağlanıyor?
- Audit evidence var mı?
- Duplicate moderation action idempotent mi?

Beklenen sonuç:

```text
Moderation visibility decision, hard delete zorunluluğu değildir; owner transition ile çalışmalıdır.
```

---

### 8.10 Social Abuse Signal Readiness

Kontrol edilecek:

- Review abuse signal
- Follow abuse signal
- Post/UGC abuse signal
- Q&A abuse signal
- Interaction spam signal
- Risk owner social truth mutate ediyor mu?
- Risk signal moderation veya restriction decision’a nasıl etki ediyor?

Beklenen sonuç:

```text
Risk sistemi sosyal truth mutate etmez; abuse signal ve review/hold üretir.
```

---

### 8.11 Media / Moderation / Risk Integration

Kontrol edilecek:

- Media upload sonrası moderation requirement var mı?
- AI moderation yoksa manual/queue fallback var mı?
- Uygunsuz media public leak ediyor mu?
- Risky user content publish öncesi hold alıyor mu?
- Media processing failure content visibility’i durduruyor mu?

Beklenen sonuç:

```text
Media-ready ve moderation-safe olmayan içerik public surface’e çıkmamalıdır.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Search/ranking final ordering implementation
- Full recommendation engine
- Full frontend/page drawings
- Creator/supplier/admin panel full UX
- Payment/order/finance implementation
- Production deployment
- Full BI/dashboard

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Content truth content owner alanında kalır
- Social truth social owner alanında kalır
- Media asset truth media owner alanında kalır
- Moderation decision owner transition’a bağlanır, direct hidden write olmaz
- Risk owner social/content truth mutate etmez
- BFF content/social truth üretmez
- UI moderation/eligibility truth üretmez
- Event/audit/outbox business mutation değildir

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication guard
- role/scope guard
- ownership guard
- eligibility guard
- state/lifecycle guard
- moderation block guard
- risk/abuse guard
- idempotency guard

### 10.3 Permission Kuralları

- Can_Write_Review auth ile değil eligibility ile açılır
- Can_Create_User_Product_Story delivered purchase ile açılır
- Can_Follow_Creator kayıtlı kullanıcıya bağlıdır
- Can_Ask_Question ürün/PDP context’e bağlıdır
- Creator content action yalnız kendi store scope’unda geçerlidir
- Moderator permission direct content write hakkı değildir

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- delivered ≠ review/story written
- raw media upload ≠ publishable asset
- moderation approved ≠ active commercial product
- moderation rejected ≠ hard delete zorunluluğu
- follow action ≠ feed ranking
- review created ≠ rating aggregate final
- event emitted ≠ owner state mutated

---

## 11. Riskler

### 11.1 RB-015 — Media Production Pipeline ve Güvenli Yayın Gate’i Yok

Bu fazın ana media blocker’ıdır.

### 11.2 Full Moderation Panel UI Eksikliği

Moderation foundation vardır; ancak production queue/panel eksikliği PHASE-08 ile birlikte kapanmalıdır.

### 11.3 Eligibility Leak Riski

Delivered olmadan review/story hakkı açılırsa güvenilirlik ve reward abuse riski doğar.

### 11.4 Content Visibility Leak Riski

Pending/rejected/moderation-blocked content public surface’e çıkarsa güvenlik ve marka riski doğar.

### 11.5 Media Public Leak Riski

Raw/broken/unsafe media publishable gibi gösterilirse kullanıcı deneyimi ve güvenlik riski doğar.

### 11.6 Abuse Signal Yetersizliği

Social spam, fake review, mass follow veya UGC abuse davranışları risk/fraud hattına bağlanmazsa sistem manipüle edilebilir.

---

## 12. Kabul Kriterleri

PHASE-06 kapanışı için minimum kabul kriterleri:

1. Story lifecycle doğrulanmalı
2. User product story eligibility delivered-line bazında doğrulanmalı
3. Media raw/upload/publishable ayrımı doğrulanmalı
4. Video/media processing strategy netleşmeli
5. Post/UGC visibility moderation-safe olmalı
6. Follow/feed relation owner boundary doğrulanmalı
7. Interaction idempotency ve abuse signal doğrulanmalı
8. Review eligibility verified purchase/delivered line ile çalışmalı
9. Q&A ürün bazlı ve moderation-safe olmalı
10. Moderation workflow owner boundary ile çalışmalı
11. Social abuse signals risk sistemine doğru bağlanmalı
12. Media/moderation/risk integration public leak üretmemeli
13. Targeted social/content/media/moderation tests PASS olmalı
14. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- story lifecycle smoke
- user product story eligibility smoke
- media asset lifecycle smoke
- post visibility/moderation smoke
- follow/interaction smoke
- review eligibility smoke
- Q&A moderation visibility smoke
- moderation workflow smoke
- social abuse signal smoke
- no pending/rejected public leak test
- no raw/broken media public leak test
```

Acceptance bağlantıları:

- Journey 07 — delivery → review/story eligibility
- Journey 13 — support/moderation/fraud escalations

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Story lifecycle kontrol edildi
[ ] User product story eligibility kontrol edildi
[ ] Media raw/upload/publishable ayrımı kontrol edildi
[ ] Video/media processing strategy kontrol edildi
[ ] Post/UGC visibility kontrol edildi
[ ] Follow relation owner boundary kontrol edildi
[ ] Interaction idempotency kontrol edildi
[ ] Review eligibility kontrol edildi
[ ] Verified purchase badge kontrol edildi
[ ] Q&A product context ve moderation kontrol edildi
[ ] Moderation workflow kontrol edildi
[ ] Social abuse signals kontrol edildi
[ ] Media/moderation/risk integration kontrol edildi
[ ] Pending/rejected public leak testi yapıldı
[ ] Raw/broken media public leak testi yapıldı
[ ] Owner / guard / permission boundary kontrol edildi
[ ] Targeted smoke/test kanıtı alındı
[ ] RB-015 güncellendi
[ ] Risk register güncellendi
[ ] Release blocker register güncellendi
[ ] Faz kapanış raporu üretildi
```

---

## 15. Faz Sonu Kararı İçin Beklenen Sonuç

Bu fazın ideal hedef kararı:

```text
PASS
```

Ancak medya CDN/transcoding veya full moderation panel PHASE-08/12’ye kontrollü devredilecekse şu karar mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Sosyal/content/media/moderation ana zinciri güvenli
- Public leak riski kapalı
- Delivered eligibility doğru çalışıyor
- Abuse signals minimum düzeyde çalışıyor
- Media publish gate güvenli
- Targeted tests PASS

### PASS WITH LIMITATION Şartı

- Ana safety ve visibility zinciri çalışıyor
- Full AI moderation, advanced CDN/transcoding veya full panel UI kontrollü fazlara devredildi
- Release blocker niteliğinde leak veya eligibility hatası yok

### PARTIAL Şartı

- Media publish gate belirsiz
- Review/story eligibility belirsiz
- Moderation visibility belirsiz
- Public leak testleri yok
- Test kanıtı eksik

### FAIL Şartı

- Pending/rejected content public görünüyor
- Raw/broken media public görünüyor
- Delivered olmadan review/story hakkı açılıyor
- UI/BFF eligibility truth üretiyor
- Risk sistemi social/content truth mutate ediyor

---

## 16. Sonraki Faza Devredenler

PHASE-07’ye devredenler:

- Feed ranking
- Discover ranking
- Recommendation
- Search/social signal usage
- Trend ordering

PHASE-08’e devredenler:

- Full moderation panel
- Creator content management panel
- Creator story/post/media management
- Admin review queues

PHASE-09’a devredenler:

- Advanced social abuse scoring
- Distributed rate limit
- Analytics/notification producer coverage
- Outbox/broker worker

PHASE-10’a devredenler:

- Story/video/post UI
- Review/Q&A UI
- Creator storefront surface
- Mobile media UX
- Page drawings and screen flows

PHASE-11’e devredenler:

- Delivery → review/story eligibility critical journey
- Support/moderation/fraud escalation critical journey

PHASE-12’ye devredenler:

- Media CDN / object storage production config
- Observability for media processing
- Moderation incident alerting

---

## 17. Nihai Faz Açılış Kararı

PHASE-06 şu şartla başlatılabilir:

```text
PHASE-05 Finance / Settlement / Payout / Reward Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, targeted social/content/media/moderation tests ve boundary review gereklidir.

Net açılış kararı:

```text
PHASE-06 Social / Content / Media / Moderation Readiness planı hazırdır.
```
