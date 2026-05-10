# FIGMA_LINKS

## 1. Amaç

Bu dosya, Aşama 9 kapsamında Figma üretimi ve tasarım handoff’u için sayfa, frame, component ve link haritasını tanımlar.

Bu aşamada gerçek Figma linkleri henüz olmayabilir.
Bu durumda bu dosya:

* hangi Figma sayfalarının açılacağını,
* hangi ekran ailelerinin hangi sayfada çalışılacağını,
* hangi frame varyantlarının zorunlu olduğunu,
* hangi component set’lerinin tasarlanacağını,
* gerçek linkler oluştuğunda bunların nereye işleneceğini

önceden planlayan master referans dosyası olarak çalışır.

Net kural:

* Bu dosya boş link placeholder listesi değildir.
* Bu dosya, Figma üretimini sistematik yürütmek için ana haritadır.
* Frame planı ekran sözleşmeleriyle çelişemez.

---

## 2. Kaynak dosyalar

Bu plan aşağıdaki kaynakların üstünde çalışır:

* `aşama-8/SCREEN_CONTRACTS_REFINED.md`
* `aşama-8/PANEL_CONTRACTS.md`
* `aşama-8/DTO_RESPONSE_CATALOG.md`
* `aşama-8/STATEFUL_UI_BEHAVIOR_GUIDE.md`
* `DESIGN_TOKEN_GUIDE.md`
* `COMPONENT_STATE_GUIDE.md`
* `DEV_HANDOFF_PACK.md`

Ek ekran/yüzey doğrulama kaynakları:

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

---

## 3. Figma dosya yapısı

Figma dosyası açıldığında minimum şu sayfa yapısı kullanılmalıdır:

1. Cover / Index
2. Foundations
3. Storefront Mobile
4. Storefront Web
5. Social / Content
6. Commerce Flows
7. Post-Order / Support
8. Panels
9. Components
10. States
11. Handoff / Specs

Net kural:

* Storefront, sosyal, commerce, post-order ve panel sayfaları birbirine karışmamalıdır.
* Mobile ve web frame’leri aynı sayfada tutulacaksa isimlendirme ile kesin ayrım korunmalıdır.

---

## 4. Cover / Index

Bu sayfada bulunmalıdır:

* proje adı
* sürüm
* son güncelleme tarihi
* kapsam özeti
* sayfa navigasyon haritası
* mobil / web / panel legend’i
* gerçek Figma ana link alanı

Alanlar:

* Main Figma file link:
* Design system file link:
* Prototype file link:

---

## 5. Foundations

Bu sayfa `DESIGN_TOKEN_GUIDE.md` dosyasının görsel karşılığıdır.

### Açılacak frame grupları

* Brand Colors
* Surface / Text / Border Colors
* Feedback / State Colors
* Commerce Emphasis Colors
* Social Surface Colors
* Typography Scale
* Spacing Scale
* Radius / Border / Shadow
* Breakpoint Notes
* Motion / Layer Notes

### Link alanları

* Foundations page link:
* Token library link:

---

## 6. Storefront Mobile

Bu sayfa mobil storefront çekirdek ekranlarını içerir.

### Açılacak ana frame aileleri

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Fenomen Mağaza Sayfası
* Takip Sayfası
* Beğenilenler
* Kaydedilenler

### Her ekran için minimum varyant seti

* default
* loading
* empty gerekiyorsa
* blocked / degraded gerekiyorsa
* kritik state varyantları

### Link alanları

* Home mobile link:
* Discover mobile link:
* Search mobile link:
* PLP mobile link:
* PDP mobile link:
* Store page mobile link:
* Follow page mobile link:
* Favorites mobile link:
* Saved mobile link:

---

## 7. Storefront Web

Bu sayfa web storefront çekirdek ekranlarını içerir.

### Açılacak ana frame aileleri

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Fenomen Mağaza Sayfası
* Takip Sayfası
* Beğenilenler
* Kaydedilenler

