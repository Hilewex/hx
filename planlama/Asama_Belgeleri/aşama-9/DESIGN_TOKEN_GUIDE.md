# DESIGN_TOKEN_GUIDE

## 1. Amaç

Bu dosya, Aşama 9 kapsamında platformun tasarım token omurgasını sabitler.

Bu dosyanın amacı:

* storefront, sosyal yüzeyler, commerce yüzeyleri ve panel yüzeyleri için ortak tasarım dilini kurmak,
* renk, tipografi, spacing, radius, border, shadow, motion, layer ve breakpoint kararlarını normalize etmek,
* Figma, component library ve developer handoff başlamadan önce ortak görsel sözlüğü sabitlemek,
* Aşama 8’de kapanan ekran/panel/DTO/state sözleşmelerini görsel sistem düzeyine taşımaktır.

Net kural:

* Token ekrana özel hardcode değer değildir.
* Token tekrar kullanılabilir tasarım primitive’idir.
* Aynı semantic token storefront, sosyal yüzey ve panel tarafında farklı yoğunlukla kullanılabilir; ama isimlendirme ve sistem mantığı ortak kalmalıdır.

---

## 2. Kapsam

Bu dosya aşağıdaki tüm yüzey ailelerini kapsar.

### 2.1 Storefront çekirdek yüzeyleri

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Fenomen Mağaza Sayfası
* Takip Sayfası
* Beğenilenler Sayfası
* Kaydedilenler Sayfası

### 2.2 Sosyal ve içerik yüzeyleri

* Story strip
* Story viewer
* Video product card experience
* Expanded video / fullscreen video experience
* Post yüzeyleri
* PDP içi kullanıcı story alanı
* PDP içi yorum / puan sunum alanı
* PDP içi soru / cevap sunum alanı

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
* Fenomen Mağaza Yönetim Paneli
* Tedarikçi Paneli
* Sipariş Operasyon Paneli
* Destek Ticket Operasyon Paneli

### 2.6 Platform düzeyi

* Web
* Mobil uygulama
* Ortak component library

Net kural:
Bu dosya yalnız çekirdek commerce ekranlarını değil, sosyal-commerce platformun tüm görünür yüzey ailelerini kapsar.

---

## 3. Tasarım ilkeleri

### 3.1 Mobile-first, web-parallel

Tasarım dili mobil öncelikli kurulur; web sürümü aynı omurganın daha geniş, daha paralel ve daha çok bilgi taşıyan uyarlamasıdır.

### 3.2 Sosyal-commerce dengesi

Platform yalnız katalog veya yalnız sosyal akış ürünü değildir.
Bu nedenle token sistemi:

* keşif ve içerik yüzeylerinde canlılık,
* commerce yüzeylerinde netlik,
* panel yüzeylerinde operasyonel okunabilirlik
  üretmelidir.

### 3.3 Storefront ve panel aynı ürün ailesidir

Storefront daha görsel ve akışkan olabilir.
Panel daha veri yoğun ve kontrollü olabilir.
Ama ikisi iki ayrı ürün gibi davranmaz; aynı tasarım sisteminin iki kullanım profilidir.

### 3.4 Primitive önce, semantic sonra

Önce primitive token seti tanımlanır:

* ham spacing
* ham radius
* ham font size
* ham shadow
* ham motion

Sonra semantic token katmanı kurulur:

* `color-surface-base`
* `color-text-primary`
* `color-action-primary`
* `color-state-warning`

### 3.5 State yalnız renkle anlatılmaz

Loading, blocked, degraded, pending, conflict, success, error gibi durumlar yalnız renk üzerinden kurulmaz.
Gerektiğinde şu araçlar birlikte kullanılır:

* tone
* border
* icon
* badge
* helper text
* elevation
* placeholder / skeleton

---

## 4. Token katman modeli

Bu tasarım sistemi 3 katmanla çalışır.

### 4.1 Primitive tokens

Ham ölçü ve stil primitive’leri.

Örnek aileler:

* `space-*`
* `radius-*`
* `font-size-*`
* `shadow-*`
* `motion-*`

### 4.2 Semantic tokens

Primitive’lerin anlamlı kullanım eşleşmeleri.

Örnekler:

* `color-text-primary`
* `color-surface-elevated`
* `color-border-subtle`
* `color-action-danger`

### 4.3 Component tokens

Belirli component ailesine özel türetilmiş token’lar.

Örnekler:

* `button-primary-bg`
* `product-card-radius`
* `story-ring-active`
* `table-row-hover-bg`
* `sheet-header-padding`

