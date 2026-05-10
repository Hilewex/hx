# NFR_TARGETS

Bu dosya, platformun kodlama öncesi zorunlu non-functional requirement (NFR) hedeflerini tanımlar.

Amaç:
- performans, güvenilirlik, kapasite ve operasyon kalitesini baştan netleştirmek
- “çalışıyor” ile “yayınlanabilir kalitede çalışıyor” arasındaki farkı yazılı hale getirmek
- sonraki kapasite, performans bütçesi ve reliability belgeleri için üst hedef seti oluşturmak

Net kural:
- functional doğru olması tek başına yeterli değildir
- kritik kullanıcı akışları ölçülebilir hız ve dayanıklılık hedefi taşımalıdır
- owner truth bozulmadan hızlı olmak esastır
- BFF/read model hız hedefi, owner truth doğruluğunu ezemez
- degrade olabilen yüzeyler dürüst degrade olmalı, sessiz yalan üretmemelidir

---

## 1. KAPSAM

Bu NFR hedefleri ilk fazda şu alanları kapsar:

- Public storefront surfaces
- App checkout / payment / order akışı
- Shipment / delivery görünürlüğü
- Notification center
- Panel read surfaces
- Payment / shipment / payout gibi kritik dış entegrasyon zincirleri
- Event ingestion ve async propagation
- Video/story/media yüzeyleri
- Search / discover / home read surfaces

---

## 2. NFR HEDEF PRENSIPLERI

## 2.1 Öncelik sırası
Bu platformda NFR önceliği şu sıradadır:

1. **Doğruluk**
2. **Tutarlılık**
3. **Kritik akış hızı**
4. **Dayanıklılık**
5. **Operasyonel gözlemlenebilirlik**
6. **Ölçeklenebilirlik**
7. **Maliyet verimliliği**

Net kural:
Hız için truth veya owner boundary bozulmaz.

## 2.2 Yüzey bazlı yaklaşım
Her yüzey aynı hedefi taşımaz.

Örnek:
- checkout/payment akışı düşük gecikme + yüksek doğruluk ister
- discover/home yüzeyleri eventual consistency kabul edebilir
- panel dashboard read’leri kısa gecikme toleranslı olabilir
- payout akışı hızdan çok güvenilirlik ve audit ister

## 2.3 Hedef türleri
Bu aşamada hedefler şu sınıflarda sabitlenir:
- latency
- availability
- success rate
- error budget
- freshness / propagation lag
- recoverability
- operability

---

## 3. KRITIK KULLANICI AKISLARI ICIN HEDEFLER

---

## 3.1 Public read surfaces

Kapsam:
- home
- discover
- category / PLP
- PDP
- public storefront
- public search

Hedef:
- hızlı ilk yanıt
- dürüst degrade
- private field sızıntısı olmadan güvenli public response

Başarı kriteri:
- normal durumda kullanıcı “bekliyor” hissine düşmemeli
- dependency sorunu varsa ya 503 ya da dürüst partial/degraded davranış görülmeli

Öncelik:
- yüksek hız
- orta/yüksek availability
- eventual consistency kabul edilebilir

---

## 3.2 Checkout -> Payment -> Order akışı

Kapsam:
- checkout review
- payment start
- payment callback/capture
- order create

Hedef:
- kullanıcı tarafında net ve hızlı ilerleme
- duplicate işlem üretmeme
- belirsiz dış sonuçların kontrollü kapanması
- payment captured ile order created ayrımını koruma

Başarı kriteri:
- checkout review hızlı ve güvenilir olmalı
- payment initiate belirsiz kaldığında kullanıcıya yanlış kesinlik verilmemeli
- aynı checkout/payment bağlamı duplicate order üretmemeli

Öncelik:
- çok yüksek doğruluk
- çok yüksek state güvenliği
- yüksek latency hassasiyeti

---

## 3.3 Shipment / delivery görünürlüğü

Kapsam:
- shipment state
- tracking projection
- delivered sonrası hak açılması

Hedef:
- shipment truth ile tracking projection ayrımı korunmalı
- delivery event duplicate-safe işlenmeli
- delivered sonrası eligibility etkileri kabul edilebilir gecikme içinde tamamlanmalı

