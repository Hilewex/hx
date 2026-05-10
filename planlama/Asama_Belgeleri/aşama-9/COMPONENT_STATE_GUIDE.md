# COMPONENT_STATE_GUIDE

## 1. Amaç

Bu dosya, Aşama 9 kapsamında platformun component ailelerini ve bu component’lerin desteklemesi gereken state davranışlarını sabitler.

Bu dosyanın amacı:

* Aşama 8’de tanımlanan ekran, DTO ve state davranış sözleşmelerini component seviyesine indirmek,
* storefront, sosyal yüzeyler, commerce yüzeyleri ve panel yüzeyleri için ortak component sözlüğü kurmak,
* tasarımcı ve geliştiricinin aynı component/state modelini kullanmasını sağlamak,
* Figma, component library ve developer handoff için uygulanabilir bileşen mantığı üretmektir.

Net kural:

* Component yalnız görsel parça değildir; state taşıyan davranış birimidir.
* Aynı component farklı ekranlarda farklı içerikle kullanılabilir; ama semantic rol ve state mantığı ortak kalmalıdır.
* State yalnız renk değişimi değildir; layout, icon, label, helper text, disabled/blocked davranışı ve feedback ile birlikte ele alınmalıdır.

---

## 2. Kapsam

Bu dosya aşağıdaki yüzey aileleri için component ve state davranışını kapsar.

### 2.1 Storefront çekirdek

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Fenomen Mağaza Sayfası
* Takip Sayfası
* Beğenilenler Sayfası
* Kaydedilenler Sayfası

### 2.2 Sosyal / içerik yüzeyleri

* Story strip
* Story viewer
* Video product card expanded view
* Video viewer / fullscreen
* Post feed
* Post card
* Yorum / puan sunum yüzeyleri
* Soru / cevap sunum yüzeyleri
* Sosyal etkileşim overlay’leri

### 2.3 Commerce yüzeyleri

* Sepet
* Checkout
* Ödeme

### 2.4 Sipariş sonrası yüzeyler

* Sipariş Detay
* Sipariş Takip
* Bildirim Merkezi
* Destek Girişi
* İptal / İade başlangıç yüzeyleri

### 2.5 Panel yüzeyleri

* Admin
* Fenomen Paneli
* Tedarikçi Paneli
* Sipariş Operasyon
* Destek Ticket Operasyon

---

## 3. Ortak state sözlüğü

Aşağıdaki state ailesi component seviyesinde ortak kabul edilir:

* `default`
* `hover`
* `pressed`
* `selected`
* `focused`
* `disabled`
* `loading`
* `empty`
* `blocked`
* `degraded`
* `pending`
* `conflict`
* `success`
* `error`

Not:
Her component tüm state’leri desteklemek zorunda değildir.
Ama desteklenen state’ler component kontratında görünür olmalıdır.

---

## 4. Ortak component davranış ilkeleri

### 4.1 State görünür olmalı

Kritik state değişimleri yalnız route veya backend davranışı olarak kalmamalı; component bunu görünür kılmalıdır.

### 4.2 Disabled ile blocked aynı şey değildir

* `disabled` = şu anda kullanılamaz ama açıklanabilir domain engeli görünmeyebilir
* `blocked` = policy / permission / eligibility / state gate gibi semantik engel vardır

### 4.3 Loading ile pending aynı şey değildir

* `loading` = veri veya içerik bekleniyor
* `pending` = aksiyon kabul edildi ama nihai sonuç tamamlanmadı

### 4.4 Empty teknik hata değildir

`empty` state yönlendirici ve anlaşılır olmalıdır; error dili kullanılmaz.

### 4.5 Conflict sessiz yutulmaz

State çakışması, stale veri, duplicate aksiyon veya invalid transition durumları component seviyesinde uygun uyarı veya refresh davranışı taşır.

---

## 5. Layout / shell component aileleri

## 5.1 PageShell

Amaç:

* ekranın üst chrome, içerik ve alt alanını düzenlemek

Desteklenen state’ler:

* default
* loading
* degraded

## 5.2 SectionContainer

Amaç:

* sayfa içindeki bağımsız blokları kapsamak

Desteklenen state’ler:

* default
* loading
* empty
* degraded
* error

## 5.3 StickyBar

Amaç:

* sticky header, sticky CTA, sticky action alanları

Desteklenen state’ler:

* default
* condensed
* hidden-on-scroll (uygunsa)
* blocked

---

## 6. Navigation component aileleri

## 6.1 Header

Kullanım:

* Ana Sayfa
* Keşfet
* Arama
* PLP
* PDP
* mağaza yüzeyleri
* hesap / sipariş / bildirim giriş alanları

