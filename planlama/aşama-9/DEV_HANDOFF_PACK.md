# DEV_HANDOFF_PACK

## 1. Amaç

Bu dosya, Aşama 9 kapsamında tasarım sistemi, ekran sözleşmeleri ve component/state kararlarının geliştiriciye uygulanabilir biçimde teslim edilmesini sağlar.

Bu dosyanın amacı:

* tasarım kararlarını kodlanabilir teslim kurallarına çevirmek,
* ekran, component, DTO ve state bağlarını geliştirici açısından netleştirmek,
* web, mobil ve panel yüzeylerinde ortak handoff dilini kurmak,
* belirsiz geliştirme yorumu alanlarını azaltmaktır.

Net kural:

* Bu dosya yeni mimari üretmez.
* Bu dosya Aşama 8 ve Aşama 9’da kapanan kararların geliştiriciye uygulama paketi olarak çalışır.
* Handoff yalnız görsel tarif değil; davranış, veri bağı, responsive davranış ve state bağı da taşır.

---

## 2. Kaynak dosyalar

Bu handoff paketi aşağıdaki kaynakların üstünde çalışır:

* `aşama-8/SCREEN_CONTRACTS_REFINED.md`
* `aşama-8/PANEL_CONTRACTS.md`
* `aşama-8/DTO_RESPONSE_CATALOG.md`
* `aşama-8/STATEFUL_UI_BEHAVIOR_GUIDE.md`
* `DESIGN_TOKEN_GUIDE.md`
* `COMPONENT_STATE_GUIDE.md`
* `FIGMA_LINKS.md`

Yüzey doğrulama kaynakları:

* `9-ana sayfa sistemi.md`
* `7-keşfet sistemi.md`
* `10-kategori-plp sistemi.md`
* `12- Arama Sistemi.md`
* `4-pdp sistemi.md`
* `2-fenoemen mağaza sistemi.md`
* `5-story sistemi.md`
* `6-video sistemi.md`
* `11-takip sistemi.md`
* `21-post sistemi .md`
* `36-beğen ve kaydet sayfaları sistemi.md`
* `13-sepet sistemi .md`
* `14-checkout sistemi .md`
* `15-ödeme sistemi .md`
* `16-sipariş sistemi .md`
* `17- kargo ve teslimat sistemi.md`
* `18- iptal ve iade sistemi .md`
* `19- bildirim sistemi.md`
* `20-destek sistemi .md`
* `30-sipariş takip sistemi.md`
* `40-admin sistemi.md`
* `42-fenomen mağaza yönetim panel sistemi.md`
* `43-tedarikçi panel sistemi.md`
* `45-sipariş operasyon sistemi.md`
* `53- destek ticket operasyon sistemi.md`

Net kural:
Handoff içeriği bu kaynaklarla çelişemez.

---

## 3. Handoff kapsamı

Bu dosya şu alanlara uygulanır:

### 3.1 Storefront yüzeyleri

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Fenomen Mağaza Sayfası
* Takip Sayfası
* Beğenilenler
* Kaydedilenler

### 3.2 Sosyal / içerik yüzeyleri

* Story yüzeyleri
* Video product card / expanded video deneyimi
* Post yüzeyleri
* PDP içi yorum / soru-cevap / kullanıcı story yüzeyleri

### 3.3 Commerce yüzeyleri

* Sepet
* Checkout
* Ödeme

### 3.4 Post-order / support yüzeyleri

* Sipariş Detay
* Sipariş Takip
* Bildirim Merkezi
* Destek Girişi
* İptal / İade giriş yüzeyleri

### 3.5 Panel yüzeyleri

* Admin
* Fenomen Paneli
* Tedarikçi Paneli
* Sipariş Operasyon
* Destek Ticket Operasyon

---

## 4. Geliştiriciye teslim yaklaşımı

Her ekran veya component handoff’u minimum şu katmanları içermelidir:

1. Amaç
2. Dosya / bileşen konumu
3. Girdi DTO’ları
4. Kullanılan component ailesi
5. State davranışları
6. Responsive davranış
7. Edge-case notları
8. Yasak davranışlar

