# S06 — VIDEO SİSTEMİ KAYIT DOSYASI

## 0. Teknik Olmayan Kısa Özet

Video Sistemi, platformda videolu ürün gösterimi, mağaza bağlamlı video sunumu, keşfet içindeki video ürün karşılaşmaları ve video destekli ticari yönlendirme alanlarını kapsar.

Bu sistem bağımsız bir truth owner değildir.

Video sistemi:

- ürün truth üretmez
- fiyat truth üretmez
- stok truth üretmez
- cart truth üretmez
- story truth üretmez
- medya processing truth üretmez
- global ürün medyasını mutate etmez
- PDP yerine geçmez
- story yerine geçmez
- post yerine geçmez

Video sistemi, Media + PLP/Category + Search/Discover + Storefront + Interaction sistemleri üzerinde çalışan ortak bir capability/projection katmanı olarak ele alınmıştır.

Güncel karar:

Foundation: PASS WITH LIMITATION  
Production readiness: PARTIAL

---

## 1. Sistem Özeti

S06 Video Sistemi, platformdaki videolu ürün sunumlarının ve video destekli ticari yüzeylerin yönetim sınırlarını belirler.

Video sistemi özellikle şu alanlarla ilişkilidir:

- videolu ürün kartları
- PLP video rail
- Discover video ürün akışı
- mağaza bağlamlı ürün videosu
- fenomenin kendi mağazası için eklediği hook video
- video üzerinden PDP’ye geçiş
- video üzerinden ticari aksiyon başlatma
- video / story / post / PDP ayrımı

Video sistemi ayrı bir büyük servis olarak değil, dağıtık sistem capability’si olarak kurulmuştur.

---

## 2. Temel Mimari Karar

Video sistemi ayrı bir truth owner değildir.

Video:

- Media sistemi üzerinden varlık olarak temsil edilir
- PLP / Category sistemi üzerinden ürün kartı projeksiyonu olarak görünür
- Search / Discover sistemi üzerinden video odaklı karşılaşma üretir
- Storefront / Pool bağlamında mağaza özel medya olarak bağlanabilir
- Interaction sistemi üzerinden beğen / kaydet / paylaş gibi davranışlara konu olabilir
- PDP’ye geçişte mağaza bağlamını korur

Net kural:

Video sistemi hiçbir ticari veya içerik truth’unu kendi içine taşımaz.

---

## 3. Yapılan Paketler

### PX-VIDEO-00 — Video System Repo Inventory Only

Karar: Envanter tamamlandı.

Amaç:

Repo’da video sistemiyle ilgili hangi contract, service, BFF, web/panel bootstrap, smoke ve owner bağlantılarının bulunduğunu tarafsız şekilde çıkarmak.

Bulunan ana alanlar:

- `MediaAssetType.VIDEO`
- `MediaSurface.VIDEO_PRODUCT_CARD`
- `PlpVideoRailItem`
- `InteractionTargetType.VIDEO_PRODUCT_CARD`
- `CreatorStoreProductMediaType.VIDEO`
- video rail üretimi
- discover video kısıtı
- creator hook video
- media video duration validation
- poster / preview / mobile optimized medya varyantları

---

### PX-VIDEO-01 — Video System Source Review & Boundary Alignment

Karar: PASS WITH LIMITATION

Amaç:

S06 Video Sistemi’nin repo’daki mevcut dağıtık kod karşılığını sistem kararlarıyla uyumlu hale getirmek; video/story/PDP/cart/media boundary’lerini doğrulamak; küçük alignment yapmak; typecheck/build kanıtı üretmek.

İncelenen ana source dosyaları:

- `packages/contracts/src/media.ts`
- `packages/contracts/src/plp.ts`
- `services/media/src/asset.ts`
- `services/category/src/category.ts`
- `services/search/src/search.ts`
- `packages/contracts/src/pool.ts`
- `services/interaction/src/interaction.ts`
- `apps/bff/src/server/media.ts`

Yapılan değişiklikler:

- `packages/contracts/src/plp.ts` içinde `PlpVideoRailItem` arayüzüne story olmadığını ve miniPDP kapsamını netleştiren mimari comment’ler eklendi.
- `services/category/src/category.ts` içinde video rail üretimi sırasında boundary alignment guard comment’leri eklendi.

Çalıştırılan komutlar:

- `pnpm run typecheck` → PASS
- `pnpm run build` → PASS

---

## 4. Tamamlanan Alanlar

Foundation seviyesinde tamamlanan alanlar:

- video asset tipi
- video product card media surface
- video poster / preview / mobile optimized varyantları
- video duration validation
- PLP video rail
- `PlpVideoRailItem`
- primary media video desteği
- Discover video ürün filtrelemesi
- creator store product video hook
- global ürün medyası / mağaza videosu ayrımı
- video → PDP geçişinde storefront bağlamı
- video product card interaction target
- video / story ayrımı
- video / PDP ayrımı
- video / cart boundary
- media owner boundary
- BFF delegation sınırı
- typecheck/build doğrulaması

---

## 5. Boundary Review Sonuçları

### Product

PASS

Video sistemi product truth üretmez. Ürün bilgisi projection olarak kullanılır.

### Price

PASS

Video kartlarda fiyat bilgisi yalnız görünüm/projeksiyon seviyesindedir. Fiyat truth merkezi fiyat sisteminde kalır.

### Stock

PASS

Video kartlarda stok bilgisi yalnız görünüm/projeksiyon seviyesindedir. Stok truth merkezi stok sisteminde kalır.

### Cart

PASS

Video kartlar cart aksiyonu başlatabilir; cart mutation cart/commerce owner’da kalır. Sessiz cart riski projection seviyesinde sınırlandırılmıştır.

### Media

PASS WITH LIMITATION

Video medya olarak media sistemi içinde temsil edilir. Ancak gerçek video transcoding ve CDN/streaming production seviyede değildir.

### Story

PASS

Video product card story değildir. Story/video ayrımı source review ile korunmuştur.

### Post

PASS

Post medyası ile video product card ayrımı owner/surface bazında korunmuştur.

### Interaction

PASS

Video product card interaction target olarak desteklenir. Interaction truth interaction owner’da kalır.

### Storefront Context

PASS

Video karttan PDP’ye geçişte mağaza bağlamı korunur. `storefrontId` taşınır.

### Search / Discover

PASS

Discover modu video ürün odaklıdır. Story tray ile video product card ayrımı korunur.

---

## 6. Surface Review Sonuçları

### PLP

PASS

PLP içinde video rail ve video product projection desteklenir.

### DISCOVER

PASS

Discover video ürün akışı Search/Discover capability’si üzerinden desteklenir.

### STOREFRONT

PASS

Fenomen mağaza bağlamlı video medya vitrini korunur.

### PDP

PASS

Video kart PDP’nin yerine geçmez. PDP’ye geçişte mağaza bağlamı korunur.

### STORY

PASS

Video story sistemine karışmaz. Story medyası video olabilir ama video product card story değildir.

### POST

PASS

Post video medya içerebilir; ancak post video product card değildir.

### CART / COMMERCE

PASS

Video cart truth üretmez.

---

## 7. BFF Review

Video ihtiyacı bağımsız `/video` route’u ile değil, mevcut route’lar üzerinden karşılanır:

- `/media/*`
- `/plp`
- `/search`
- `/interaction`

BFF davranışı:

- media upload/process çağrılarını ilgili media service’e delege eder
- PLP video projection’ı category/PLP servisinden alır
- Discover video aramasını search servisinden alır
- interaction işlemlerini interaction owner’a delege eder
- video truth üretmez
- product/price/stock/cart/story/media truth üretmez

Sonuç: PASS

---

## 8. Web / Panel / Smoke Review

Mevcut akışlar:

- PLP video rail bootstrap
- Search/Discover video arama bootstrap
- Search foundation smoke içinde Discover video testi
- Pool / creator store media hook bootstrap

Eksikler:

- ayrı video bootstrap yok
- tam panel video yönetim bootstrap yok
- gerçek playback state smoke yok

Bu eksikler foundation closure’a engel değildir; hardening ve ilgili sistemlerin ileri fazına taşınır.

---

## 9. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki alanlar bu closure kapsamında production-ready kabul edilmez:

- standalone video service
- standalone video contract
- gerçek video transcoding
- CDN / streaming altyapısı
- playback state
- izleme süresi takibi
- active cover media yönetimi
- active first video yönetimi
- zengin miniPDP DTO
- tam video player UI
- video analytics
- notification entegrasyonu
- video-specific cart flow
- full discover video feed UI
- panel video management UI
- persistence

---

## 10. Açık Eksikler

### 10.1 Gerçek video transcoding yok

Video processing simulation/foundation seviyesindedir.

Durum: HARDENING-04 Media Readiness Integration’a taşındı.

### 10.2 Playback state yok