Desteklenen state’ler:

* default
* sticky
* scrolled
* search-active
* logged-out
* logged-in
* notification-badge-present
* cart-badge-present

Not:
Ana sayfa sistemine göre web header ile mobil header aynı içerik setine sahip değildir. Bu varyant farkı tasarım ve handoff’ta korunmalıdır. 

## 6.2 BottomNavigation / TabBar

Kullanım:

* mobil ana gezinme

Desteklenen state’ler:

* default
* active-tab
* unread-badge-present
* logged-out
* logged-in

## 6.3 Breadcrumb

Kullanım:

* PLP
* PDP
* panel iç hiyerarşi

Desteklenen state’ler:

* default
* truncated
* loading

---

## 7. Input ve form component aileleri

## 7.1 TextInput

Kullanım:

* checkout adres alanları
* destek konu alanları
* panel form alanları

Desteklenen state’ler:

* default
* focused
* filled
* disabled
* error
* success

## 7.2 SearchInput

Kullanım:

* header arama
* keşfet araması
* katalog araması
* panel liste araması

Desteklenen state’ler:

* default
* focused
* typing
* suggestion-open
* loading
* no-result-context

## 7.3 Select / Dropdown

Desteklenen state’ler:

* default
* open
* selected
* disabled
* error

## 7.4 TextArea

Kullanım:

* destek
* panel reason / note
* sınırlı kullanıcı giriş alanları

Desteklenen state’ler:

* default
* focused
* disabled
* error
* character-limit-warning (gerekiyorsa)

## 7.5 FormGroup / FieldSet

Amaç:

* alan başlığı + input + helper text + error metni birlikte taşımak

Desteklenen state’ler:

* default
* required
* error
* blocked

---

## 8. Action component aileleri

## 8.1 Button

Semantic roller:

* primary
* secondary
* ghost
* danger
* link-style

Desteklenen state’ler:

* default
* hover
* pressed
* focused
* disabled
* loading
* blocked
* success (gerekiyorsa kısa süreli)

## 8.2 IconButton

Desteklenen state’ler:

* default
* hover
* pressed
* selected
* disabled
* blocked

## 8.3 FAB / FloatingAction

Desteklenen state’ler:

* default
* visible
* hidden
* disabled

---

## 9. Feedback component aileleri

## 9.1 Badge / Tag

Kullanım:

* kampanya
* yeni
* stok uyarısı
* durum etiketi
* risk / escalation / pending etiketleri

Desteklenen state’ler:

* info
* success
* warning
* error
* pending
* blocked
* degraded
* conflict

## 9.2 InlineMessage

Kullanım:

* form helper
* checkout warning
* payment guidance
* moderation / policy block

Desteklenen state’ler:

* info
* success
* warning
* error
* blocked
* degraded

## 9.3 Toast / Snackbar

Kullanım:

* kısa süreli feedback

Desteklenen state’ler:

* success
* error
* info
* warning

Not:
Final truth gerektiren commerce işlemleri yalnız toast ile anlatılmaz.

## 9.4 EmptyStateBlock

Kullanım:

* boş liste
* boş favori / kayıt
* boş takip akışı
* boş bildirim
* boş sipariş alanı

Desteklenen state’ler:

* empty
* empty-with-action

## 9.5 SkeletonBlock

Kullanım:

* loading placeholder

Desteklenen state’ler:

* loading

---

## 10. Commerce component aileleri

## 10.1 PriceTag

Kullanım:

* product card
* PDP
* cart line
* checkout summary
* order line

Desteklenen state’ler:

* default
* discount-present
* campaign-highlight
* price-changed-warning

## 10.2 StockIndicator

Kullanım:

* PDP
* cart line
* checkout summary

Desteklenen state’ler:

* in-stock
* low-stock
* out-of-stock
* uncertain / recheck-needed

## 10.3 QuantitySelector

Desteklenen state’ler:

* default
* min-reached
* max-reached
* disabled
* blocked

## 10.4 VariantSelector

Desteklenen state’ler:

* default
* selected
* unavailable-option
* required-not-selected
* blocked

## 10.5 CouponField / CouponPanel

Desteklenen state’ler:

* default
* applying
* applied
* invalid
* blocked
* removed

## 10.6 OrderSummaryCard

Kullanım:

* cart
* checkout
* order detail

Desteklenen state’ler:

* default
* updating
* invalid-warning
* degraded

---

## 11. Product / content card aileleri

## 11.1 ClassicProductCard

Kullanım:

* Ana Sayfa
* PLP
* Beğenilenler
* Kaydedilenler
* mağaza ürün listeleri

