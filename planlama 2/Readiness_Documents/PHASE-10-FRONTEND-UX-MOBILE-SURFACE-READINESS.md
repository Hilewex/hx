# PHASE-10-FRONTEND-UX-MOBILE-SURFACE-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunun kullanıcıya, creator’a, supplier’a ve admin/operasyon ekiplerine görünen tüm ana yüzeylerini production-readiness seviyesine getirmektir.

Bu faz özellikle sayfa çizimleri, ekran akışları, mobile-first davranış, error/degraded UI, panel yüzeyleri ve kritik kullanıcı yolculuklarının görsel/işlevsel tamamlığını kapsar.

Bu fazın ana kuralı:

```text
UI truth üretmez.
UI yalnız owner/BFF tarafından sağlanan state, permission, eligibility ve projection bilgilerini gösterir.
```

Bu fazın hedefi:

```text
Backend ve domain foundation’ın kullanıcıya doğru, anlaşılır, mobile-first ve production-ready yüzeyler olarak yansımasını sağlamak.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki yüzeyleri kapsar:

- public storefront
- ana sayfa
- keşfet
- arama sayfası
- kategori / PLP
- PDP
- klasik ürün kartı
- story / video / post yüzeyleri
- fenomen mağaza storefront
- follow feed
- review / Q&A yüzeyleri
- cart
- checkout
- payment
- unknown-result / pending payment UI
- order confirmation
- order tracking
- cancel / return / refund request UI
- support / ticket UI
- reward point / point market UI
- notification preference UI
- creator panel
- supplier panel
- admin panel
- moderation/risk/support/finance operation panels
- mobile-first page drawings
- responsive layout
- empty/error/degraded states
- accessibility minimum
- performance minimum

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- yeni backend business logic üretmek
- payment provider live entegrasyonu yapmak
- settlement/payout implementation yapmak
- search/ranking engine yazmak
- media transcoding pipeline implement etmek
- final production deployment gate vermek
- full brand/design system overhaul yapmak

Bu faz frontend ve yüzey readiness fazıdır. Domain logic truth’u üretmez; mevcut owner/BFF contract’larını doğru yansıtır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `4-pdp sistemi.md`
2. `7-keşfet sistemi.md`
3. `8-klasik ürün kart sistemi.md`
4. `9-ana sayfa sistemi.md`
5. `10-kategori plp sistemi.md`
6. `12-arama sistemi.md`
7. `13-sepet sistemi.md`
8. `14-checkout sistemi.md`
9. `15-ödeme sistemi.md`
10. `16-sipariş sistemi.md`
11. `30-sipariş takip sistemi.md`
12. `18-iptal iade sistemi.md`
13. `20-destek sistemi.md`
14. `2-fenomen mağaza sistemi.md`
15. `42-fenomen mağaza yönetim paneli sistemi.md`
16. `43-tedarikçi panel sistemi.md`
17. `40-admin sistemi.md`
18. `5-story sistemi.md`
19. `6-video sistemi.md`
20. `21-post sistemi.md`
21. `31-yorum puanlama sistemi.md`
22. `32-soru cevap sistemi.md`
23. `38-puan market sistemi.md`
24. `39-ödül puan sistemi.md`
25. `19-bildirim sistemi.md`
26. `25-kural -yetki sistemi.md`
27. `OWNER_MATRIX.md`
28. `GUARD_MATRIX.md`
29. `PERMISSION_MATRIX.md`
30. `CRITICAL_JOURNEY_CHECKLIST.md`
31. `ACCEPTANCE_CRITERIA_PACK.md`
32. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Web / Panel Shell Foundation

Kayıtlara göre web ve panel shell foundation yapılmıştır.

Bu, uygulama yüzeylerinin teknik başlangıç omurgasının kurulduğunu gösterir; production UX acceptance anlamına gelmez.

### 6.2 BFF Read Routes Foundation

Catalog, PDP, cart, checkout, order, story, post, search gibi alanlarda BFF route veya read/delegation foundation kayıtları vardır.

Bu durum UI’nın veri alabileceği foundation olduğunu gösterir.

### 6.3 Route Protection Hardening

HARDENING-05 hattında protected route ve actor/permission hardening yapılmıştır.

Bu, panel ve korumalı yüzeyler için başlangıç güvenlik katmanı sağlar.

### 6.4 PX Domain Surface Foundations

PX kayıtlarında:

- havuz admin/supplier intake review surface
- creator store product management
- store post/follow feed
- customer address/checkout eligibility
- support/order visibility

gibi surface foundation kayıtları vardır.

### 6.5 Social / Media / Moderation Foundations

Story, post, media, moderation ve follow foundation kayıtları vardır.

Ancak bunların gerçek kullanıcı ekranlarında production-ready olup olmadığı ayrıca doğrulanmalıdır.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Full storefront UX acceptance yok
2. Mobile-first checkout/payment/order tracking doğrulanmadı
3. Payment unknown-result UI davranışı net değil
4. Creator panel production UX doğrulanmadı
5. Supplier panel production UX doğrulanmadı
6. Admin panel production UX doğrulanmadı
7. Moderation/risk/finance queues UI olarak doğrulanmadı
8. Search/PLP/filter/facet UI production acceptance yok
9. Story/video/media mobile UX doğrulanmadı
10. Error/degraded/empty states tam değil
11. Accessibility minimum kontrolü yok
12. Performance/mobile responsiveness minimum kontrolü yok
13. UI’nın truth üretmediği kaynak review ile doğrulanmalı

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Sayfa Çizimleri / Screen Flow Standardı

Her ana yüzey için şu çıktı hazırlanır:

```text
Sayfa adı:
Aktör:
Giriş koşulu:
Gösterilecek veri:
Gösterilmeyecek veri:
Ana aksiyonlar:
Guard / permission / eligibility etkisi:
Empty state:
Error state:
Degraded state:
Mobile-first notu:
Backend/BFF contract ihtiyacı:
```

Bu format tüm sayfa çizimleri ve ekran akışlarında kullanılacaktır.

---

### 8.2 Public Storefront Ana Sayfa

Kontrol edilecek:

- ana sayfa blokları
- story/video/post/product/category alanları
- personalized/fallback davranış
- guest/auth görünüm farkı
- unavailable/hidden content leak
- degraded feed state
- mobile-first layout

Beklenen sonuç:

```text
Ana sayfa projection gösterir; ranking veya commerce truth üretmez.
```

---

### 8.3 Search / PLP / Filter / Facet UI

Kontrol edilecek:

- search input
- no-result state
- degraded search state
- filters/facets
- category navigation
- PLP product grid
- sorting display
- hidden/unavailable product leak
- mobile filter UX

Beklenen sonuç:

```text
Search/PLP UI candidate, ranking ve taxonomy truth üretmez; gelen projection’ı gösterir.
```

---

### 8.4 PDP UI

Kontrol edilecek:

- product context
- variant selection
- price display
- stock/availability display
- add-to-cart eligibility
- creator/store context
- story/video/media blocks
- reviews/Q&A
- unavailable/not-found/degraded states
- mobile product detail flow

Beklenen sonuç:

```text
PDP görüntüleme cart write değildir; PDP final price/stock truth üretmez.
```

---

### 8.5 Cart UI

Kontrol edilecek:

- guest cart
- authenticated cart
- line quantity update
- invalid/unavailable product behavior
- stale price/stock warning
- coupon input başlangıç alanı
- cart total display
- checkout CTA eligibility
- mobile cart UX

Beklenen sonuç:

```text
Cart satın alma niyetidir; final validation checkout’ta yapılır.
```

---

### 8.6 Checkout UI

Kontrol edilecek:

- guest checkout flow
- authenticated checkout flow
- address selection / guest address
- shipping options
- price/stock final validation feedback
- coupon/campaign application feedback
- ready_for_payment state
- validation fail return-to-cart behavior
- mobile checkout UX

Beklenen sonuç:

```text
Checkout ready olmadan payment başlatılamaz.
```

---

### 8.7 Payment UI

Kontrol edilecek:

- payment method selection
- provider redirect / hosted flow
- payment pending
- payment success
- payment failed
- payment unknown-result
- retry / wait / support messaging
- duplicate submit prevention
- mobile payment UX

Beklenen sonuç:

```text
Unknown-result kesin success veya kesin failure gibi gösterilmemelidir.
```

---

### 8.8 Order Confirmation / Order Tracking UI

Kontrol edilecek:

- order created confirmation
- payment succeeded but order pending state
- order status timeline
- shipment tracking
- delivery status
- support CTA
- guest order lookup
- mobile order tracking

Beklenen sonuç:

```text
Payment result ve order status UI’da karıştırılmamalıdır.
```

---

### 8.9 Return / Refund UI

Kontrol edilecek:

- return eligibility display
- return request form
- return status timeline
- refund status
- partial return
- rejected return
- support escalation
- mobile return/refund flow

Beklenen sonuç:

```text
Return approved ≠ refund completed ayrımı kullanıcıya doğru gösterilmelidir.
```

---

### 8.10 Support / Ticket UI

Kontrol edilecek:

- ticket create
- ticket category
- order-linked support
- support status
- internal vs customer message ayrımı
- escalation visibility
- closed/reopen behavior
- mobile support UX

Beklenen sonuç:

```text
Support ticket owner state mutation yerine geçmez.
```

---

### 8.11 Story / Video / Post / Feed UI

Kontrol edilecek:

- story rail
- video card
- creator store post
- follow feed
- media loading/error
- moderation pending/blocked visibility
- like/save/share action states
- mobile swipe/scroll behavior

Beklenen sonuç:

```text
Moderation-safe ve media-ready olmayan içerik public yüzeye çıkmamalıdır.
```

---

### 8.12 Review / Q&A UI

Kontrol edilecek:

- review list
- review write eligibility
- verified purchase badge
- rating display
- Q&A ask question
- answer visibility
- moderation pending state
- mobile review/Q&A UX

Beklenen sonuç:

```text
Auth sahibi olmak review hakkı değildir; eligibility UI owner/BFF’den gelmelidir.
```

---

### 8.13 Creator Storefront UI

Kontrol edilecek:

- creator profile
- product list
- story/video/post blocks
- follow button
- creator-specific merchandising
- unavailable/suspended creator state
- mobile creator storefront UX

Beklenen sonuç:

```text
Creator storefront context global product truth’u değiştirmez.
```

---

### 8.14 Creator Panel UI

Kontrol edilecek:

- creator dashboard
- product management
- product reorder / merchandising
- story/post/media management
- performance summary
- payout visibility
- messages/support
- scope isolation
- mobile-first creator panel

Beklenen sonuç:

```text
Creator panel yalnız kendi mağaza scope’unda çalışır.
```

---

### 8.15 Supplier Panel UI

Kontrol edilecek:

- supplier dashboard
- product submission
- XML/API/manual upload
- stock update
- base price input
- order preparation
- shipment/tracking input
- dispute/support
- scope isolation

Beklenen sonuç:

```text
Supplier panel commercial activation veya final sale price owner’ı değildir.
```

---

### 8.16 Admin / Ops Panel UI

Kontrol edilecek:

- admin dashboard
- product approval
- creator/supplier management
- moderation queue
- risk review queue
- order operations
- support operations
- finance/payout operations
- approval flows
- audit/evidence visibility

Beklenen sonuç:

```text
Admin panel direct write yapmaz; protected owner command başlatır.
```

---

### 8.17 Error / Empty / Degraded State Matrix

Her ana sayfa için şu durumlar yazılmalıdır:

- loading
- empty
- not-found
- permission denied
- eligibility denied
- degraded
- retryable error
- non-retryable error
- unknown-result
- support escalation

Beklenen sonuç:

```text
UI kullanıcıyı yanlış kesin sonuçla yönlendirmemelidir.
```

---

### 8.18 Mobile-first / Responsive Minimum

Kontrol edilecek:

- 360px mobile baseline
- thumb-friendly CTA placement
- sticky checkout/payment actions
- media performance
- panel mobile usability
- modal/sheet behavior
- keyboard/address/payment input UX

Beklenen sonuç:

```text
Kritik commerce journey mobile-first çalışmalıdır.
```

---

### 8.19 Accessibility / Performance Minimum

Kontrol edilecek:

- semantic headings
- form labels
- focus state
- keyboard navigation minimum
- alt text/media fallback
- skeleton/loading
- image/video lazy loading
- basic performance budget

Beklenen sonuç:

```text
Yayın öncesi minimum erişilebilirlik ve performans borçları görünür olmalıdır.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Backend business rule değiştirme
- Owner/domain mutation implementasyonu
- Provider integration
- Financial settlement/payout implementation
- Full branding/design system overhaul
- Final deployment gate

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- UI truth üretmez
- UI permission truth üretmez
- UI eligibility truth üretmez
- UI price/stock/payment/order truth üretmez
- UI moderation/risk decision üretmez
- Panel direct write yapmaz
- UI/BFF projection ile owner truth karıştırılmaz

