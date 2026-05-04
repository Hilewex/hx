# S05 — STORY SİSTEMİ KAYIT DOSYASI

## 0. Teknik Olmayan Kısa Özet

Story Sistemi, platform içinde kısa görsel/video içeriklerin gösterildiği basit bir alan değildir.

Bu sistem:

- fenomen mağazayı tanıtır
- ürünleri içerik üzerinden öne çıkarır
- kullanıcı deneyimlerini sosyal kanıt olarak gösterir
- kullanıcıyı mağazaya veya PDP’ye yönlendirir
- beğen / kaydet / paylaş gibi etkileşimler üretir
- ana sayfa, keşfet, mağaza ve PDP gibi yüzeyler arasında kontrollü trafik taşır

Story sistemi foundation seviyesinde kurulmuştur.

Karar:

Foundation: PASS WITH LIMITATION  
Production readiness: PARTIAL

Bu karar, sistemin temel mimari ayrımlarının doğru kurulduğunu; ancak canlı yayın seviyesi için persistence, medya işleme, analytics ve bazı bootstrap/hardening işlerinin sonraya kaldığını gösterir.

---

## 1. Sistem Özeti

Story Sistemi üç ana story türünden oluşur:

1. Fenomen mağaza tanıtım story’si
2. Fenomen mağaza ürün tanıtım story’si
3. Kullanıcı ürün story’si

Bu üç tür aynı sistem altında yaşar ama aynı davranışı göstermez.

### 1.1 Fenomen Mağaza Tanıtım Story’si

Mağazayı, mağaza kimliğini, atmosferi ve vitrini tanıtmak için kullanılır.

Ana amacı:

- mağazaya trafik taşımak
- mağaza algısını güçlendirmek
- takip üretmek
- keşfet ve ana sayfa gibi yüzeylerde mağaza görünürlüğü sağlamaktır

Sepete ekleme veya ürün karar alanı gibi çalışmaz.

### 1.2 Fenomen Mağaza Ürün Tanıtım Story’si

Belirli bir ürünü mağaza bağlamında tanıtmak için kullanılır.

Ana amacı:

- ürüne ilgi üretmek
- kullanıcıyı mağaza bağlamlı PDP’ye taşımak
- gerektiğinde ticari aksiyon başlatmaktır

Ancak ürün, fiyat, stok veya sepet truth sahibi değildir.

### 1.3 Kullanıcı Ürün Story’si

Kullanıcının satın alıp teslim aldığı ürünü ürün etiketiyle yüklediği, moderasyon sonrası sosyal kanıt olarak kullanılan story türüdür.

Ana amacı:

- gerçek kullanıcı deneyimini görünür kılmak
- PDP ve mağaza güvenini artırmak
- teslimat sonrası kullanıcı katkısı üretmektir

Kullanıcı ürün story’si rastgele sosyal paylaşım değildir.

---

## 2. Temel Mimari Karar

Story sistemi bir truth owner değildir.

Story:

- ürün truth üretmez
- fiyat truth üretmez
- stok truth üretmez
- cart truth üretmez
- medya processing truth üretmez
- moderasyon kararı üretmez
- risk/fraud kararı üretmez
- interaction truth’u kendi içinde sahiplenmez
- PDP truth üretmez
- post yerine geçmez
- videolu ürün kart yerine geçmez

Story yalnız kendi içerik yaşam döngüsünü ve story yüzey davranışını yönetir. Diğer alanlarda ilgili owner sistemlere bağlı kalır.

---

## 3. Yüzey Kuralları

### 3.1 HOME

Ana sayfa story alanında mağaza tanıtım story’si yer alabilir.

### 3.2 DISCOVER

Keşfet yüzeyinde yalnız mağaza tanıtım story’si yer alır.

Fenomen ürün tanıtım story’si keşfet story şeridine düşmez.  
Kullanıcı ürün story’si keşfet genel akışına düşmez.

### 3.3 STOREFRONT

Mağaza profilinde:

- mağaza tanıtım story’si
- mağaza ürün tanıtım story’si

görünebilir.

### 3.4 PDP