İzleme süresi, izleme tamamlandı, tekrar izleme gibi state’ler tutulmuyor.

Durum: HARDENING-08 Analytics / Notification Integration’a taşındı.

### 10.3 Mini PDP ayrı DTO değil

Video kartlarda miniPDP ayrı zengin DTO olarak modellenmemiştir. Mevcut projection kullanılmıştır.

Durum: MONITORED

### 10.4 Standalone video service yok

Video sistemi bağımsız servis değil, dağıtık capability/projection olarak kurulmuştur.

Durum: ACCEPTED WITH LIMITATION

### 10.5 Panel video yönetimi sınırlı

Fenomenin video hook eklemesi pool/store media tarafında vardır; ancak tam panel video yönetimi ileri faza kalmıştır.

Durum: HARDENING / PANEL ITERATION

---

## 11. Riskler

### RISK-01 — Video kartın story’ye dönüşmesi

Videolu ürün kart story değildir. Story/video ayrımı korunmalıdır.

Durum: MONITORED

### RISK-02 — Fenomen videosunun global ürün medyasına sızması

Fenomenin mağazaya özel eklediği video global ürün medyasını değiştirmemelidir.

Durum: MONITORED

### RISK-03 — Video processing’in video sistemine taşınması

Video processing media owner’da kalmalıdır.

Durum: MONITORED

### RISK-04 — Mini PDP’nin tam PDP’ye dönüşmesi

Video kart içindeki dar ürün geçiş alanı tam PDP’nin yerine geçmemelidir.

Durum: MONITORED

### RISK-05 — Sessiz cart aksiyonu

Varyant seçimi gereken ürünlerde video kart sessiz sepete ekleme yapmamalıdır.

Durum: MONITORED

### RISK-06 — Discover video/story karışması

Discover video ürün akışı ile story tray karışmamalıdır.

Durum: MONITORED

---

## 12. İleri Faz / Hardening Önerileri

S06 Video Sistemi için aşağıdaki hardening hatları önemlidir:

- HARDENING-01 — Persistence Foundation Expansion
- HARDENING-04 — Media Readiness Integration
- HARDENING-07 — Search / Index Sync
- HARDENING-08 — Analytics / Notification Integration
- HARDENING-09 — BFF Smoke / Port Orchestration Standard
- HARDENING-10 — CI Build Order / Workspace Package Standardization

S06 özel hardening başlıkları:

- gerçek video transcode pipeline
- poster/preview üretiminin gerçek medya işlemeye bağlanması
- video player playback event taxonomy
- video watch duration analytics
- active cover media standardı
- active first video standardı
- creator video management panel flow
- discover video feed smoke
- video cart guard smoke
- miniPDP projection standardı
- video media lifecycle persistence

---

## 13. S01/S02/S05 Standardına Göre Derinlik Değerlendirmesi

S06, S01 Havuz veya S02 Fenomen Mağaza gibi bağımsız geniş lifecycle sistemi değildir. Video, platformda dağıtık bir capability/projection katmanı olarak çalışmaktadır.

Bu nedenle S06’dan bağımsız bir `services/video` lifecycle’ı beklemek doğru değildir.

Ancak kendi sistem doğasına göre:

- video medya tipi kurulmuştur
- video product card yüzeyi kurulmuştur
- PLP video rail kurulmuştur
- Discover video filtrelemesi kurulmuştur
- creator store video hook kurulmuştur
- media/story/PDP/cart boundary korunmuştur
- BFF truth üretmemektedir
- typecheck/build kanıtı vardır

Bu yüzden S06 foundation closure için yeterli derinliktedir.

---

## 14. Güncel Karar

S06 — Video Sistemi için güncel karar:

Foundation: PASS WITH LIMITATION

Production readiness: PARTIAL

Gerekçe:

Video Sistemi bağımsız bir truth owner olarak değil, Media + PLP/Category + Search/Discover + Storefront + Interaction sistemleri üzerinde çalışan ortak capability/projection katmanı olarak başarıyla konumlandırılmıştır. Video kart, story, PDP, post, cart ve media sınırları source review ile doğrulanmıştır.

`pnpm run typecheck` ve `pnpm run build` başarılıdır.

Ancak gerçek video transcoding, playback state, video analytics, full panel video yönetimi, persistence ve production medya dağıtımı hardening fazına bırakılmıştır.

Bu nedenle S06 foundation kapatılır; production readiness açık kalır.

---

## 15. Sonraki Sistem

Sıradaki analiz/kayıt sistemi:

S07 — Keşfet Sistemi