Desteklenen state’ler:

* default
* loading
* out-of-stock
* campaign-highlight
* saved
* liked
* disabled-action

## 11.2 VideoProductCard

Kullanım:

* Ana Sayfa video blokları
* Keşfet
* mağaza yüzeyleri
* kategori içinde video-card destekli alanlar

Desteklenen state’ler:

* default
* autoplaying
* paused
* muted
* loading-media
* degraded-media
* liked
* saved
* cart-action-visible

Net kural:
Videolu ürün kart story değildir; ürün/fiyat/ticari aksiyon ağırlığı korunmalıdır. 

## 11.3 StoreCard

Kullanım:

* Ana Sayfa
* mağaza görünürlük blokları
* önerilen mağaza alanları

Desteklenen state’ler:

* default
* followed
* loading
* restricted-visibility

## 11.4 PostCard

Kullanım:

* Takip
* mağaza içi post görünümü

Desteklenen state’ler:

* default
* product-linked
* campaign
* announcement
* liked
* saved
* shared-feedback
* loading-media
* moderated / hidden

Net kural:
Post uzun tartışma ve yorum zinciri taşımaz. Hafif sosyal kart olarak kalır. 

---

## 12. Story component aileleri

## 12.1 StoryRing

Kullanım:

* Ana Sayfa mağaza tanıtım story şeridi
* Keşfet mağaza tanıtım story şeridi
* mağaza içi story alanları
* PDP kullanıcı story şeridi

Desteklenen state’ler:

* unseen
* seen
* active
* loading
* blocked

## 12.2 StoryStrip

Desteklenen state’ler:

* default
* partial
* loading
* empty
* degraded

## 12.3 StoryViewer

Desteklenen state’ler:

* loading
* playing
* paused
* muted
* ended
* unavailable
* blocked

### Zorunlu varyantlar

* web modal
* mobile fullscreen
* home context
* discover context
* store context
* PDP user-story context

Net kural:
Story bağlamı açıldığı yüzeye göre korunur. Türler birbirine karışmaz. 

---

## 13. Video experience component aileleri

## 13.1 VideoViewer / ExpandedVideoView

Desteklenen state’ler:

* loading
* buffering
* playing
* paused
* muted
* ended
* degraded
* unavailable

## 13.2 MiniPDP

Kullanım:

* video kart expanded experience içinde

Desteklenen state’ler:

* default
* variant-required
* blocked
* quick-add-success
* quick-add-failed

Net kural:
Mini PDP, tam PDP değildir; hızlı ticari geçiş alanıdır. 

## 13.3 VideoControlBar

Desteklenen state’ler:

* playing
* paused
* muted
* unmuted
* scrubbing

---

## 14. PDP alt component aileleri

## 14.1 MediaGallery

Desteklenen state’ler:

* loading
* ready
* image-mode
* video-mode
* degraded-media

## 14.2 BuyBox

Desteklenen state’ler:

* default
* required-variant-missing
* low-stock
* out-of-stock
* blocked
* pending-action

## 14.3 InteractionBar

Desteklenen state’ler:

* default
* liked
* saved
* shared-feedback
* login-required
* blocked

## 14.4 ReviewSummaryBlock

Desteklenen state’ler:

* loading
* ready
* empty
* eligibility-closed
* moderated-degraded

## 14.5 QuestionAnswerBlock

Desteklenen state’ler:

* loading
* ready
* empty
* login-required
* blocked-by-policy
* under-review-indicator

## 14.6 UserStoryStripOnPDP

Desteklenen state’ler:

* loading
* ready
* empty
* degraded

Net kural:
PDP’de fenomen mağaza story akışı bulunmaz; yalnız kullanıcı story şeridi bulunur. 

---

## 15. Follow / post component aileleri

## 15.1 FollowPageHeader

Desteklenen state’ler:

* default
* empty-following
* loading

## 15.2 FollowedStoresQuickAccess

Desteklenen state’ler:

* default
* loading
* empty

## 15.3 FollowFeed

Desteklenen state’ler:

* default
* loading
* empty
* continue-loading

Net kural:
Takip sayfasında story şeridi ve kategori şeridi bulunmaz. Ana içerik fenomen mağaza post akışıdır. 

---

## 16. Cart / checkout / payment component aileleri

## 16.1 CartLineItem

Desteklenen state’ler:

* default
* quantity-updating
* availability-warning
* removed
* checkout-blocked

## 16.2 AddressCard

Desteklenen state’ler:

* selected
* unselected
* invalid
* guest-one-time-address
* loading

## 16.3 CheckoutSection