### Her ekran için minimum varyant seti

* default
* loading
* empty gerekiyorsa
* degraded gerekiyorsa
* responsive adaptation notes

### Link alanları

* Home web link:
* Discover web link:
* Search web link:
* PLP web link:
* PDP web link:
* Store page web link:
* Follow page web link:
* Favorites web link:
* Saved web link:

---

## 8. Social / Content

Bu sayfa story, video ve post yüzeylerini ayrı ve net ele alır.

### Açılacak frame aileleri

* Story Strip
* Story Viewer
* Kullanıcı Story Şeridi
* Video Product Card Expanded View
* Video Viewer / Fullscreen View
* Post Feed
* Post Card
* Review Summary Surface
* Question / Answer Surface
* Interaction Overlay States

### Story için zorunlu ayrımlar

Story sistemi üç ana tür içerir:

* fenomen mağaza tanıtım story’si
* fenomen mağaza ürün tanıtım story’si
* kullanıcı ürün story’si

Bu türler tek frame içinde karıştırılmamalıdır.

### Story frame zorunlulukları

* Home story strip
* Discover story strip
* Store profile story strip
* PDP user story strip
* Story viewer / mobile full screen
* Story viewer / web modal

### Video için zorunlu ayrımlar

Videolu ürün kart:

* story değildir
* mağaza-bağlamlı satış yüzeyidir
* açıldığı bağlam dışına taşmamalıdır

Bu yüzden ayrı frame’ler gerekir:

* Home video card context
* Discover video card context
* Store page video card context
* Category video card context
* Expanded video card view
* Mini PDP inside video card

### Post için zorunlu ayrımlar

* Takip akışı post kartı
* Mağaza içi post görünümü
* empty follow feed
* lightweight interaction state

### Minimum varyantlar

* default
* media loading
* media degraded
* empty
* moderated / hidden
* login-required interaction

### Link alanları

* Story surfaces link:
* Video surfaces link:
* Post surfaces link:
* Review / QA surfaces link:

---

## 9. Commerce Flows

Bu sayfa commerce akışını içerir.

### Açılacak frame aileleri

* Sepet
* Checkout
* Ödeme

### Sepet minimum frame’leri

* Cart / Mobile / Default
* Cart / Mobile / Loading
* Cart / Mobile / LineWarning
* Cart / Mobile / Empty
* Cart / Mobile / CheckoutBlocked
* Cart / Web / Default

### Checkout minimum frame’leri

* Checkout / Mobile / Default
* Checkout / Mobile / Reviewing
* Checkout / Mobile / Invalid
* Checkout / Mobile / ReadyForPayment
* Checkout / Mobile / Expired
* Checkout / Mobile / GuestAddressMode
* Checkout / Mobile / GuestReadyForPayment
* Checkout / Web / Default

### Ödeme minimum frame’leri

* Payment / Mobile / Default
* Payment / Mobile / Initiating
* Payment / Mobile / PendingProvider
* Payment / Mobile / Failed
* Payment / Mobile / UnknownResult
* Payment / Mobile / SuccessVisible
* Payment / Mobile / GuestActor
* Payment / Web / Default

### Link alanları

* Cart flow link:
* Checkout flow link:
* Payment flow link:

---

## 10. Post-Order / Support

Bu sayfa sipariş sonrası yüzeyleri içerir.

### Açılacak frame aileleri

* Sipariş Detay
* Sipariş Takip
* İptal / İade Başlangıç
* Bildirim Merkezi
* Destek Girişi

### Minimum frame varyantları

* default
* loading gerekiyorsa
* partial states
* delayed / problem
* empty notifications
* support topic selection
* self-service match
* escalate to ticket
* guest order support path

### Link alanları

* Order detail link:
* Tracking link:
* Cancel / Return entry link:
* Notification center link:
* Support entry link:

---

## 11. Panels

Bu sayfa panel yüzeylerini içerir.

