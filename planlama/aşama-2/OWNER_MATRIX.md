# OWNER_MATRIX

Bu matris, platformda hangi truth alanının hangi owner sistem/modül tarafından mutate edilebildiğini tanımlar.

Net kural:
- owner dışı write yoktur
- BFF write yapmaz
- panel direct write yapmaz
- UI truth üretmez
- event ile state mutate edilmez
- finansal truth yalnız finans owner alanında mutate edilir

Bu matris, teknik modül isimleri ile birebir servis adı olmak zorunda değildir; ancak domain ownership sınırını sabitler.

---

## 1. AUTH / SESSION / ACCESS OWNER

### Owner
M1: auth / session / user access-state owner

### Truth alanları
- kullanıcı kimliği
- oturum / session
- access-state
- verified / restricted / suspended access context
- authentication claims
- profile switch context

### Write yetkisi
Yalnız owner modül mutate eder.

### Read / projection kullananlar
- storefront
- panel auth katmanları
- eligibility hesaplayan owner sistemler
- ranking / analytics / fraud sinyali

### Not
Kimlik varlığı ile domain eligibility aynı şey değildir.
M1 auth verir; diğer domain hakları ilgili owner sistemlerde hesaplanır.

---

## 2. COMMERCE TRUTH OWNER

### Owner
M2: commerce truth owner

### Truth alanları
- cart
- checkout draft
- order hazırlığı / commerce preparation
- order create command girdileri
- storefront listing bağlamında ticari görünürlük
- return eligibility için commerce referansları
- verified purchase temel commerce bağı

### Write yetkisi
Yalnız M2 mutate eder.

### Read / projection kullananlar
- BFF
- order tracking projection
- analytics
- ranking
- fraud
- admin / panel özetleri

### Asla owner olmayanlar
- BFF
- panel
- ranking
- analytics
- moderation
- notification

### Kritik sınır
Refund execution M2 alanı değildir; finans truth M6’dadır. 

---

## 3. CONTENT TRUTH OWNER

### Owner
M3: içerik / content truth owner

### Truth alanları
- mağaza açıklama içerikleri
- editorial / content layer kayıtları
- ürünle ilişkili content katmanı
- moderation-safe content projections için kaynak truth

### Write yetkisi
Yalnız M3 mutate eder.

### Read / projection kullananlar
- PDP
- mağaza yüzeyleri
- BFF
- ranking
- analytics

### Not
M3 ile M4 karıştırılmaz.
Genel içerik truth ile sosyal etkileşim truth ayrı alanlardır.

---

## 4. SOCIAL TRUTH OWNER

### Owner
M4: social truth owner

### Truth alanları
- beğeni / kaydetme / paylaşma action kayıtları
- follow ilişkileri
- mağaza post etkileşimi
- PDP sosyal interaction truth
- kullanıcı UGC görünürlük referanslarının sosyal tarafı

### Write yetkisi
Yalnız M4 mutate eder.

### Read / projection kullananlar
- BFF
- ranking
- analytics
- creator panel özetleri
- notification

### Not
Social truth yorum/puan eligibility’sini açmaz; eligibility ayrı domain guard ile hesaplanır.

---

## 5. RANKING / RECOMMENDATION OWNER

### Owner
M8: ranking owner

### Truth alanları
- feed generation
- ranking / reranking
- recommendation generation
- personalization scoring
- search final ranking
- suppression / demotion / boost computation
- fallback feed_type kararı
- trend slot dışı ana ordering

### Write yetkisi
Yalnız M8 mutate eder.

### Read / projection kullananlar
- keşfet
- ana sayfa
- takip
- search result ordering
- analytics inceleme ekranları

### Asla mutate etmez
- commerce truth
- content truth
- social truth
- search intent truth

### Not
M8, candidate üretmez; candidate girişi M9’dan gelir. 

---

## 6. SEARCH INTENT / CANDIDATE OWNER

### Owner
M9: search intent + candidate owner

