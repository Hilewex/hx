# S02 — FENOMEN MAĞAZA SİSTEMİ KAYIT DOSYASI

## 1. Sistem Özeti

Fenomen Mağaza Sistemi, onaylı fenomenin platform kuralları içinde kendi mağaza vitrini, ürün seçkisi, içerik alanları, post/story yüzeyi ve müşteriyle sınırlı iletişim alanı üzerinden sosyal ticaret yapmasını sağlayan sistemdir.

Bu sistemde fenomen bağımsız satıcı değildir.

Fenomen:

- mağaza kimliğini yönetir
- havuzdan uygun ürünü mağazasına bağlar
- mağaza içi ürün sırası ve görünürlüğünü yönetir
- ürüne mağaza-özel not/görsel/video referansı ekler
- story ve post yayınlar
- kullanıcıyla sınırlı sosyal mesajlaşma yapar

Fenomen şunların sahibi değildir:

- ana ürün gerçeği
- stok
- ana fiyat/fiyat motoru
- kategori/taksonomi
- ödeme
- sipariş
- kargo
- iade/iptal
- finansal mutabakat
- payout
- resmi destek
- resmi ürün soru-cevap

---

## 2. Temel Mimari Karar

Fenomen mağaza sosyal-commerce vitrini olarak çalışır.

Ana ayrım:

- Havuz Sistemi: ürünü platform ticari havuzuna hazırlar.
- Fenomen Mağaza Sistemi: uygun ürünü mağaza bağlamında sunar.
- Medya Sistemi: görsel/video varlıklarını işler.
- Story Sistemi: story yüzeyini yönetir.
- Post Sistemi: takip akışı ve mağaza içi post yüzeyini yönetir.
- Destek Sistemi: sipariş, ödeme, kargo, iade, iptal sorunlarını yönetir.
- Soru-Cevap Sistemi: resmi ürün bilgi sorularını yönetir.

---

## 3. Yapılan Paketler

### PX-FENOMEN-01 — Storefront Identity / Profile Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Fenomen mağaza profil yapısı kuruldu.
- Mağaza adı, açıklama, slug, profil görseli ve kapak görseli alanları eklendi.
- Mağaza görünürlük durumu kuruldu.
- Creator kendi mağaza profilini oluşturabilir/güncelleyebilir hale geldi.
- Public slug ile mağaza görüntüleme foundation kuruldu.
- HIDDEN / SUSPENDED mağazaların public görünmemesi sağlandı.
- Admin suspend / reactivate akışı eklendi.
- Media truth taşınmadı; sadece mediaAssetId referansı tutuldu.
- Pool regression smoke çalıştırıldı ve mevcut havuz davranışı korundu.

**Kapsam dışı:**

- ürün ekleme
- ürün sıralama
- story
- post
- mesaj
- performans
- ödeme/sipariş/finans entegrasyonu

---

### PX-FENOMEN-02 — Creator Store Product Management Hardening

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- CreatorStoreProduct yönetimi güçlendirildi.
- Ürün görünürlüğü eklendi.
- Ürün sırası yönetimi eklendi.
- Ürün öne çıkarma alanı eklendi.
- Ürün kısa notu alanı eklendi.
- Mağaza içi ürün sıralama/reorder akışı kuruldu.
- Creator sadece kendi mağaza ürünlerini yönetebilir hale getirildi.
- Removed ürünlerin tekrar güncellenmesi engellendi.
- Yabancı mağaza ürününün reorder/update edilmesi engellendi.
- CommercialPoolProduct global status’unun değişmediği doğrulandı.

**Kapsam dışı:**

- story/video upload
- post oluşturma
- media processing
- checkout/order/search/finance entegrasyonu

---

### PX-FENOMEN-03 — Store Media / Product Video Hook

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Fenomen mağaza ürününe özel medya referansı eklendi.
- IMAGE / VIDEO ayrımı kuruldu.
- PRODUCT_CARD / PRODUCT_DETAIL / STORE_HIGHLIGHT kullanım ayrımı kuruldu.
- Creator kendi mağaza ürününe medya referansı ekleyebilir hale geldi.
- Duplicate media engellendi.
- Foreign store product media add engellendi.
- Removed ürünün medya kabul etmesi engellendi.
- Media remove ve reorder akışı kuruldu.
- Global ürün medyası değiştirilmedi.
- CommercialPoolProduct global status’u değişmedi.