Desteklenen state’ler:

* loading
* ready
* invalid
* blocked
* degraded

## 16.4 PaymentStatusBlock

Desteklenen state’ler:

* initiating
* pending-provider
* failed
* cancelled
* success-visible
* unknown-result

## 16.5 PaymentMethodSelector

Desteklenen state’ler:

* default
* selected
* unavailable
* blocked

---

## 17. Order / tracking / support component aileleri

## 17.1 OrderLineItem

Desteklenen state’ler:

* default
* partial-cancelled
* return-in-progress
* returned

## 17.2 PackageCard

Desteklenen state’ler:

* preparing
* shipped
* moving
* delivered
* delayed
* problem

## 17.3 TrackingTimeline

Desteklenen state’ler:

* normal-progress
* delayed
* problem
* completed
* partial-delivered

## 17.4 NotificationItem

Desteklenen state’ler:

* unread
* read
* priority-high
* grouped-social-signal

## 17.5 SupportEntryCard

Desteklenen state’ler:

* default
* topic-selected
* self-service-match
* escalated-to-ticket
* guest-order-context

---

## 18. Table / list / filter panel component aileleri

## 18.1 DataTable

Kullanım:

* admin
* supplier
* ops
* support

Desteklenen state’ler:

* loading
* empty
* row-selected
* sorted
* filtered
* degraded

## 18.2 FilterBar

Desteklenen state’ler:

* default
* active-filters
* loading-options
* blocked-filter

## 18.3 ActionMenu

Desteklenen state’ler:

* default
* open
* action-blocked
* permission-hidden

## 18.4 QueueCard / KPIBlock

Desteklenen state’ler:

* default
* loading
* warning
* escalation
* empty
* degraded

---

## 19. Guest ve auth bağlamı

### 19.1 Genel kural

Guest commerce açık olabilir.
Ama guest user ile auth user aynı component erişim setine sahip değildir.

### 19.2 Context duyarlı component’ler

Aşağıdaki component’ler guest/auth bağlamına duyarlı olmalıdır:

* InteractionBar
* ReviewSummaryBlock
* QuestionAnswerBlock
* AddressCard
* PaymentStatusBlock
* SupportEntryCard

### 19.3 Örnek

* guest user ödeme yapabilir
* ama review CTA eligibility closed olabilir
* guest order support açık olabilir
* social write component’leri login gate gösterebilir

---

## 20. Block / degraded / pending davranış özel notları

### 20.1 Blocked

Component, neden görünür kılabiliyorsa helper text / inline message / badge ile bunu taşır.

### 20.2 Degraded

Component mümkün olan güvenli veriyi göstermeye devam eder; sahte tamlık üretmez.

### 20.3 Pending

Accepted ama tamamlanmamış aksiyonlar için component geçici ara state taşır.

Özellikle:

* payment
* return request
* moderation review
* panel protected action

### 20.4 Conflict

Stale veri veya invalid transition durumunda component refresh / retry / uyarı davranışı taşır.

---

## 21. Figma ve kod karşılığı

Bu dosyada tanımlanan component aileleri şu katmanlara bağlanacaktır:

* Figma component sets
* Variant matrisi
* Web component library
* Mobil component library
* Panel UI kit

Net kural:
Component adı, Figma variant adı ve geliştirme tarafındaki bileşen adı mümkün olduğunca aynı semantic aileyi taşımalıdır.

---

## 22. İlk faz için minimum component-state teslimi

İlk fazda minimum kapanması gereken component aileleri:

* Header
* BottomNavigation
* SearchInput
* Button
* Badge / InlineMessage / EmptyState / Skeleton
* ClassicProductCard
* VideoProductCard
* StoreCard
* StoryRing / StoryStrip / StoryViewer
* PostCard
* MediaGallery / BuyBox / InteractionBar
* CartLineItem / AddressCard / CheckoutSection / PaymentStatusBlock
* OrderLineItem / PackageCard / TrackingTimeline / NotificationItem / SupportEntryCard
* DataTable / FilterBar / ActionMenu / KPIBlock

---

## 23. Kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* component aileleri ekran kapsamına göre listelenmişse,
* ortak state sözlüğü component seviyesine indirilmişse,
* storefront, sosyal, commerce ve panel component’leri ayrıştırılmışsa,
* story / video / follow / post / favorites-saved yüzeyleri açıkça işlenmişse,
* blocked / degraded / pending / conflict davranışları görünür kılınmışsa,
* guest vs auth context etkisi gereken yerlerde işlenmişse,
* Figma ve geliştirme tarafına aktarılabilir isimlendirme omurgası oluşmuşsa.