---

## 5. Kod organizasyon ilkeleri

## 5.1 Ortak ilke

* UI truth üretmez
* DTO ile truth entity karıştırılmaz
* component kendi local görsel state’ini taşıyabilir ama domain truth üretmez
* state gating UI’da görünür olur ama karar kaynağı owner/domain katmanıdır

## 5.2 Web tarafı

Teknoloji omurgası:

* Next.js
* React
* TypeScript
* Tailwind CSS
* TanStack Query
* React Hook Form
* Zod 

Önerilen katmanlar:

* route/page katmanı
* feature orchestration katmanı
* component library katmanı
* hook katmanı
* ui types / dto mapping katmanı

## 5.3 Mobil tarafı

Teknoloji omurgası:

* React Native
* Expo
* TypeScript
* Expo Router
* TanStack Query
* React Hook Form
* Zod 

Net kural:
Semantic token ve component ailesi korunur; gesture, safe-area ve device ergonomisi mobil-first ele alınır.

## 5.4 Panel tarafı

Panel UI kit aynı semantic tasarım sistemini kullanır; ama veri yoğunluğu, tablo ergonomisi ve operasyonel netlik önceliklidir.

---

## 6. Token -> component -> ekran bağlama ilkesi

## 6.1 Token kullanımı

* Hardcoded spacing / radius / color değerlerinden kaçınılır
* Semantic token katmanı kullanılır
* Storefront ve panel farklı primitive set değil, farklı semantic kullanım profili taşır

## 6.2 Component kullanımı

* Aynı semantic role’e sahip bileşen farklı ekranlarda yeniden inşa edilmez
* Mümkünse ortak component varyantı üzerinden çözülür

## 6.3 Ekran kullanımı

* Ekran, component’leri kompoze eder
* Ekran içinde DTO mapping ve state routing yapılır
* Domain logic component içine gömülmez

---

## 7. Naming ve dosyalama kuralları

## 7.1 Component adı

Anlam taşıyan semantic ad kullanılmalı:

* `ClassicProductCard`
* `VideoProductCard`
* `StoryViewer`
* `PaymentStatusBlock`
* `FollowedStoresQuickAccess`
* `TrackingTimeline`

## 7.2 State adı

Ortak state sözlüğü kullanılmalı:

* `blocked`
* `degraded`
* `pending`
* `conflict`
* `loading`
* `empty`

## 7.3 Variant adı

* `primary`
* `secondary`
* `danger`
* `ghost`
* `default`
* `loading`
* `empty`
* `blocked`
* `degraded`

## 7.4 Dosya adı

Bileşen dosyaları component adıyla hizalı olmalı; aynı component farklı klasörlerde rastgele çoğaltılmamalıdır.

---

## 8. Responsive handoff kuralları

## 8.1 Mobile-first

Varsayılan davranış mobil önceliklidir.

## 8.2 Web genişleme mantığı

Web sürümünde:

* çok kolon
* sticky yan alan
* paralel bilgi görünürlüğü
* daha yoğun tablo / filtre
  uygulanabilir.

## 8.3 Handoff notu zorunluluğu

Her kritik ekran için aşağıdaki notlardan en az biri verilmelidir:

* mobilde sheet, web’de sidebar
* mobilde sticky CTA, web’de side CTA
* mobilde tek kolon, web’de iki kolon
* mobilde alt nav, web’de header action cluster

---

## 9. DTO binding kuralları

## 9.1 Genel kural

Ekran component’leri DTO ailelerine bağlanır; raw truth entity’ye bağlanmaz.

## 9.2 Mapping ilkesi

* DTO mapping feature/route orchestration katmanında yapılmalı
* card/component seviyesinde raw entity mapping çoğaltılmamalı

## 9.3 State binding

Aşağıdaki alanlar doğrudan component state görünürlüğünü besler:

* `interaction_state`
* `eligibility_state`
* `payment_state_summary`
* `tracking_state_summary`
* `moderation_state_summary`
* `degraded_state`

## 9.4 Yasak

* component içinde domain truth üretmek
* raw backend nesnesini doğrudan UI primitive’e bağlamak