**Önemli karar:**

`removeCreatorStoreProduct` fiziksel silme yerine `REMOVED` status ile mantıksal silme yapacak şekilde güncellendi.

Bu karar, removed ürünlerin geçmişini korumak ve sonraki guard’ları doğru çalıştırmak için kabul edildi.

**Kapsam dışı:**

- gerçek medya upload
- video processing
- thumbnail/CDN/virus scan
- medya moderasyon kararı
- story/post oluşturma

---

### PX-FENOMEN-04 — Store Story Surface Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- StoreStory contract oluşturuldu.
- Mağaza story servisi kuruldu.
- İki story tipi ayrıldı:
  - STORE_INTRO
  - PRODUCT_PROMOTION
- PRODUCT_PROMOTION için creatorStoreProductId zorunlu hale getirildi.
- mediaAssetId zorunlu hale getirildi.
- publish / unpublish / archive lifecycle kuruldu.
- Story reorder guardları eklendi.
- Archived story tekrar publish edilemez hale getirildi.
- Public story list sadece yayınlanmış story’leri döndürecek şekilde kuruldu.
- Pool ve storefront regression korunarak smoke testleri geçti.

**Kapsam dışı:**

- gerçek medya upload
- video processing
- user product story
- post oluşturma
- checkout/order/finance entegrasyonu

---

### PX-FENOMEN-05 — Store Post / Follow + Store Post Surface

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- StorePost contract oluşturuldu.
- Store-post servisi kuruldu.
- Post create / publish / hide / archive lifecycle kuruldu.
- Reorder akışı eklendi.
- Postun ana yüzeyi Takip Sayfası olarak belirlendi.
- Postun ikincil yüzeyi fenomen mağaza içi “Postlar / Güncellemeler” alanı olarak belirlendi.
- Public storefront post listesi eklendi.
- Follow feed foundation eklendi.
- Empty body, duplicate media/product, reorder validation guardları eklendi.
- Archived post publish engellendi.
- Hide/archive reason zorunlu hale getirildi.
- PDP / PLP / sepet / checkout / sipariş / destek alanlarına post sokulmadı.
- Yorum sistemi eklenmedi.
- Bildirim dispatch yapılmadı.

**Önemli not:**

Store Post sistemi mevcut genel Post / UGC sistemiyle çakışmaması için izole tutuldu. Export tarafında `StorePostV2` namespace’i kullanıldı.

İleri fazda post domain isimlendirmesi ve StorePost / UGC Post ayrımı tekrar gözden geçirilmelidir.

---

### PX-FENOMEN-06 — Store Message / Support Boundary

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Fenomen mağaza mesaj thread foundation kuruldu.
- Müşteri fenomen mağazaya mesaj başlatabilir hale geldi.
- Fenomen kendi mağazasına gelen mesaja cevap verebilir hale geldi.
- Mesaj konu tipleri ayrıldı.
- STYLE_ADVICE gibi sosyal/ilişkisel konular OPEN thread oluşturur.
- ORDER_SUPPORT destek sistemine yönlendirilir.
- OFFICIAL_PRODUCT_QUESTION Q&A sistemine yönlendirilir.
- Creator sadece kendi storefront thread’ine cevap verebilir.
- Creator foreign storefront thread’e cevap veremez.
- Customer kendi thread’ine cevap verebilir.
- Closed thread reply engellendi.
- Close without reason engellendi.
- Gerçek support ticket oluşturulmadı.
- Gerçek Q&A oluşturulmadı.
- Websocket / live chat / push notification eklenmedi.

**Kapsam dışı:**

- gerçek destek ticket entegrasyonu
- gerçek PDP Q&A entegrasyonu
- canlı chat
- websocket
- push notification
- moderasyon karar motoru
- sipariş/ödeme/kargo/iade çözümü

---

### PX-FENOMEN-06-R — Workspace Build + Store-Post Runtime Fix