### 10.2 Guard Kuralları

UI yüzeyleri şu guard sonuçlarını göstermelidir:

- authentication required
- permission denied
- eligibility denied
- state not allowed
- risk blocked
- moderation blocked
- financial blocked
- degraded / unavailable

### 10.3 Permission Kuralları

- Guest checkout sosyal hak açmaz
- Auth user review eligible anlamına gelmez
- Creator kendi scope’u dışına çıkamaz
- Supplier kendi scope’u dışına çıkamaz
- Admin direct write hakkı değildir

### 10.4 Transition Kuralları

UI’da korunacak ayrımlar:

- cart intent ≠ checkout ready
- checkout ready ≠ payment confirmed
- payment succeeded ≠ order created
- shipped ≠ delivered
- return approved ≠ refund completed
- settled ≠ payable
- payable ≠ paid_out
- uploaded ≠ published

---

## 11. Riskler

### 11.1 RB-009 — Frontend / Mobile Critical Surface Acceptance Yok

Bu fazın ana release blocker’ıdır.

### 11.2 UI Truth Üretimi Riski

UI state ve local logic owner truth gibi çalışırsa backend boundary bozulur.

### 11.3 Unknown-result Yanıltma Riski

Payment unknown-result yanlış success/failure gösterilirse kullanıcı ve operasyon karışır.