Net kural:
Tasarımda ve kodda mümkün olduğunca semantic token katmanı referans alınmalıdır.

---

## 5. Renk sistemi

## 5.1 Amaç

Renk sistemi şu ihtiyaçlara hizmet eder:

* marka kimliği
* eylem önceliği
* okunabilirlik
* state ayrımı
* ticari dikkat yönetimi
* sosyal canlılık hissi
* panelde operasyonel netlik

## 5.2 Renk aileleri

En az şu semantic aileler bulunmalıdır.

### Brand

* `color-brand-primary`
* `color-brand-secondary`
* `color-brand-accent`

### Surface

* `color-surface-base`
* `color-surface-elevated`
* `color-surface-muted`
* `color-surface-overlay`
* `color-surface-inverse`

### Text

* `color-text-primary`
* `color-text-secondary`
* `color-text-muted`
* `color-text-inverse`
* `color-text-link`

### Border

* `color-border-subtle`
* `color-border-default`
* `color-border-strong`
* `color-border-focus`

### Action

* `color-action-primary`
* `color-action-primary-hover`
* `color-action-secondary`
* `color-action-secondary-hover`
* `color-action-danger`
* `color-action-disabled`

### Commerce emphasis

* `color-price-current`
* `color-price-previous`
* `color-discount-badge`
* `color-campaign-highlight`
* `color-stock-warning`

### Feedback / State

* `color-state-success`
* `color-state-warning`
* `color-state-error`
* `color-state-info`
* `color-state-pending`
* `color-state-blocked`
* `color-state-degraded`
* `color-state-conflict`

## 5.3 Storefront renk davranışı

Storefront tarafında:

* brand ve commerce vurgusu daha görünür olabilir
* kampanya ve dikkat rengi kontrollü ama canlı kullanılabilir
* keşif ve sosyal yüzeylerde aksiyonlar daha sıcak görünebilir
* okunabilirlik kontrastı korunur

## 5.4 Sosyal yüzey renk davranışı

Story, video, post, beğeni/kaydet yüzeylerinde:

* medya ile çakışmayacak arayüz tonları gerekir
* overlay ve action contrast çok kritik olur
* story active / seen / unseen ayrımı semantic olmalıdır

## 5.5 Panel renk davranışı

Panel tarafında:

* veri okunabilirliği önceliklidir
* escalation, blocked, delayed, risk, warning state’leri net semantic renkle ayrılır
* kampanya/commerce vurgusu storefront kadar baskın olmaz

## 5.6 Yasaklar

* Her yüzeye ayrı renk sistemi kurmak
* Aynı state’i farklı sayfalarda farklı ana renkle anlatmak
* Sadece renkle kritik durumu anlatmak

---

## 6. Tipografi sistemi

## 6.1 Amaç

Tipografi sistemi şu ihtiyaçları karşılamalıdır:

* mobilde hızlı okunabilirlik
* storefront’ta görsel hiyerarşi
* panelde veri netliği
* uzun form ve kısa etiket arasında denge

## 6.2 Tipografi rolleri

En az şu semantic roller bulunmalıdır:

* `type-display`
* `type-heading-1`
* `type-heading-2`
* `type-heading-3`
* `type-title`
* `type-body`
* `type-body-small`
* `type-label`
* `type-caption`
* `type-overline`
* `type-mono-data` (opsiyonel)

## 6.3 Kullanım mantığı

### Storefront

* headline ve CTA alanlarında belirgin hiyerarşi
* PDP, checkout ve ödeme yüzeylerinde sade okunabilirlik
* kampanya / fiyat / uyarı etiketlerinde vurucu ama kontrollü tip kullanımı

### Sosyal yüzeyler

* story ve video overlay alanlarında kısa ve yüksek kontrastlı tip kullanılır
* post ve takip akışında içerik okunabilirliği önceliklidir

### Panel

* tablo, filtre, statü etiketi ve veri okuma önceliği
* yoğun veri alanlarında aşırı büyük başlık kullanılmaz

## 6.4 Yasaklar

* Aynı seviyede fazla farklı font size kullanmak
* Storefront ile panel için tamamen ayrı tipografi dili kurmak

---

## 7. Spacing sistemi

## 7.1 Amaç

Spacing sistemi layout ve component ritmini standardize eder.

## 7.2 Primitive aile

* `space-0`
* `space-2`
* `space-4`
* `space-8`
* `space-12`
* `space-16`
* `space-20`
* `space-24`
* `space-32`
* `space-40`
* `space-48`
* `space-64`