**Karar:** PASS

**Yapılanlar:**

- Workspace build/typecheck blokajı giderildi.
- `services/interaction` TS6059 rootDir hatası kapatıldı.
- `services/store-post` build/typecheck standardı düzeltildi.
- `@hx/service-store-post/dist/index.js` runtime hatası giderildi.
- Store-post smoke tekrar çalışır hale geldi.
- Pool, storefront, store-story, store-post ve store-message smoke testleri PASS oldu.

**Önemli teknik not:**

`@hx/contracts` alias artık `packages/contracts/dist` çıktısına dayanıyor. Temiz ortamda önce contracts build çıktısının üretilmesi gerekir.

Bu konu ileride CI/build sırası açısından takip edilmelidir.

---

## 4. Tamamlanan Alanlar

Fenomen Mağaza Sistemi foundation hattında aşağıdaki alanlar tamamlandı:

- Mağaza kimliği
- Mağaza adı / açıklama / slug
- Profil görseli / kapak görseli referansı
- Mağaza görünürlük durumu
- Admin suspend / reactivate
- Mağaza ürün yönetimi
- Ürün görünürlük yönetimi
- Ürün sıralama
- Ürün öne çıkarma
- Ürün kısa notu
- Mağaza-özel ürün medya referansı
- Mağaza-özel ürün video/görsel hook
- Mağaza tanıtım story’si
- Ürün tanıtım story’si
- Store story publish / unpublish / archive / reorder lifecycle
- Mağaza postları
- Takip sayfasına düşen post akışı
- Mağaza içi Postlar / Güncellemeler alanı
- Post publish / hide / archive / reorder lifecycle
- Mesaj / destek / soru-cevap sınırı
- Sosyal mesaj thread foundation
- Destek ve Q&A yönlendirme boundary’si
- Regression smoke disiplini

---

## 5. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki konular bilinçli olarak Fenomen Mağaza foundation hattının dışında bırakıldı:

- gerçek persistence / PostgreSQL
- gerçek auth/session entegrasyonu
- gerçek permission/RBAC/policy engine
- gerçek medya upload
- video processing
- thumbnail/CDN/virus scan
- gerçek media asset doğrulaması
- gerçek follow graph entegrasyonu
- gerçek notification dispatch
- gerçek analytics pipeline
- gerçek support ticket oluşturma
- gerçek PDP Q&A oluşturma
- canlı chat / websocket
- yorum sistemi
- post ranking/recommendation engine
- checkout/order/payment/finance entegrasyonu
- payout / hakediş
- moderasyon karar motoru
- risk/fraud karar motoru
- mağaza rozet / seviye / puan sistemi
- gelişmiş performans paneli

---

## 6. Açık Eksikler

### 6.1 Persistence Eksikliği

Fenomen mağaza verileri foundation seviyesinde in-memory veya geçici yapıdadır.

Kalıcı hale getirilmesi gereken alanlar:

- storefront profile
- creator store product
- creator product media refs
- store story
- store post
- store message thread
- store message records

---

### 6.2 Gerçek Auth / Permission Eksikliği

Actor context hâlâ foundation/header seviyesindedir.

İleri fazda gerçek auth/session/permission sistemiyle bağlanmalıdır.

---

### 6.3 Media Service Entegrasyonu Eksikliği

Medya alanlarında sadece `mediaAssetId` referansı tutulmaktadır.

Eksik kalanlar:

- mediaAssetId gerçekten var mı?
- medya yayına hazır mı?
- medya tipi doğru mu?
- video süresi/formatı uygun mu?
- medya moderation’dan geçti mi?

---

### 6.4 Follow Graph Entegrasyonu Eksikliği

Store-post follow feed şu an foundation seviyesinde çalışır.

Gerçek takip grafiği ve follow feed entegrasyonu ileri fazda yapılmalıdır.

---

### 6.5 Notification Eksikliği

Post, story, mesaj, yeni takipçi, platform uyarısı gibi olaylar henüz gerçek bildirim dispatch sistemine bağlı değildir.

---

### 6.6 Analytics / Performance Eksikliği

