# PERFORMANCE_BUDGETS

Bu dosya, platformun kritik yüzeyleri ve sistem akışları için performans bütçelerini tanımlar.

Amaç:
- “hızlı olmalı” ifadesini ölçülebilir hale getirmek
- kullanıcıya görünen yüzeylerle iç sistem akışları için farklı latency hedefleri koymak
- checkout/payment/order gibi kritik commerce zinciri ile discover/home gibi read-heavy yüzeyleri ayrı değerlendirmek
- ileride performans testi, izleme ve regresyon kontrolü için referans oluşturmak

Net kural:
- performans bütçesi truth doğruluğunu ezmez
- düşük latency için owner boundary bozulmaz
- read yüzeyi ile mutation zinciri aynı hedefe bağlanmaz
- algısal performans ve final consistency aynı kavram değildir
- degrade olabilen yüzeylerde hızlı ama dürüst cevap tercih edilir

---

## 1. KAPSAM

Bu belge şu alanları kapsar:

- Public home / discover / category / search / PDP
- App checkout / payment / order
- Shipment / tracking görünürlüğü
- Notification center
- Panel read surfaces
- Panel protected actions
- Async propagation
- Event ingestion
- Video/story/media read yüzeyleri

---

## 2. OLCUM MODELI

Bu belgede aşağıdaki metrikler kullanılır:

### p50
Tipik hızlı kullanıcı deneyimi

### p95
Genel kabul hedefi
Ana performans hedefi olarak esas alınır

### p99
Kötü kuyruk davranışı / uç yük kontrolü

### Hard timeout budget
İşlemin bundan sonra “çok yavaş / belirsiz / başarısız” olarak sınıflanacağı eşik

Net kural:
Ana ürün hedefi p95 üzerinden takip edilir.
p99 alarm / iyileştirme göstergesidir.

---

## 3. LATENCY SINIFLARI

### L1 — Çok hızlı yüzey
Kullanıcı anlık tepki bekler

### L2 — Hızlı yüzey
Biraz daha tolerans vardır ama akış akıcı kalmalıdır

### L3 — Orta hız yüzeyi
Operasyonel veya async ağırlıklı yüzey

### L4 — Batch / async / kontrol yüzeyi
Kullanıcı anlık beklemiyor; doğruluk ve dayanıklılık daha öncelikli

---

## 4. PUBLIC SURFACE BÜTÇELERI

---

## 4.1 Home / Discover / Category / Search

Hedef sınıf:
- L1 / L2

Hedefler:
- p50: 200–350 ms
- p95: 600–900 ms
- p99: 1200–1800 ms
- hard timeout budget: 2500 ms

Açıklama:
Bu yüzeyler yüksek trafiklidir.
Cache/read model/degraded response ile hızlı his vermelidir.
Ancak stale/partial ise dürüst gösterilmelidir.

---

## 4.2 PDP

Hedef sınıf:
- L1

Hedefler:
- p50: 200–300 ms
- p95: 500–800 ms
- p99: 1000–1500 ms
- hard timeout budget: 2000 ms

Açıklama:
PDP kritik dönüşüm yüzeyidir.
Content layer ve social layer ayrı olabilir; biri gecikirse dürüst degrade düşünülebilir ama ürün çekirdeği hızlı dönmelidir.

---

## 5. APP COMMERCE ZINCIRI BÜTÇELERI

---

## 5.1 Cart read / cart mutation

Hedef sınıf:
- L1

Hedefler:
- p50: 150–250 ms
- p95: 400–700 ms
- p99: 900–1300 ms
- hard timeout budget: 1800 ms

Açıklama:
Cart kullanıcıyı bekletmemeli.
Mutation sonrası UI net state almalıdır.

---

## 5.2 Checkout review

Hedef sınıf:
- L1 ama doğruluk öncelikli

Hedefler:
- p50: 250–400 ms
- p95: 700–1200 ms
- p99: 1500–2200 ms
- hard timeout budget: 3000 ms

Açıklama:
Checkout review; address, coupon, totals, stock reservation, price lock gibi alanları etkileyebilir.
Tam hızlı değil ama güvenli ve öngörülebilir olmalıdır.

---

## 5.3 Payment initiate

Hedef sınıf:
- L1 / L2