### Açılacak frame aileleri

* Admin Dashboard
* Fenomen Paneli
* Tedarikçi Paneli
* Sipariş Operasyon Paneli
* Destek Ticket Operasyon Paneli

### Minimum frame varyantları

* default dashboard
* loading dashboard
* empty queue
* warning / escalation
* blocked action
* permission denied
* invalid transition / conflict
* table + filter + row action

### Link alanları

* Admin panel link:
* Creator panel link:
* Supplier panel link:
* Order ops panel link:
* Support ops panel link:

---

## 12. Components

Bu sayfa `COMPONENT_STATE_GUIDE.md` dosyasının Figma karşılığıdır.

### Açılacak component set aileleri

* Buttons
* Inputs
* Search inputs
* Select / dropdowns
* Badges / tags
* Inline messages
* Toasts
* Empty states
* Skeletons
* Classic product cards
* Video product cards
* Store cards
* Post cards
* Story rings
* Story viewer controls
* Media gallery blocks
* Buy box family
* Interaction bar
* Cart line items
* Address cards
* Checkout sections
* Payment status blocks
* Order line items
* Package cards
* Tracking timeline
* Notification items
* Support entry cards
* Data tables
* Filter bars
* Action menus
* KPI blocks

### Link alanları

* Component library link:
* Variant map link:

---

## 13. States

Bu sayfa ortak state galerisi olarak çalışır.

### Açılacak frame aileleri

* loading
* empty
* blocked
* degraded
* pending
* conflict
* success
* error

### Not

Bu sayfa component bazlı değil, state örnekleme sayfasıdır.
Ama component varyantlarıyla çelişemez.

### Link alanları

* State gallery link:

---

## 14. Handoff / Specs

Bu sayfa geliştirici teslimini destekler.

### Açılacak frame aileleri

* spacing annotations
* redline examples
* responsive notes
* token usage notes
* component usage do / don’t
* guest vs auth behavior
* accepted vs completed
* captured vs order_created
* blocked / degraded visual treatment

### Link alanları

* Handoff specs link:

---

## 15. Ana Sayfa frame planı

Ana sayfa sistemi dosyasına göre web ve mobil ayrı ele alınmalıdır.

### Web header zorunlu içerik

* marka / logo
* arama kutusu
* giriş
* beğen
* kaydet
* keşfet
* sepet
* bildirim

### Mobil header zorunlu içerik

* marka / logo
* arama kutusu
* bildirim

### Mobil alt navigasyon zorunlu içerik

* ana sayfa
* giriş
* takip
* keşfet
* sepet

### Home minimum frame listesi

* `Home / Mobile / Default`
* `Home / Mobile / Loading`
* `Home / Mobile / HeroBlockDegraded`
* `Home / Mobile / ProductBlockDegraded`
* `Home / Mobile / StoryStripPartial`
* `Home / Mobile / EmptyBlockExample`
* `Home Header / Mobile / Default`
* `Bottom Nav / Mobile / Default`
* `Bottom Nav / Mobile / LoggedOut`
* `Bottom Nav / Mobile / LoggedIn`
* `Home / Web / Default`
* `Home / Web / Loading`
* `Home / Web / HeroBlockDegraded`
* `Home / Web / ProductBlockDegraded`
* `Home Header / Web / Default`
* `Home Header / Web / LoggedOut`
* `Home Header / Web / LoggedIn`

### Home blok sırası

#### Web

* Sticky Header
* İnce Kategori Şeridi
* Fenomen Mağaza Tanıtım Story Şeridi
* Promo / Vitrin Bandı
* Videolu Ürün Kart Akışı
* Trend Klasik Ürünler
* Yeni Gelenler
* Kategori Seçkisi
* Fiyat Avantaj / Kampanya
* Öne Çıkan Mağazalar
* Sosyal Kanıt
* Güven Bandı
* Footer

#### Mobil