PDP’de fenomen mağaza story akışı yer almaz.

PDP’de yalnız kullanıcı ürün story’si sosyal kanıt alanı olarak görünebilir.

### 3.5 FOLLOW / POST

Takip sayfasının ana içeriği post sistemidir. Story post yerine geçmez.

### 3.6 VIDEO PRODUCT CARD

Videolu ürün kart story değildir. Video kart ticari ürün kartıdır; story ise içerik deneyimi ve yönlendirme yüzeyidir.

---

## 4. Yapılan Paketler

### PX-STORY-00 — Story System Repo Inventory Only

Karar: Envanter tamamlandı.

Amaç:

Story sistemiyle ilgili repo’da hangi contract, service, BFF, web/panel bootstrap, smoke ve owner bağlantılarının bulunduğunu tarafsız biçimde çıkarmak.

Sonuç:

Repo’da story sistemi için şu ana alanların bulunduğu görüldü:

- story contract
- store-story contract
- ugc contract
- media contract
- moderation contract
- interaction contract
- story tray/viewer service
- store story management service
- user product story / UGC fonksiyonları
- media intake/process/visibility foundation
- moderation case foundation
- interaction like/save/share foundation
- BFF story/store-story/ugc/media/moderation/interaction route’ları
- web story/UGC/media/moderation/interaction bootstrap akışları
- panel store-story smoke dosyası
- customer contribution / reward / service smoke dosyaları

---

### PX-STORY-01 — Story System Closure Source Review & Boundary Alignment

Karar: PASS WITH LIMITATION

Amaç:

S05 Story Sistemi’nin repo’daki mevcut kod karşılığını sistem kararlarıyla uyumlu hale getirmek ve kapanış için teknik kanıt üretmek.

Yapılanlar:

- Story contract review yapıldı.
- Store story review yapıldı.
- User product story / UGC review yapıldı.
- Surface boundary review yapıldı.
- Owner boundary review yapıldı.
- BFF review yapıldı.
- Web / panel / smoke review yapıldı.
- Kod değişikliği yapılmadı; mevcut foundation kararlarının sistem dosyalarıyla uyumlu olduğu görüldü.

Çalıştırılan komutlar:

- `pnpm run typecheck` → PASS
- `pnpm run build` → PASS

Ek not:

- `node apps/panel/dist/bootstrap/store-story.js` ESM/build konfigürasyonu nedeniyle runtime hatası aldı.
- Ancak typecheck ve build seviyesinde sistem doğrulandı.

---

## 5. Tamamlanan Alanlar

Foundation seviyesinde tamamlanan alanlar:

- Story tür ayrımı
- Store story contract
- User product story / UGC contract
- Story tray / viewer yapısı
- Surface bazlı filtreleme
- HOME / DISCOVER / STOREFRONT / PDP ayrımı
- Store story create / publish / unpublish / archive / reorder
- Storefront context doğrulaması
- Store story mediaAssetId zorunluluğu
- Product promotion story için product bağ zorunluluğu
- Kullanıcı ürün story için product tag zorunluluğu
- Kullanıcı ürün story için media zorunluluğu
- Kullanıcı ürün story için delivered eligibility kontrolü
- Kullanıcı ürün story için moderation / visibility ayrımı
- İade sonrası otomatik silmeme davranışı
- Media owner boundary
- Moderation owner boundary
- Interaction owner boundary
- BFF validation / delegation sınırı
- Web story bootstrap
- Panel store-story smoke
- Typecheck ve build doğrulaması

---

## 6. Boundary Review Sonuçları

### Product

PASS

Story product truth üretmez. Ürün bağı yalnız referans/projection olarak kullanılır.

### Price

PASS

Story fiyat truth üretmez.

### Stock

PASS

Story stok truth üretmez.

### Cart

PASS

Story yalnız `canAddToCart` gibi yetenek/projection taşıyabilir. Cart mutation cart owner’da kalır.

### Media

PASS

Story medya işleme yapmaz. Story yalnız mediaAssetId/ref kullanır. Media processing media owner’dadır.

### Moderation

PASS