### Truth alanları
- sorgu intent çözümü
- query parsing / interpretation
- retrieval candidate set
- facet / filter candidate preparation
- search input normalization

### Write yetkisi
Yalnız M9 mutate eder.

### Read / projection kullananlar
- search UI
- BFF
- ranking sistemi
- analytics

### Asla owner olmadığı alan
- final ranking / ordering

### Not
M9 ranking owner değildir; ordering yapmaz, BFF değildir. 

---

## 7. BFF / AGGREGATION OWNER

### Owner
M7/BFF: read aggregation only

### Truth alanları
Yoktur. BFF truth owner değildir.

### Rolü
- read aggregation
- response composition
- degraded / blocked / auth-aware projection
- client-friendly DTO üretimi

### Asla yapmaz
- state mutation
- eligibility üretimi
- financial mutation
- ranking owner davranışı
- direct write

### Not
BFF response truth değildir; projection’dır. 

---

## 8. FINANCIAL TRUTH OWNER

### Owner
M6: financial truth owner

### Truth alanları
- ledger
- balance
- payout
- reconciliation
- settlement
- refund execution
- financial block/release
- sponsor cost attribution
- payable / blocked / settled states

### Write yetkisi
Yalnız M6 mutate eder.

### Read / projection kullananlar
- admin finance görünürlüğü
- fenomen panel sade gelir görünümü
- tedarikçi panel sade hakediş görünümü
- analytics
- fraud risk

### Kritik sınır
- M5 / mağaza / panel finans mutate etmez
- M2 refund execution owner değildir
- payout icrası ayrı süreç olabilir; financial truth yine M6’dadır. 

---

## 9. MODERATION OWNER

### Owner
22-moderasyon sistemi(1).md ile tanımlanan moderasyon owner alanı

### Truth alanları
- moderation queue
- moderation decision
- content visibility decision
- takedown / restriction records
- appeal / review decision kayıtları

### Write yetkisi
Yalnız moderasyon owner sistemi mutate eder.

### Read / projection kullananlar
- admin panel
- support escalation
- risk sinyali
- BFF visibility projections

### Not
Moderation content visibility owner’ıdır; fraud/risk owner’ı değildir.

---

## 10. FRAUD / RISK OWNER

### Owner
49-fraud risk abuse sistemi.md ile tanımlanan risk owner alanı

### Truth alanları
- risk flags
- abuse signals
- fraud review state
- temporary block / risk hold decision inputları
- anomaly records

### Write yetkisi
Yalnız risk owner sistemi mutate eder.

### Read / projection kullananlar
- finance
- admin
- moderation
- analytics
- support escalation

### Not
Risk sistemi doğrudan her şeyi silmez; kademeli koruma ve hold/flag üretir.

---

## 11. ANALYTICS / MEASUREMENT OWNER

### Owner
48-arka paln analatik ölçümleme sistemi.md ile tanımlanan ölçümleme owner alanı

### Truth alanları
- raw event
- normalized event
- derived metric
- decision signal projection

### Write yetkisi
Yalnız analytics owner sistemi mutate eder.

### Read / projection kullananlar
- admin analytics
- ranking
- fraud
- supplier/creator performance summary
- product/ops dashboards

### Not
Analytics karar vermez; karar sistemlerini besler.

---

## 12. MEDIA / ASSET OWNER

### Owner
50-medya sistemş asset  sitemi.md ile tanımlanan media owner alanı

### Truth alanları
- asset record
- media processing state
- media variant / derivative state
- visibility-ready media status
- hot/warm/cold storage lifecycle state

### Write yetkisi
Yalnız media owner sistemi mutate eder.

### Read / projection kullananlar
- story surfaces
- PDP
- video kart
- creator panel
- moderation
- analytics

### Not
Yüklenen dosya ile yayına uygun medya aynı şey değildir.

---

## 13. CREATOR LIFECYCLE OWNER

### Owner
41- fenomen yönetim sistemi.md