* Mobil Header
* Mobil Alt Navigasyon
* Kategori Şeridi
* Fenomen Mağaza Tanıtım Story Şeridi
* Promo / Vitrin Alanı
* Videolu Ürün Kart Akışı
* Trend Klasik Ürünler
* Yeni Gelenler
* Kategori Seçkisi
* Fiyat Avantaj Bloğu
* Öne Çıkan Mağazalar
* Sosyal Kanıt
* Güven Bandı
* Alt Bilgi / Footer

---

## 16. Keşfet frame planı

Keşfet, yeni karşılaşma yüzeyidir.
Üst story şeridinde yalnız fenomen mağaza tanıtım story’leri bulunur.

### Minimum frame listesi

* `Discover / Mobile / Default`
* `Discover / Mobile / Loading`
* `Discover / Mobile / StoryStripLoading`
* `Discover / Mobile / FeedDegraded`
* `Discover / Mobile / Empty`
* `Discover / Web / Default`
* `Discover / Web / Loading`

### Zorunlu öğeler

* üst story şeridi
* video ağırlıklı ürün kart akışı
* sınırlı klasik kart desteği
* hafif interaction overlay

Net kural:
Fenomen mağaza ürün tanıtım story’leri keşfet üst şeridine alınmaz.

---

## 17. Arama frame planı

Arama tek kutu olabilir ama tek mod değildir.

### Minimum frame listesi

* `Search / Mobile / EmptyQuery`
* `Search / Mobile / Suggestions`
* `Search / Mobile / Results`
* `Search / Mobile / NoResult`
* `Search / Mobile / Degraded`
* `Search / Web / Results`

### Zorunlu mod ayrımları

* platform
* discover
* catalog
* store

---

## 18. PLP frame planı

### Minimum frame listesi

* `PLP / Mobile / Default`
* `PLP / Mobile / FilterLoading`
* `PLP / Mobile / ActiveFilters`
* `PLP / Mobile / EmptyResult`
* `PLP / Mobile / FacetDegraded`
* `PLP / Web / Default`

### Zorunlu öğeler

* breadcrumb
* category identity
* sort
* filters
* product list
* destekleyici video row gerekiyorsa hafif

---

## 19. PDP frame planı

### Minimum frame listesi

* `PDP / Mobile / Default`
* `PDP / Mobile / Loading`
* `PDP / Mobile / VariantRequired`
* `PDP / Mobile / LowStock`
* `PDP / Mobile / OutOfStock`
* `PDP / Mobile / SocialDegraded`
* `PDP / Mobile / LoginRequiredInteraction`
* `PDP / Mobile / EligibilityClosed`
* `PDP / Web / Default`

### Zorunlu öğeler

* media gallery
* product info
* buy box
* store context
* review summary
* QA summary
* user story strip

Net kural:
PDP’de fenomen mağaza story akışı bulunmaz; yalnız kullanıcı story şeridi bulunur.

---

## 20. Fenomen Mağaza frame planı

### Minimum frame listesi

* `Store Page / Mobile / Default`
* `Store Page / Mobile / Loading`
* `Store Page / Mobile / StoryPresent`
* `Store Page / Mobile / ProductStoryPresent`
* `Store Page / Web / Default`

### Zorunlu öğeler

* mağaza kimliği
* takip
* mağaza ürün akışı
* mağaza story alanı
* gerekirse mağaza içi post görünümü
* video/classic kart karışık vitrin

---

## 21. Takip ve Post frame planı

Takip sayfası yalnız takip edilen fenomen mağazaların post akışıdır.
Story şeridi ve kategori şeridi bulunmaz.

### Minimum frame listesi

* `Follow / Mobile / Default`
* `Follow / Mobile / Empty`
* `Follow / Mobile / Loading`
* `Follow / Mobile / StoreQuickAccess`
* `Follow / Web / Default`
* `Post Card / Default`
* `Post Card / ProductLinked`
* `Post Card / Campaign`
* `Post Card / Announcement`