Fenomen mağaza performans görünürlüğü henüz kurulmamıştır.

Eksik kalan alanlar:

- satış görünürlüğü
- takipçi büyümesi
- story/post etkileşimi
- ürün görüntülenme
- mesaj yoğunluğu
- dönüşüm sinyalleri
- iade oranı
- mağaza kalite sinyali

---

### 6.7 Moderasyon / Risk Eksikliği

Post, story, medya ve mesaj alanları henüz gerçek moderasyon/risk karar motoruna bağlanmamıştır.

---

### 6.8 StorePost / UGC Post Ayrımı

Store Post sistemi izole kuruldu ve `StorePostV2` namespace’i kullanıldı.

İleri fazda StorePost, UGC Post ve genel Post domain ayrımı yeniden gözden geçirilmelidir.

---

## 7. Riskler

### RISK-01 — Fenomenin Bağımsız Satıcı Gibi Algılanması

Fenomen mağaza bir sosyal-commerce vitrini olmalıdır. Fenomen bağımsız satıcı gibi davranmamalıdır.

**Dikkat:**

- stok yönetemez
- kargo yönetemez
- ödeme yönetemez
- sipariş operasyonu yönetemez
- ana fiyat motorunu yönetemez
- ana ürün bilgisini değiştiremez

---

### RISK-02 — Medya Truth’un Fenomen Mağaza İçine Kayması

Fenomen mağaza medya referansı tutabilir ama medya owner olamaz.

**Dikkat:**

- upload Media Sistemi’nde kalmalı
- processing Media Sistemi’nde kalmalı
- CDN Media Sistemi’nde kalmalı
- moderation Media/Moderation sistemiyle bağlanmalı

---

### RISK-03 — Post Sisteminin Sosyal Medya Feed’ine Dönüşmesi

Post sistemi hafif ticari/sosyal güncelleme alanıdır.

**Dikkat:**

- yorum sistemi eklenmemeli
- ağır discovery/recommendation feed yapılmamalı
- PDP/checkout/order yüzeylerine post sokulmamalı
- takip akışı mağaza postlarıyla kontrollü kalmalı

---

### RISK-04 — Mesaj Alanının Destek Sistemine Dönüşmesi

Mesaj alanı sosyal/ilişkisel iletişimdir.

**Dikkat:**

- sipariş/kargo/ödeme/iade mesajda çözülmemeli
- bu konular destek sistemine yönlendirilmeli
- resmi ürün bilgisi Q&A sistemine yönlendirilmeli

---

### RISK-05 — StorePost / UGC Post Karışıklığı

Store post ile genel kullanıcı postu aynı şey değildir.

**Dikkat:**

- StorePost mağaza/fenomen kaynaklıdır
- UGC kullanıcı kaynaklıdır
- takip akışı ile genel sosyal içerik karışmamalıdır

---

### RISK-06 — CreatorStoreProduct Owner Karışıklığı

CreatorStoreProduct şu an havuz/pool hattından geldi ve fenomen mağaza yönetiminde genişletildi.

**Dikkat:**

Uzun vadede bu truth alanının owner’ı netleşmelidir:

- Pool mu?
- Storefront mu?
- Creator Store domain mi?

Önerilen karar:

CreatorStoreProduct uzun vadede Storefront / Creator Store domain’e taşınmalıdır. Pool yalnız uygun commercial product kaynağı olmalıdır.

---

### RISK-07 — Build Order / Dist Dependency Riski

`@hx/contracts` alias artık dist çıktısına dayandığı için temiz ortamda build sırası önemlidir.

**Dikkat:**

- contracts build önce çalışmalıdır
- CI build order standardı netleştirilmelidir

---

## 8. Dikkat Edilecek Mimari Sınırlar

Aşağıdaki sınırlar korunmalıdır:

- Fenomen bağımsız satıcı değildir.
- Fenomen ana ürün bilgisini değiştiremez.
- Fenomen stok değiştiremez.
- Fenomen ana fiyat motorunu yönetemez.
- Fenomen sipariş/kargo/ödeme/iade süreçlerini yönetemez.
- Fenomen global ürün medyasını değiştiremez.
- Mağaza-özel medya sadece mağaza bağlamında geçerlidir.
- Story/video upload Fenomen Mağaza içinde değil, Medya/Story sistemleriyle kontrollü çözülmelidir.
- Post ana yüzey olarak Takip Sayfası’nda görünür.
- Post ikincil olarak mağaza içi Postlar / Güncellemeler alanında görünür.
- Post PDP, PLP, sepet, checkout, ödeme, sipariş ve destek alanlarına sokulmaz.
- Mesaj resmi destek veya resmi ürün soru-cevap değildir.
- Destek konuları destek sistemine yönlendirilir.
- Resmi ürün soruları Q&A sistemine yönlendirilir.
- BFF business logic üretmez.
- Panel/UI truth üretmez.
- Projection truth değildir.

---

## 9. İleri Faz / Hardening Önerileri

### H01 — Fenomen Mağaza Persistence Foundation

Amaç:

- storefront profile
- creator store product
- creator product media refs
- store story
- store post
- store message

kayıtlarını kalıcı hale getirmek.

---

### H02 — Auth / Permission / Creator Eligibility Integration

Amaç:

Gerçek creator kimliği, mağaza sahipliği, kategori yetkisi ve role/scope kontrollerini auth/permission sistemiyle bağlamak.

---

### H03 — Media Readiness Integration

Amaç:

Mağaza profil görseli, kapak görseli, ürün medya referansları, story medya ve post medya alanlarını gerçek media asset readiness ile bağlamak.

---

### H04 — Moderation / Risk Integration

Amaç:

Story, post, medya ve mesaj alanlarını moderation/risk sinyallerine bağlamak.

---

### H05 — Follow Graph Integration

Amaç:

Store post follow feed’i gerçek takip grafiğine bağlamak.

---

### H06 — Notification Integration

Amaç:

Yeni post, yeni story, yeni mesaj, mağaza uyarısı ve platform uyarılarını notification sistemine bağlamak.

---

### H07 — Store Performance / Analytics Foundation

Amaç:

Fenomen mağaza performans görünürlüğünü kurmak:

- satış görünürlüğü
- ürün performansı
- takipçi büyümesi
- post/story etkileşimi
- mesaj yoğunluğu
- dönüşüm sinyali

---

### H08 — CreatorStoreProduct Ownership Alignment

Amaç:

CreatorStoreProduct truth owner kararını netleştirmek ve gerekiyorsa Storefront / Creator Store domain’e taşımak.

---

### H09 — StorePost / UGC Post Naming Alignment

Amaç:

StorePost, UGC Post ve genel post sistemleri arasındaki naming ve owner ayrımını netleştirmek.

---

## 10. Önemli Notlar

- Fenomen Mağaza Sistemi foundation hattı büyük ölçüde kurulmuştur.
- Sistem production-ready değildir.
- Mağaza kimliği, ürün yönetimi, medya hook, story, post ve mesaj boundary alanları foundation seviyesinde tamamlanmıştır.
- Gerçek persistence, auth/permission, media readiness, follow graph, notification ve analytics entegrasyonları ileri faza bırakılmıştır.
- Post için ana yüzey Takip Sayfası, ikincil yüzey mağaza içi Postlar / Güncellemeler alanıdır.
- Story/video işleri Havuz Sistemi’nin değil, Fenomen Mağaza + Media + Story sistemlerinin ortak alanıdır.
- Mesaj alanı destek sistemi değildir; destek konuları destek sistemine yönlendirilmelidir.
- StorePostV2 namespace kullanımı ileride isimlendirme standardı açısından gözden geçirilmelidir.
- CreatorStoreProduct owner kararı ileri fazda netleştirilmelidir.

---

## 11. Güncel Karar

### Foundation Durumu

PASS WITH LIMITATION

### Production Readiness

PARTIAL

### Sonraki Önerilen Aksiyon

Fenomen Mağaza Sistemi için sıradaki ana eksik:

- performans görünürlüğü
- notification hook
- analytics/read model foundation

Bu nedenle sıradaki önerilen paket:

PX-FENOMEN-07 — Store Performance / Notification Foundation