### 11.4 Panel Direct Write Riski

Panel UI action’ları protected command yerine direct mutation yaparsa owner boundary bozulur.

### 11.5 Critical Mobile UX Riski

Checkout/payment/order tracking mobile-first çalışmazsa ürün production-ready kabul edilemez.

### 11.6 Error/Degraded State Eksikliği

Hatalı veya degraded durumda kullanıcı yanıltılırsa support ve finansal risk büyür.

---

## 12. Kabul Kriterleri

PHASE-10 kapanışı için minimum kabul kriterleri:

1. Ana sayfa / storefront screen flow yazılmalı
2. Search/PLP/PDP screen flow yazılmalı
3. Cart/checkout/payment screen flow yazılmalı
4. Order tracking/return/refund/support screen flow yazılmalı
5. Story/video/post/review/Q&A screen flow yazılmalı
6. Creator storefront screen flow yazılmalı
7. Creator panel screen flow yazılmalı
8. Supplier panel screen flow yazılmalı
9. Admin/ops panel screen flow yazılmalı
10. Error/empty/degraded state matrix hazırlanmalı
11. Mobile-first kritik journey akışları doğrulanmalı
12. UI truth üretmeme source/boundary review yapılmalı
13. Panel direct write riski tekrar kontrol edilmeli
14. Minimum accessibility/performance checklist hazırlanmalı
15. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz frontend/source/UX etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- web/panel route smoke
- storefront walkthrough
- mobile checkout walkthrough
- payment unknown-result UI scenario
- order tracking UI scenario
- creator panel scope walkthrough
- supplier panel scope walkthrough
- admin protected action UI walkthrough
- error/degraded state review
- accessibility minimum check
- performance minimum check
```

Not:

Sayfa çizimleri ve ekran akışları tasarım/planlama çıktısıdır. Kod etkisi yoksa typecheck/build gerekmez; ancak gerçek UI implementasyonu/kapanışı için build ve targeted smoke gerekir.

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Sayfa çizimi / screen flow standardı uygulandı
[ ] Ana sayfa / storefront flow hazırlandı
[ ] Search / PLP / filter flow hazırlandı
[ ] PDP flow hazırlandı
[ ] Cart flow hazırlandı
[ ] Checkout flow hazırlandı
[ ] Payment flow hazırlandı
[ ] Unknown-result UI flow hazırlandı
[ ] Order confirmation/tracking flow hazırlandı
[ ] Return/refund flow hazırlandı
[ ] Support/ticket flow hazırlandı
[ ] Story/video/post/feed flow hazırlandı
[ ] Review/Q&A flow hazırlandı
[ ] Creator storefront flow hazırlandı
[ ] Creator panel flow hazırlandı
[ ] Supplier panel flow hazırlandı
[ ] Admin/ops panel flow hazırlandı
[ ] Error/empty/degraded state matrix hazırlandı
[ ] Mobile-first minimum kontrol yapıldı
[ ] Accessibility minimum kontrol yapıldı
[ ] Performance minimum kontrol yapıldı
[ ] UI truth üretmiyor kontrol edildi
[ ] Panel direct write yok kontrol edildi
[ ] Targeted UI smoke/walkthrough kanıtı alındı
[ ] RB-009 güncellendi
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

Ancak bazı advanced UX/polish işleri release sonrası roadmap’e alınacaksa şu karar mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Kritik kullanıcı ve panel yüzeyleri hazır
- Mobile-first commerce journey çalışıyor
- Error/degraded/unknown-result UI yanıltıcı değil
- UI truth üretmiyor
- Panel direct write yok
- Targeted UI walkthrough/smoke PASS

### PASS WITH LIMITATION Şartı

- Kritik release yüzeyleri hazır
- Advanced polish veya non-critical ekranlar kontrollü devredildi
- Release blocker niteliğinde UI eksikliği yok

### PARTIAL Şartı

- Checkout/payment/order tracking UI belirsiz
- Panel yüzeyleri belirsiz
- Error/degraded states eksik
- Mobile-first acceptance yok
- UI truth source review yok

### FAIL Şartı

- UI payment/order/refund durumlarını yanlış gösteriyor
- Unknown-result kesin success/failure gibi gösteriliyor
- Panel direct write var
- UI eligibility/permission truth üretiyor
- Critical journey mobile-first çalışmıyor

---

## 16. Sonraki Faza Devredenler

PHASE-11’e devredenler:

- 13 critical journey release acceptance
- UI journey walkthrough evidence
- success/fail/rollback/retry/audit/analytics proof

PHASE-12’ye devredenler:

- production performance monitoring
- frontend deployment
- CDN/cache production config
- error monitoring
- release observability

Post-release roadmap’e devredilebilecekler:

- advanced personalization UI
- advanced dashboard visuals
- non-critical report screens
- deep visual polish
- A/B test variants

---

## 17. Nihai Faz Açılış Kararı

PHASE-10 şu şartla başlatılabilir:

```text
PHASE-09 Risk / Fraud / Analytics / Notification Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için screen flow çıktıları, targeted UI walkthrough, source/boundary review ve gerektiğinde build/smoke kanıtı gereklidir.

Net açılış kararı:

```text
PHASE-10 Frontend / UX / Mobile Surface Readiness planı hazırdır.
```