## 7.3 Semantic türevler

* `space-screen-horizontal`
* `space-screen-vertical`
* `space-card-padding`
* `space-section-gap`
* `space-list-row-gap`
* `space-form-group-gap`
* `space-table-cell-padding`

## 7.4 Kullanım mantığı

Mobilde daha sıkı ama boğmayan ritim gerekir.
Web’de aynı component daha geniş nefes alabilir.
Panelde veri yoğunluğu artabilir ama spacing disiplini kaybolmaz.

---

## 8. Radius sistemi

## 8.1 Amaç

Radius sistemi markanın görsel karakterini ve component tonunu belirler.

## 8.2 Primitive aile

* `radius-none`
* `radius-xs`
* `radius-sm`
* `radius-md`
* `radius-lg`
* `radius-xl`
* `radius-pill`
* `radius-full`

## 8.3 Kullanım mantığı

### Storefront

* kart, medya, CTA, drawer, sheet yüzeylerinde daha yumuşak radius kullanılabilir

### Sosyal yüzeyler

* story, avatar, medya overlay ve reaction yüzeyleri daha organik hissedebilir

### Panel

* tablo, input ve operasyon kutularında daha kontrollü radius kullanılır

Net kural:
Storefront çok yuvarlak, panel çok sert iki ayrı ürün hissi üretmemelidir.

---

## 9. Border ve divider sistemi

## 9.1 Semantic border ailesi

* `border-subtle`
* `border-default`
* `border-strong`
* `border-focus`
* `border-error`
* `border-warning`

## 9.2 Kullanım mantığı

* kart ayrımı
* input state ayrımı
* tablo satır ayırıcıları
* overlay / sheet sınırları
* post / yorum / sipariş satırı ayrımları

---

## 10. Shadow ve elevation sistemi

## 10.1 Amaç

Shadow sistemi derinlik hissi verir ama kirli ve ağır arayüz üretmemelidir.

## 10.2 Primitive aile

* `shadow-none`
* `shadow-xs`
* `shadow-sm`
* `shadow-md`
* `shadow-lg`
* `shadow-overlay`

## 10.3 Kullanım mantığı

* storefront kartları hafif elevation ile ayrılabilir
* modal, drawer, sheet ve floating action elemanları overlay elevation alır
* panelde aşırı shadow yerine border + düzen önceliklidir

---

## 11. Icon sistemi

## 11.1 Amaç

İkonlar dekorasyon değil; navigation, action ve state taşıyıcısıdır.

## 11.2 Kullanım mantığı

* storefront’ta aksiyon ve gezinme ikonları görünür olabilir
* sosyal yüzeylerde medya/action ikonları kritik rol oynar
* panelde ikon kullanımında semantik netlik ve operasyonel anlam önceliklidir
* aynı anlam farklı ikonlarla anlatılmaz

## 11.3 Primitive aile

* `icon-size-xs`
* `icon-size-sm`
* `icon-size-md`
* `icon-size-lg`
* `icon-stroke-default`
* `icon-stroke-strong`

---

## 12. Breakpoint sistemi

## 12.1 Amaç

Responsive davranışın rastgele değil sistematik olmasını sağlamak.

## 12.2 Breakpoint ailesi

* `mobile`
* `mobile-large`
* `tablet`
* `desktop`
* `desktop-wide`

## 12.3 Davranış ilkesi

* mobil tek kolon önceliklidir
* tablet ara geçiş yüzeyidir
* web’de ikinci kolon, sabit sidebar, paralel panel alanı açılabilir

Net kural:
Responsive tasarım yalnız küçültme/büyütme değildir; bilgi öncelikleri breakpoint’e göre yeniden düzenlenir.

---

## 13. Motion / transition sistemi

## 13.1 Amaç

UI hareketlerinin abartısız ama tutarlı olmasını sağlamak.

## 13.2 Primitive aile

* `motion-fast`
* `motion-default`
* `motion-slow`
* `easing-standard`
* `easing-emphasized`

## 13.3 Kullanım mantığı

* interaction feedback hızlı olmalı
* modal/drawer/sheet geçişleri yumuşak ama ağır olmayan tonda olmalı
* story/video yüzeylerinde hareket dikkat dağıtıcı olmamalı
* panelde gereksiz hareket yükü kullanılmamalı

---

## 14. Z-index / layer sistemi

## 14.1 Amaç

Overlay ve navigation katmanlarının rastgele çakışmasını önlemek.

## 14.2 Katman ailesi