Başarı kriteri:
- tracking ekranı stale olabilir ama yalan söylememeli
- delivered callback duplicate gelirse ikinci truth mutation oluşmamalı

Öncelik:
- yüksek doğruluk
- orta latency hassasiyeti
- yüksek event güvenliği

---

## 3.4 Review / story / verified purchase / reward etkileri

Kapsam:
- delivered sonrası verified purchase
- review eligibility
- story eligibility
- reward entitlement impact

Hedef:
- line-level haklar yanlış açılmamalı
- iade/iptal/refund sonrası etkiler doğru geri alınabilmeli
- propagation kabul edilebilir gecikmeyle ama güvenli biçimde tamamlanmalı

Başarı kriteri:
- eligibility yanlış kişide/yanlış line’da açılmamalı
- return/refund sonrası revoke/update izlenebilir olmalı

Öncelik:
- yüksek doğruluk
- orta gecikme toleransı

---

## 3.5 Panel read ve protected actions

Kapsam:
- admin panel
- support panel
- moderation panel
- finance/payout/settlement panel

Hedef:
- panel read yüzeyleri makul hızda cevap vermeli
- protected action’lar scope/permission/guard/audit ile güvenli çalışmalı
- panel direct write owner gibi davranmamalı

Başarı kriteri:
- action sonucu accepted olabilir ama audit izi kaybolmamalı
- invalid transition, permission eksikliği ve actor-not-allowed durumları açık ayrılmalı

Öncelik:
- yüksek güvenlik
- yüksek auditability
- orta latency hassasiyeti

---

## 3.6 Video/story/media yüzeyleri

Kapsam:
- story strip
- viewer
- product story/video yüzeyleri

Hedef:
- first-frame bekleme süresi kabul edilebilir olmalı
- upload/process/ready/published state ayrımı korunmalı
- medya hazırlık gecikmesi UI’da dürüst yönetilmeli

Başarı kriteri:
- medya hazır değilse “hazır” gibi sunulmamalı
- first-frame deneyimi platformu ağır hissettirmemeli

Öncelik:
- yüksek algısal performans
- orta/ yüksek medya pipeline güvenilirliği

---

## 4. SERVIS VE SISTEM HEDEFLERI

---

## 4.1 API latency hedefleri

Bu aşamada kesin sayı değil, hedef seviyesi tanımlanır.
Kesin bütçeler `PERFORMANCE_BUDGETS.md` içinde yazılacaktır.

Sınıflar:
- **L-A:** kullanıcıya çok hızlı dönmesi gereken yüzeyler
- **L-B:** hızlı ama biraz daha toleranslı yüzeyler
- **L-C:** async veya operasyonel yüzeyler

Örnek eşleme:
- checkout review, payment start = L-A
- PDP, home, discover, category = L-A / L-B
- panel listeleri = L-B
- payout/sandbox/ops surfaces = L-C

## 4.2 Availability hedefleri

Sınıflar:
- **A-A:** çekirdek ticari akış
- **A-B:** kritik ama çekirdek olmayan yüzey
- **A-C:** operasyonel / iç araç yüzeyi

Örnek:
- payment/order/checkout = A-A
- shipment tracking, notification center = A-B
- bazı panel analytics yüzeyleri = A-C

## 4.3 Freshness / lag hedefleri

Sınıflar:
- **F-A:** neredeyse anlık
- **F-B:** kısa gecikme kabul edilir
- **F-C:** orta gecikme kabul edilir

Örnek:
- payment/order state = F-A
- delivered sonrası eligibility propagation = F-B
- discover/search/dashboard projection = F-C

---

## 5. GÜVENILIRLIK VE HATA HEDEFLERI

## 5.1 Duplicate-safe hedefi
Aşağıdaki alanlarda duplicate-safe davranış zorunludur:
- payment callback
- shipment/delivery callback
- payout result
- retry edilen internal command’ler

## 5.2 Unknown-result yönetimi
Aşağıdaki alanlarda “unknown_result” first-class kabul edilir:
- payment initiate timeout
- payout submit timeout
- shipment create belirsizliği