### Truth alanları
- başvuru durumu
- kategori yetkisi
- kısıt / askı / kapatma
- görünür statü
- rozet / yönetim kararları

### Write yetkisi
Admin kontrollü owner sistem mutate eder.

### Read / projection kullananlar
- fenomen panel
- admin panel
- analytics / risk sinyali
- storefront visible status

### Not
Fenomen kendi yaşam döngüsü truth’unu panelden direct write ile değiştiremez. 

---

## 14. SUPPLIER LIFECYCLE OWNER

### Owner
44-tedarikçi yönetim sistemi.md

### Truth alanları
- başvuru durumu
- kategori yetkileri
- yükleme hakkı
- kalite / askı / kısıt kararları
- supplier visible/active status

### Write yetkisi
Admin kontrollü owner sistem mutate eder.

### Read / projection kullananlar
- tedarikçi panel
- admin panel
- analytics
- risk
- product acceptance flow

### Not
Tedarikçi kendi lifecycle truth’unu panelden direct write ile değiştiremez. 

---

## 15. CREATOR PANEL SCOPE (TRUTH OWNER DEGIL)

### Sistem
42-fenomen mağaza yönetim panel sistemi.md

### Truth owner mı?
Hayır

### Yapabildiği alanlar
- kendi mağaza ayarları üzerinde izinli self-service
- kendi mağaza ürün düzeni
- mağaza içi içerik yükleme
- sade performans / satış görünürlüğü
- kupon/stroy/post gibi izinli mağaza aksiyonları

### Asla yapamaz
- sipariş truth mutate etmek
- kargo akışını değiştirmek
- platform kârını görmek
- financial truth mutate etmek
- kategori yetkisini kendi kendine değiştirmek

### Not
Fenomen paneli projection + command gönderim alanıdır. 

---

## 16. SUPPLIER PANEL SCOPE (TRUTH OWNER DEGIL)

### Sistem
43-tedarikçi panel sistemi.md

### Truth owner mı?
Hayır

### Yapabildiği alanlar
- ürün verisi girmek
- varyant tanımlamak
- stok güncellemek
- baz fiyat girmek
- lojistik verisi girmek
- sipariş hazırlama / sevkiyat girdisi vermek
- ürün kabul sürecini takip etmek
- sade hakediş görünürlüğü almak

### Asla yapamaz
- ürün onayı vermek
- satış fiyatını belirlemek
- kampanya rejimi açmak
- platform kârını görmek
- sipariş lifecycle truth’unu keyfi değiştirmek
- financial truth mutate etmek

### Not
Tedarikçi paneli ürün ve fulfillment çalışma alanıdır; truth owner değildir. 

---

## 17. ADMIN PANEL SCOPE (TRUTH OWNER DEGIL, UST KONTROL)

### Sistem
40-admin sistemi.md

### Truth owner mı?
Hayır; çoğu durumda doğrudan truth owner değildir.

### Rolü
- başvuru ve yönetim kararları
- görünürlük ve kural enforcement
- review / approve / reject
- finansal görünürlük
- moderation ve risk escalations
- protected action başlatma

### Asla yapamaz
- kontrolsüz bypass
- audit’siz direct mutation
- owner sistemleri atlayarak keyfi write

### Not
Admin güçlüdür; ama sınırsız değildir. Panel action audit üretir ve owner modüle command gönderir. :contentReference[oaicite:10]{index=10}

---

## 18. OZEL KURAL OZETI

- Auth truth yalnız auth owner’da mutate edilir.
- Commerce truth yalnız commerce owner’da mutate edilir.
- Financial truth yalnız financial owner’da mutate edilir.
- Search intent/candidate ile ranking farklı owner alanlarıdır.
- BFF owner değildir.
- Panel owner değildir.
- Analytics owner’dır ama karar owner’ı değildir.
- Moderation ile risk ayrı owner alanlarıdır.
- Media owner, asset yaşam döngüsünü taşır; surface owner’ları medya truth’unu mutate etmez.