### Zorunlu öğeler

* sayfa başlığı
* kısa durum satırı
* takip edilen mağazalar hızlı erişim alanı
* takip akışı
* hafif etkileşimler: beğen / kaydet / paylaş

Net kural:

* yorum yok
* görünür tartışma yok
* story yok
* keşfet benzeri feed davranışı yok

---

## 22. Beğenilenler / Kaydedilenler frame planı

### Minimum frame listesi

* `Favorites / Mobile / Default`
* `Favorites / Mobile / Empty`
* `Saved / Mobile / Default`
* `Saved / Mobile / Empty`
* `Favorites / Web / Default`
* `Saved / Web / Default`

### Zorunlu öğeler

* liste/grid görünümü
* product card / store card gerekiyorsa ayrım
* empty-state CTA
* remove / manage davranışı gerekiyorsa hafif

---

## 23. Guest checkout özel notu

Aşağıdaki frame’ler zorunludur:

* `Checkout / Mobile / GuestAddressMode`
* `Checkout / Mobile / GuestReadyForPayment`
* `Payment / Mobile / GuestActor`
* `Order Detail / Mobile / GuestOrderContext`
* `Support Entry / Mobile / GuestOrderSupport`

Net kural:
Guest commerce açık olabilir; ama social eligibility açılmış gibi frame üretilmez.

---

## 24. Frame adlandırma standardı

Önerilen format:
`[Surface] / [Platform] / [Variant]`

Örnek:

* `PDP / Mobile / Default`
* `Checkout / Mobile / GuestReadyForPayment`
* `Payment / Mobile / UnknownResult`
* `Follow / Mobile / Empty`
* `Story Viewer / Web / Modal`
* `Admin Dashboard / Web / EmptyQueue`

Net kural:
Frame adı yüzey + platform + state/variant bilgisini taşımalıdır.

---

## 25. Component set adlandırma standardı

Önerilen format:
`[Component Family] / [Variant Group] / [State]`

Örnek:

* `Button / Primary / Loading`
* `Product Card / Video / Default`
* `Story Ring / Seen / Default`
* `Payment Status / UnknownResult / Visible`
* `Post Card / ProductLinked / Default`

---

## 26. Figma üretim sırası

Gerçek üretim sırası:

1. Foundations
2. Components
3. States
4. Storefront Mobile
5. Social / Content
6. Commerce Flows
7. Post-Order / Support
8. Storefront Web
9. Panels
10. Handoff / Specs

Net kural:
Token ve component omurgası oturmadan ekran çizimine girilmez.

---

## 27. İlk faz için minimum frame teslim listesi

İlk fazda minimum tamamlanması gerekenler:

* Home mobile
* Discover mobile
* Search mobile
* PLP mobile
* PDP mobile
* Store page mobile
* Follow mobile
* Cart mobile
* Checkout mobile
* Payment mobile
* Order detail mobile
* Tracking mobile
* Notification mobile
* Support entry mobile
* Admin dashboard web
* Creator panel web
* Supplier panel web
* Order ops web
* Support ops web
* Component library first set
* State gallery first set

---

## 28. Link işleme kuralı

Gerçek Figma linkleri oluştuğunda bu dosyada:

* sayfa bazlı linkler
* frame bazlı kritik linkler
* component library linki
* state gallery linki
* handoff specs linki

ayrı ayrı işlenmelidir.

Net kural:
Tek genel Figma linki yeterli sayılmaz.

---

## 29. Kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* Figma sayfa yapısı tanımlanmışsa,
* storefront, sosyal, commerce, post-order ve panel frame listeleri çıkarılmışsa,
* component ve state sayfa planı yazılmışsa,
* frame naming standardı sabitlenmişse,
* guest checkout, story/video bağlam koruma ve takip/post ayrımları tasarıma dahil edilmişse,
* gerçek linkler gelmediğinde bile üretim planı olarak kullanılabilir durumdaysa.