Story moderasyon kararı üretmez. Moderation target olarak STORY / UGC ayrımı vardır.

### Interaction

PASS

Beğen / kaydet / paylaş interaction owner’da tutulur. Story yalnız interaction capability veya counter projection taşır.

### Risk / Fraud

PASS WITH LIMITATION

Risk/fraud sistemi story içinde truth olarak bulunmaz. Ancak abuse/spam/sahte etkileşim hardening’e bırakılmıştır.

### User Eligibility

PASS WITH LIMITATION

Kullanıcı ürün story’si için delivered eligibility kontrolü vardır. Ancak production-grade order/shipment entegrasyonu hardening’de güçlendirilmelidir.

### Storefront Context

PASS

Store story yönetimi storefrontId ile çalışır. Storefront bağlamı korunur.

---

## 7. Surface Review Sonuçları

### HOME

PASS

Mağaza tanıtım story’si desteklenir.

### DISCOVER

PASS

Discover yüzeyinde yalnız mağaza tanıtım story’si görünür. Ürün story ve kullanıcı story sızıntısı raporlanmamıştır.

### STOREFRONT

PASS

Mağaza tanıtım ve mağaza ürün tanıtım story’leri desteklenir.

### PDP

PASS

PDP’de fenomen mağaza story akışı yoktur. PDP’de yalnız kullanıcı ürün story sosyal kanıtı vardır.

### FOLLOW / POST

PASS

Post ile story ayrılmıştır. Post içinde `storyProcess: false` ayrımı korunur.

### VIDEO PRODUCT CARD

PASS

Story ile video product card ayrımı korunur. Video product card story truth üretmez.

---

## 8. BFF Review

BFF tarafında şu route’lar doğrulanmıştır:

- `/story/tray`
- `/story/viewer`
- `/store-story/*`

BFF davranışı:

- surface validation yapar
- actor context validation yapar
- storefrontId validation yapar
- service delegation yapar
- story truth üretmez
- media truth üretmez
- moderation truth üretmez
- interaction truth üretmez

Sonuç: PASS

---

## 9. Web / Panel / Smoke Review

### Web tarafı

- `apps/web/src/bootstrap/story.ts` mevcut.
- Story surface simulation içerir.
- Story sızıntı testlerini destekler.

### Panel tarafı

- `apps/panel/src/bootstrap/store-story.ts` mevcut.
- Store story create / publish / unpublish / archive / reorder smoke senaryolarını içerir.

### Eksik bootstrap’lar

- `apps/web/src/bootstrap/discover.ts` bulunmadı.
- Panel tarafında UGC bootstrap bulunmadı.
- Panel tarafında media bootstrap bulunmadı.

Bu eksikler foundation closure’a engel değildir; hardening / smoke standardization aşamasına bırakılır.

---

## 10. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki alanlar bu sistem closure kapsamında production-ready kabul edilmez:

- kalıcı story persistence
- gerçek story media upload pipeline
- gerçek video transcode
- gerçek CDN / storage entegrasyonu
- gerçek yüksek hacimli UGC storage lifecycle
- tam moderation workflow / admin panel akışı
- gelişmiş abuse / spam / fraud story kontrolleri
- gelişmiş analytics / izlenme metrikleri
- story seen / unseen persistence
- notification entegrasyonu
- ranking / recommendation entegrasyonu
- discover bootstrap standardı
- panel UGC bootstrap
- panel media bootstrap
- `services/ugc` ayrı servis yerleşimi

---

## 11. Açık Eksikler

### 11.1 Persistence eksikliği

Story, store story, UGC, interaction ve birçok medya akışı foundation seviyesinde in-memory yapılardadır.

Durum: HARDENING’e taşındı.

### 11.2 Media processing eksikliği

Upload ve transcode logic’leri simulation seviyesindedir.

Durum: HARDENING-04 Media Readiness Integration’a taşındı.

### 11.3 UGC service placement

UGC logic şu an `services/ugc` yerine `services/media` içinde yaşamaktadır.

Durum: MONITORED

Bu foundation aşamasında kapanış engeli değildir. İleride UGC hacmi ve domain sınırı büyüdüğünde ayrı service yerleşimi değerlendirilecektir.