---

## 10. Storefront handoff kuralları

## 10.1 Ana Sayfa

* block-based composition kullanır
* tek blok bozulunca tüm sayfa fail olmaz
* web header ve mobil header farklı içerik seti taşır
* mobilde alt nav zorunlu yüzeylerden biridir
* story strip mağaza tanıtım story’si taşır
* video block ve classic block ayrı semantic ailelerdir

## 10.2 Keşfet

* video-first akış
* story strip ayrı state taşır
* üst story şeridinde yalnız mağaza tanıtım story’leri bulunur
* ürün tanıtım story’si keşfet üst şeridine alınmaz

## 10.3 Arama

* platform / discover / catalog / store modları aynı görünüm gibi kodlanmamalı
* result state ve no-result state ayrı ele alınmalı

## 10.4 PLP

* facet, sort, list ve result summary ayrışmalı
* filtre yüklenmesi ile liste yüklenmesi aynı handoff state’i değildir

## 10.5 PDP

* media, info, buy box, interaction, store context, review, QA, user story strip alt blokları ayrı bileşen kümeleri olmalı
* PDP’de fenomen mağaza story akışı bulunmaz
* yalnız kullanıcı story şeridi bulunur

## 10.6 Fenomen Mağaza Sayfası

* mağaza identity
* mağaza story alanı
* mağaza ürün akışı
* gerekirse ikincil post görünümü
  ayrışmalı

## 10.7 Takip Sayfası

* yalnız takip edilen mağazaların post akışı gösterilir
* kategori şeridi yok
* story şeridi yok
* hızlı mağaza erişim alanı zorunlu

## 10.8 Beğenilenler / Kaydedilenler

* list/grid varyantı açık tanımlanmalı
* empty-state güçlü CTA taşımalı

---

## 11. Sosyal / içerik handoff kuralları

## 11.1 Story

Story sistemi üç ana tür içerir:

* fenomen mağaza tanıtım story’si
* fenomen mağaza ürün tanıtım story’si
* kullanıcı ürün story’si

Net kural:
Bu üç tür aynı viewer mantığında çalışabilir ama aynı semantic kimlikte sunulmaz. Tür farkı UI’da görünür olmalıdır. 

## 11.2 Story bağlam koruma

* home’dan açılan story home bağlamında çalışır
* keşfetten açılan keşfet bağlamında çalışır
* mağazadan açılan mağaza bağlamında çalışır
* PDP’de yalnız kullanıcı story bağlamı bulunur

## 11.3 Video product card

* story değildir
* mağaza-bağlamlı satış yüzeyidir
* açıldığı bağlam dışına çıkmamalıdır
* home video kartı yalnız home video kart akışı bağlamında gezinmelidir
* store page video kartı yalnız store bağlamında gezinmelidir 

## 11.4 Post

* hafif sosyal, kısa, okunabilir
* yorum yok
* görünür tartışma yok
* ürün bağlı olabilir ama PDP yerine geçmez
* takip yüzeyinin ana içeriğidir 

---

## 12. Commerce handoff kuralları

## 12.1 Sepet

* line-level warning desteklenmeli
* cart summary ve checkout CTA ayrı blok olmalı
* drift varsa warning görünmelidir

## 12.2 Checkout

* address, pricing, coupon, delivery, payment readiness blokları ayrı component kümeleri olmalı
* invalid state nedeni görünür olmalı

## 12.3 Ödeme

* initiating
* pending-provider
* failed
* unknown-result
* success-visible
  durumları net component ayrımı taşımalı

Net kural:
`captured != order_created` ayrımı UI’da korunur.

## 12.4 Guest commerce

* guest user payment yapabilir
* guest order oluşabilir
* ama social eligibility açılmaz
* guest one-time address ile saved address aynı davranış sayılmaz

## 12.5 Sipariş / Takip

* order summary ile tracking summary ayrı component aileleri olmalı
* paket bazlı görünürlük gerekiyorsa korunmalı
* partial states tek kaba satıra indirgenmemeli

---

## 13. Bildirim ve destek handoff kuralları

## 13.1 Bildirim