Hedefler:
- p50: 300–500 ms
- p95: 800–1500 ms
- p99: 1800–3000 ms
- hard timeout budget: 4000 ms

Açıklama:
Dış provider bağımlılığı vardır.
Timeout durumunda “kesin başarısız” denmeyebilir.
Bu nedenle hard timeout ile user-facing budget ayrımı dikkatli yorumlanmalıdır.

---

## 5.4 Order detail read

Hedef sınıf:
- L2

Hedefler:
- p50: 200–350 ms
- p95: 600–1000 ms
- p99: 1200–1800 ms
- hard timeout budget: 2500 ms

Açıklama:
Order detail güvenli ve yeterince hızlı dönmelidir.
Snapshot alanları doğru olmalı, aşırı join veya ağır aggregation yüzünden yavaşlamamalıdır.

---

## 6. SHIPMENT / TRACKING BÜTÇELERI

---

## 6.1 Shipment / tracking read

Hedef sınıf:
- L2

Hedefler:
- p50: 250–400 ms
- p95: 700–1200 ms
- p99: 1400–2200 ms
- hard timeout budget: 3000 ms

Açıklama:
Tracking projection shipment truth’tan türetilir.
Bir miktar lag kabul edilir ama kullanıcı “donuk sistem” hissi almamalıdır.

---

## 6.2 Delivery event ingestion

Hedef sınıf:
- L3

Hedefler:
- p50: 100–200 ms
- p95: 300–700 ms
- p99: 1000–1500 ms
- hard timeout budget: 2500 ms

Açıklama:
Bu kullanıcı yüzeyi değil, ingestion yüzeyidir.
Daha çok throughput, dedupe ve correctness önemlidir.

---

## 7. ELIGIBILITY / REWARD PROPAGATION BÜTÇELERI

---

## 7.1 Delivered -> eligibility propagation

Hedef sınıf:
- L3

Hedefler:
- p95 propagation complete: 5–30 saniye
- upper acceptable bound: 60 saniye
- beyond upper bound: incident/degraded inceleme alanı

Açıklama:
Bu zincir async olabilir.
Ama uzun süreli gecikme kullanıcı güvenini ve review/story hakkını etkiler.

---

## 7.2 Return/refund -> revoke propagation

Hedef sınıf:
- L3

Hedefler:
- p95 propagation complete: 10–60 saniye
- upper acceptable bound: 120 saniye

Açıklama:
Bu alan görünürlük ve reward doğruluğu için önemlidir.
Anlık olmak zorunda değildir ama uzun süre açıkta kalmamalıdır.

---

## 8. NOTIFICATION BÜTÇELERI

---

## 8.1 In-app notification list read

Hedef sınıf:
- L2

Hedefler:
- p50: 200–350 ms
- p95: 600–1000 ms
- p99: 1200–1800 ms
- hard timeout budget: 2500 ms

## 8.2 Notification intent -> delivery attempt

Hedef sınıf:
- L3

Hedefler:
- p95 first attempt enqueue/start: 5 saniye altı
- p95 retry scheduling: 30 saniye altı

Açıklama:
Notification ana truth değil; biraz gecikme kabul edilir.

---

## 9. PANEL BÜTÇELERI

---

## 9.1 Panel list / dashboard read

Hedef sınıf:
- L2 / L3

Hedefler:
- p50: 300–600 ms
- p95: 1000–2000 ms
- p99: 2500–4000 ms
- hard timeout budget: 5000 ms

Açıklama:
Panel kullanıcı sayısı daha düşüktür.
Ama ağır filtreleme/sorgu olabilir.
Burada audit ve doğruluk, storefront kadar hızlı his vermekten daha önemlidir.

---

## 9.2 Panel protected actions

Hedef sınıf:
- L2

Hedefler:
- p50 accepted response: 200–400 ms
- p95 accepted response: 600–1200 ms
- p99 accepted response: 1500–2500 ms
- hard timeout budget: 3000 ms

Açıklama:
Action sonucu çoğu zaman `accepted` olabilir.
Asıl iş sonradan tamamlanabilir.
Önemli olan guard/permission/audit kontrolünün güvenli ve çok gecikmeden tamamlanmasıdır.

---

## 10. VIDEO / STORY / MEDIA BÜTÇELERI

---

## 10.1 Story viewer / media open

Hedef sınıf:
- L1 algısal performans