* `layer-base-content`
* `layer-sticky-header`
* `layer-dropdown-popover`
* `layer-sheet-drawer`
* `layer-modal`
* `layer-toast-notification`
* `layer-global-blocker`
* `layer-media-overlay`

Net kural:
Z-index sayıları ezberden değil, katman adıyla yönetilmelidir.

---

## 15. State token yaklaşımı

Bu bölüm Aşama 8’de tanımlanan UI state davranışını görsel sisteme bağlar.

## 15.1 Desteklenecek ana state aileleri

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

## 15.2 Görsel anlatım ilkesi

State yalnız renkle anlatılmaz.
Aşağıdaki araçların kombinasyonu kullanılır:

* color tone
* border
* icon
* badge / tag
* helper text
* skeleton / placeholder
* button enable/disable davranışı
* overlay yoğunluğu

## 15.3 Kritik state odakları

Aşağıdaki state’ler özellikle semantic token seviyesinde görünür olmalıdır:

* `blocked`
* `degraded`
* `pending`
* `conflict`

---

## 16. Commerce token yaklaşımı

Commerce yüzeylerinde aşağıdaki semantic ihtiyaçlar özel önem taşır:

* fiyat hiyerarşisi
* indirim / kampanya görünürlüğü
* stok uyarısı
* ödeme güven alanı
* checkout doğrulama alanı
* sipariş / takip milestone tonları

Özel semantic aileler türetilebilir:

* `commerce-price-current`
* `commerce-price-previous`
* `commerce-discount-badge`
* `commerce-stock-warning`
* `commerce-checkout-valid`
* `commerce-checkout-invalid`

---

## 17. Sosyal yüzey token yaklaşımı

Sosyal yüzeylerde aşağıdaki semantic ihtiyaçlar özel önem taşır:

* media overlay contrast
* story active / seen / unseen ayrımı
* reaction tone
* follow / save / like görünümleri
* post / story / video action cluster dengesi

Özel semantic aileler türetilebilir:

* `social-story-ring-active`
* `social-story-ring-seen`
* `social-reaction-active`
* `social-overlay-contrast`

Net kural:
Sosyal yüzey token’ları commerce token’larıyla çakışmaz; ama sistem mantığı aynı kalır.

---

## 18. Storefront ve panel token ayrım ilkesi

## 18.1 Ortak kalanlar

* spacing primitive’leri
* typography scale omurgası
* breakpoint mantığı
* action / state semantic sistemi
* border / radius / motion mantığı

## 18.2 Ayrışabilenler

* görsel yoğunluk
* kart elevation seviyesi
* kampanya / vitrin vurgusu
* data density
* tablo ve filtre ergonomisi

Net kural:
Ayrışan şey ürün değil, kullanım profili olmalıdır.

---

## 19. Light / dark mode kararı

İlk faz yaklaşımı:

* tasarım sistemi önce light mode üzerinden kurulur
* dark mode zorunlu ilk teslim değildir
* semantic token yapısı ileride dark mode’a genişletilebilir şekilde kurulmalıdır

Bu karar ilk faz karmaşıklığını kontrol altında tutar.

---

## 20. Kod ve tasarım eşleşme ilkesi

Bu dosyada tanımlanan token mantığı ileride şu katmanlara bağlanacaktır:

* Figma variables / styles
* web design tokens
* mobil theme tokens
* component library props / variants

Net kural:
Tasarım tarafındaki semantic isim ile kod tarafındaki token ailesi mümkün olduğunca aynı olmalıdır.

---

## 21. İlk faz için minimum token teslimi

Aşama 9 başlangıcında minimum olarak şu set tamamlanmalıdır:

* Brand / surface / text / border / state renk aileleri
* Commerce semantic renkleri
* Sosyal yüzey semantic renkleri
* Tipografi rolleri
* Spacing token seti
* Radius token seti
* Shadow token seti
* Breakpoint mantığı
* Z-index katmanları
* State semantic sistemi

---

## 22. Kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* kapsam listesi tüm storefront + sosyal + commerce + panel yüzeylerini kapsıyorsa,
* token katman modeli tanımlanmışsa,
* renk sistemi semantic düzeyde kurulmuşsa,
* tipografi ve spacing sistemi tanımlanmışsa,
* radius / border / shadow / breakpoint kararları yazılmışsa,
* state token yaklaşımı Aşama 8 davranış rehberiyle hizalanmışsa,
* storefront, sosyal yüzeyler ve panel arasında ortak / ayrışan çizgi netleşmişse.
s