* priority visual hierarchy korunmalı
* grouped social signal ile critical transactional signal aynı treatment almaz

## 13.2 Destek

* topic-first entry
* self-service -> ticket escalation akışı component seviyesinde görünür olmalı
* support entry serbest chat alanı gibi kodlanmamalı
* guest order support path ayrıca gösterilebilmelidir

---

## 14. Panel handoff kuralları

## 14.1 Admin

* dashboard = karar ekranı
* KPI, queue, alert ve action zone ayrışmalı

## 14.2 Creator panel

* mobile-first self-service korunmalı
* restricted / suspended görünürlüğü sessiz saklanmamalı

## 14.3 Supplier panel

* ürün girişi, revizyon, stok/baz fiyat ve fulfillment işleri ayrı alanlar olarak teslim edilmeli

## 14.4 Ops ve support paneli

* queue state, row action, escalation ve SLA durumu component seviyesinde görünür olmalı

## 14.5 Protected action notu

* panel butonu final mutation yapmış gibi davranmaz
* accepted ile completed ayrımı handoff notlarında görünmelidir

---

## 15. State handoff kuralları

Her kritik component için şu sorular cevaplanmalıdır:

* loading var mı?
* empty var mı?
* blocked var mı?
* degraded var mı?
* pending var mı?
* conflict var mı?
* error var mı?

Her state için minimum şu notlardan biri bulunmalıdır:

* hangi text değişir
* hangi badge görünür
* hangi CTA disable olur
* hangi icon / helper text görünür
* skeleton mı inline message mı kullanılacak

---

## 16. Edge-case handoff listesi

Aşağıdaki edge-case’ler geliştiriciye açık teslim edilmelidir:

* guest order
* low stock
* out-of-stock after cart
* invalid checkout
* coupon rejected
* payment unknown result
* partial delivery
* partial return
* moderated content hidden
* degraded feed block
* permission denied in panel
* invalid transition in panel
* follow empty state
* story unavailable
* video degraded
* post moderated

Net kural:
Edge-case notu olmayan kritik ekran “handoff tamam” sayılmaz.

---

## 17. Guest vs auth user handoff kuralları

## 17.1 Genel kural

Guest checkout açıktır.
Ama guest user ile auth user aynı post-commerce ve social hak setine sahip değildir.

## 17.2 Handoff notu zorunlu alanlar

Aşağıdaki yüzeylerde guest/auth ayrımı açık yazılmalıdır:

* Checkout
* Payment
* Order detail
* Support entry
* PDP social actions
* Review / QA
* Save / follow / like

## 17.3 Kural

* guest commerce açık
* guest social write kapalı
* guest payment sonrası login olmuş gibi davranış verilmez

---

## 18. Testability handoff notları

Her kritik ekran/component için test notu düşünülebilmelidir:

* hangi state screenshot test ister
* hangi CTA state transition test ister
* hangi blocked state explicit assertion ister
* hangi responsive varyant ayrı doğrulanmalı

---

## 19. Figma handoff bağı

Bu dosya doğrudan Figma linki içermez.
Ama `FIGMA_LINKS.md` ile şu yapıya bağlanır:

* page / frame listesi
* component set listesi
* variant state listesi
* responsive örnekler
* redline / spacing notları

---

## 20. İlk faz için minimum developer handoff teslimi

İlk fazda aşağıdaki alanlar mutlaka kapanmalıdır:

* token kullanımı
* component naming
* state matrix
* responsive notlar
* DTO-state binding mantığı
* guest/auth ayrımı gereken alanlar
* story/video/post/follow ayrımları
* commerce ve panel protected action ayrımları

---

## 21. Kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* tasarım kararları geliştiriciye uygulanabilir dilde çevrilmişse,
* ekran / component / DTO / state bağı netleşmişse,
* responsive handoff mantığı yazılmışsa,
* story / video / follow / post / guest commerce ayrımları görünür olmuşsa,
* edge-case listesi açıkça teslim edilmişse,
* guest/auth ve accepted/completed ayrımları korunmuşsa,
* panel ve storefront için farklı kullanım profili ama ortak sistem mantığı kurulmuşsa.