Hedef:
- unknown_result sessizce başarısız sayılmamalı
- reconciliation ile kapatılmalı

## 5.3 Honest degradation hedefi
Read yüzeyleri mümkün olduğunda:
- ya dürüst degraded döner
- ya da güvenli biçimde fail eder

Sessiz yalan fallback kabul edilmez.

---

## 6. GÖZLEMLENEBILIRLIK HEDEFLERI

Hedef:
- kritik akışların izlenebilir olması

Zorunlu izler:
- request_id
- command_id
- event_id
- provider_reference
- previous_state
- next_state
- actor/service identity

Kritik alanlar:
- checkout -> payment -> order
- shipment delivered
- return -> refund
- settlement adjustment
- payout action/result
- panel protected actions

Başarı kriteri:
- incident anında işlem zinciri takip edilebilmeli

---

## 7. OPERASYONEL HEDEFLER

## 7.1 Recoverability
Hedef:
- kritik hata sonrası sistem geri döndürülebilir veya kontrollü stabilize edilebilir olmalı

## 7.2 Manual intervention support
Hedef:
- unknown_result ve provider conflict gibi alanlarda manuel inceleme desteklenmeli

## 7.3 Auditability
Hedef:
- finansal ve kritik karar alanlarında audit izi zorunlu olmalı

---

## 8. NFR SINIFLANDIRMA TABLOSU

| Alan | Latency Önceliği | Reliability Önceliği | Freshness Önceliği | Audit Önceliği |
|---|---|---|---|---|
| Public home/discover/category/search | Yüksek | Orta/Yüksek | Orta | Düşük |
| PDP | Yüksek | Yüksek | Orta | Düşük |
| Checkout / payment / order | Çok yüksek | Çok yüksek | Çok yüksek | Yüksek |
| Shipment / delivery | Orta | Çok yüksek | Yüksek | Yüksek |
| Eligibility / reward propagation | Orta | Yüksek | Orta/Yüksek | Yüksek |
| Panel protected actions | Orta | Çok yüksek | Düşük | Çok yüksek |
| Settlement / payout | Düşük/Orta | Çok yüksek | Orta | Çok yüksek |
| Notification | Düşük/Orta | Orta | Orta | Orta |
| Video / story viewer | Yüksek | Orta/Yüksek | Orta | Düşük |

---

## 9. IMPLEMENTASYON ICIN NET KARARLAR

1. NFR hedefleri functional gereksinimlerden ayrı ve zorunlu kabul edilir
2. Checkout/payment/order zinciri en yüksek öncelikli NFR alanıdır
3. Shipment/delivery ve callback alanlarında duplicate-safe işleme zorunludur
4. Read surfaces hız için truth doğruluğunu bozamaz
5. Eligibility/reward propagation async olabilir ama yanlış hak açamaz
6. Panel action’larda auditability hızdan daha önceliklidir
7. Video/story alanında algısal performans hedefi ayrıca korunur
8. Unknown-result alanları resmi state olarak ele alınır
9. Dürüst degrade davranışı zorunludur

---

## 10. DEVAM DOSYALARI ICIN ETKI

Bu dosya sonrası:
- `CAPACITY_ASSUMPTIONS.md` bu hedeflerin hangi trafik varsayımıyla kurulduğunu yazar
- `PERFORMANCE_BUDGETS.md` bu hedefleri sayı ve akış bazında böler
- `RELIABILITY_TARGETS.md` uptime, recovery, error budget ve durability hedeflerini netleştirir

---

## 11. KISA OZET

Bu platformun NFR yaklaşımı şudur:

- doğruluk hızdan önce gelir
- kritik ticari akışlar hem hızlı hem duplicate-safe olmalıdır
- read model ve projection gecikebilir ama yalan söylemez
- async propagation kabul edilir ama yanlış truth üretilemez
- panel ve finansal alanlarda auditability temel hedeftir
- medya/story yüzeylerinde algısal performans ayrıca hedeflenir
- unknown_result ve degraded durumları resmi olarak yönetilir