### 11.4 Bootstrap eksiklikleri

`discover.ts`, panel UGC bootstrap ve panel media bootstrap dosyaları eksiktir.

Durum: HARDENING-09 BFF Smoke / Port Orchestration Standard’a taşındı.

### 11.5 Analytics eksikliği

Story izlenme, etkileşim, yönlendirme ve sıralama metrikleri gelişmiş seviyede değildir.

Durum: HARDENING-08 Analytics / Notification Integration’a taşındı.

### 11.6 Runtime smoke limitation

Store story runtime smoke, ESM/build konfigürasyonu nedeniyle çalışmamıştır.

Durum: HARDENING-09 kapsamında izlenecektir.

---

## 12. Riskler

### RISK-01 — Story / Post karışması

Story, takip sayfası post akışına dönüşmemelidir. Post sisteminin ana yüzeyi takip sayfasıdır.

Durum: MONITORED

### RISK-02 — Story / Video Product Card karışması

Videolu ürün kart story değildir. Video product card ticari yüzey olarak kalmalıdır.

Durum: MONITORED

### RISK-03 — PDP’ye fenomen story sızması

PDP’de fenomen mağaza story akışı bulunmamalıdır. PDP yalnız kullanıcı ürün story sosyal kanıtı gösterebilir.

Durum: MONITORED

### RISK-04 — Discover’a ürün story veya kullanıcı story sızması

Keşfet üst story şeridinde yalnız mağaza tanıtım story’si yer almalıdır.

Durum: MONITORED

### RISK-05 — UGC eligibility’nin zayıf kalması

Kullanıcı ürün story’si yalnız satın alınmış ve teslim edilmiş ürün için açılmalıdır.

Durum: MONITORED

### RISK-06 — Medya processing’in story içine taşınması

Story medya işleme yapmamalıdır. Media owner ayrı kalmalıdır.

Durum: MONITORED

### RISK-07 — Moderation kararının story içine taşınması

Story moderasyon kararı üretmemelidir.

Durum: MONITORED

---

## 13. İleri Faz / Hardening Önerileri

S05 Story Sistemi için aşağıdaki hardening hatları önemlidir:

- HARDENING-01 — Persistence Foundation Expansion
- HARDENING-03 — Owner System Integration
- HARDENING-04 — Media Readiness Integration
- HARDENING-06 — Moderation / Risk Integration
- HARDENING-08 — Analytics / Notification Integration
- HARDENING-09 — BFF Smoke / Port Orchestration Standard
- HARDENING-10 — CI Build Order / Workspace Package Standardization

S05 özel hardening başlıkları:

- Story persistence
- Store story repository
- UGC repository / owner placement kararı
- Story media upload ve transcode pipeline
- Story moderation queue integration
- Story abuse/spam/risk checks
- Story seen/unseen state
- Story analytics event taxonomy
- Story notification hooks
- Discover story smoke
- Panel UGC / media smoke
- Store story runtime smoke ESM fix

---

## 14. Güncel Karar

S05 — Story Sistemi için güncel karar:

Foundation: PASS WITH LIMITATION

Production readiness: PARTIAL

Gerekçe:

Story Sistemi, sistem dosyalarında belirtilen üç ana story türünü, yüzey izolasyonlarını ve owner boundary sınırlarını teknik olarak karşılamaktadır. Store story, kullanıcı ürün story, medya, moderasyon, interaction ve BFF katmanları foundation seviyesinde kodlanmıştır. PDP, Discover, Storefront, Post ve Video Product Card ayrımları source review ile doğrulanmıştır.

`pnpm run typecheck` ve `pnpm run build` başarılıdır.

Ancak persistence, gerçek medya upload/transcode, UGC service placement, gelişmiş analytics, notification ve bazı bootstrap/smoke eksikleri nedeniyle sistem production-ready değildir.

Bu nedenle S05 foundation kapatılır; production readiness açık kalır.

---

## 15. Sonraki Sistem

Sıradaki analiz/kayıt sistemi:

S06 — Video Sistemi