Hedefler:
- UI open p50: 150–250 ms
- UI open p95: 400–700 ms

### First-frame hedefi
- p50: 400–800 ms
- p95: 1000–1800 ms
- p99: 2500 ms altı hedeflenir

Açıklama:
İlk fazda gerçek CDN/media vendor aktif olmayabilir.
Ama yine de kullanıcı deneyim hedefi konmalıdır.
Media hazır değilse dürüst loading / processing state gösterilir.

---

## 11. EVENT VE ASYNC ISLEME BÜTÇELERI

---

## 11.1 Event ingest

Hedef sınıf:
- L3

Hedefler:
- p50: 50–150 ms
- p95: 200–500 ms
- p99: 800–1200 ms
- hard timeout budget: 2000 ms

## 11.2 Async worker completion

Hedef sınıf:
- L4

Hedefler:
- kritik async task’ler için p95 completion: 5–30 saniye
- orta kritik async task’ler için p95 completion: 30–120 saniye

Açıklama:
Burada tek istek latency değil, end-to-end iş tamamlama süresi önemlidir.

---

## 12. TIMEOUT BÜTÇELERI

Bu timeout’lar kullanıcı-facing latency ile karıştırılmamalıdır.

### Checkout review timeout budget
- 3000 ms

### Payment initiate timeout budget
- 4000 ms

### Order read timeout budget
- 2500 ms

### Carrier shipment create timeout budget
- 4000 ms

### Tracking read timeout budget
- 3000 ms

### Panel read timeout budget
- 5000 ms

### Callback/event ingestion timeout budget
- 2000–2500 ms bandı

Net kural:
Timeout aşıldı diye otomatik domain failure yazılmaz; davranış `FALLBACK_RETRY_TIMEOUT_POLICY.md` ile birlikte yorumlanır.

---

## 13. BÜTÇE ASIMI KURALI

Bir yüzey bütçeyi aştığında:
1. önce hangi katman yavaş bakılır
2. read model / owner call / external provider / join / serialization ayrımı yapılır
3. gerekirse:
   - cache/read model iyileştirilir
   - timeout/fallback davranışı gözden geçirilir
   - query yapısı sadeleştirilir
   - payload küçültülür
4. doğruluk pahasına hız kazanılmaz

---

## 14. ALARM / IZLEME KURALI

Aşağıdaki alanlarda p95 ve error rate birlikte izlenmelidir:
- checkout review
- payment initiate
- order detail read
- shipment tracking read
- panel protected actions
- event ingestion
- eligibility propagation
- payout sandbox/result işleme

Aşağıdaki alanlarda p99 özellikle izlenmelidir:
- public read surfaces
- story first-frame
- payment initiate
- panel ağır sorgular

---

## 15. IMPLEMENTASYON ICIN NET KARARLAR

1. Ana performans hedefi p95 üzerinden yönetilir
2. Public storefront yüzeyleri L1/L2 seviyesinde tutulur
3. PDP, discover/home’dan daha sıkı dönüşüm yüzeyi olarak değerlendirilir
4. Checkout review ve payment initiate hızlı ama güvenli çalışmalıdır
5. Payment initiate için dış provider gecikmesi ayrı yorumlanır
6. Shipment tracking projection hızlı ama dürüst olmalıdır
7. Eligibility/reward propagation async budget ile yönetilir
8. Panel action accepted response bütçesi ile final tamamlanma süresi ayrı düşünülür
9. Story/video alanında first-frame hedefi ayrı takip edilir
10. Bütçe aşımı çözümü doğruluğu bozmadan yapılır

---

## 16. DEVAM DOSYASI ICIN ETKI

Bu belge sonrası:
- `RELIABILITY_TARGETS.md` uptime, recovery, durability ve error budget tarafını tamamlar

---

## 17. KISA OZET

Bu platformun performans bütçesi yaklaşımı şudur:

- storefront yüzeyleri hızlı hissettirmelidir
- checkout/payment/order zinciri gecikmeye duyarlıdır ama doğruluk önceliklidir
- shipment ve eligibility async zinciri kontrollü gecikme ile çalışabilir
- panel yüzeylerinde audit ve doğruluk, ham hızdan daha önemlidir
- medya/story tarafında algısal performans ayrıca hedeflenir
- timeout ve latency tek başına domain failure anlamına gelmez