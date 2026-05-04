# CAPACITY_ASSUMPTIONS

Bu dosya, platformun ilk faz mimari ve performans hedeflerinin hangi kapasite varsayımlarına dayandığını tanımlar.

Amaç:
- trafik, kullanıcı, sipariş, medya ve panel kullanımı için başlangıç kapasite çerçevesi oluşturmak
- NFR hedeflerinin hangi yük seviyesinde geçerli olduğunu görünür kılmak
- implementasyon sırasında “küçük sistem mi, orta sistem mi, ani büyümeye hazır mı” sorusunu netleştirmek
- gereksiz over-engineering ile tehlikeli under-sizing arasında dengeli başlangıç yapmak

Net kural:
- bu belge kesin üretim rakamı değil, planlama varsayımıdır
- varsayımlar konservatif ama gerçekçi olmalıdır
- ilk faz kapasite modeli, çok büyük enterprise ölçeği değil, kontrollü büyüyen canlı ürün başlangıcı hedefler
- kritik zincirler kapasite baskısında bile truth güvenliğini korumalıdır

---

## 1. KAPSAM

Bu kapasite varsayımları ilk fazda şu alanları kapsar:

- Public storefront traffic
- Authenticated app traffic
- Checkout / payment / order hacmi
- Shipment / delivery event hacmi
- Review / story / reward propagation hacmi
- Panel kullanıcıları
- Notification üretimi
- Event ingestion
- Video/story/media kullanımı

Bu belge ilk üretim fazı + erken büyüme dönemi için temel referanstır.

---

## 2. PLANLAMA SEVIYESI

Bu platform için başlangıç planlama seviyesi:

### Seviye S2 — Kontrollü canlı büyüme
Tanım:
- gerçek kullanıcı trafiği alacak
- gerçek sipariş akışı olacak
- tek ülke / sınırlı pazar başlangıcı için makul büyüme bekleniyor
- ilk gün hiper-ölçek beklenmiyor
- ama mimari sonradan kırılmadan büyüyebilmelidir

Net kural:
İlk faz için “küçük demo sistem” varsayımı yapılmaz.
Aynı şekilde “devasa global ölçek” varsayımı da yapılmaz.

---

## 3. KULLANICI VE TRAFIK VARSAYIMLARI

---

## 3.1 Toplam kayıtlı kullanıcı varsayımı

İlk faz planlama varsayımı:
- düşük yüz binler bandına uzayabilecek kullanıcı tabanı
- aktif kullanıcı yoğunluğu bunun sınırlı alt kümesi

Yorum:
- kayıtlı kullanıcı sayısı ile eşzamanlı aktif kullanıcı sayısı aynı değildir
- NFR ve kapasite planı ağırlıkla aktif kullanıcı üstünden yapılmalıdır

---

## 3.2 Eşzamanlı aktif kullanıcı varsayımı

Planlama varsayımı:
- normal günde orta yoğunluk
- kampanya/tepe saatlerde bunun birkaç katına çıkabilen pik

Kural:
- public read surfaces, authenticated app trafiğinden daha yüksek eşzamanlı yük alabilir
- checkout eşzamanlılığı public browse trafiğinden düşük ama daha kritik kabul edilir

---

## 3.3 Public vs authenticated trafik oranı

Varsayım:
- public browse trafiği, authenticated write/interaction trafiğinden belirgin biçimde yüksektir
- checkout ve payment trafiği public traffic’in küçük ama yüksek değerli alt kümesidir

Yorum:
Bu nedenle:
- read yüzeyleri ölçek açısından geniş
- commerce mutation zinciri ise hacimce dar ama kritik
olarak planlanır

---

## 4. COMMERCE HACIM VARSAYIMLARI

---

## 4.1 Sepet ve checkout hacmi

Varsayım:
- her aktif kullanıcının checkout’a dönüşme oranı sınırlıdır
- çok sayıda browse işlemi, daha az sayıda cart işlemi, daha da az sayıda checkout oluşur

Planlama kuralı:
- cart hacmi checkout’tan yüksek
- checkout review çağrıları payment start’tan yüksek
- payment start çağrıları order create’ten biraz yüksek olabilir
- duplicate/yeniden deneme davranışı özellikle payment hattında hesaba katılmalıdır

---

## 4.2 Sipariş hacmi

Varsayım:
- günlük sipariş hacmi browse trafiğine göre dar ama kritik
- kampanya dönemlerinde anlık artış olabilir
- order create hattı düşük gecikme + yüksek güvenilirlik ister

Planlama kuralı:
- order hacmi payment callback/retry nedeniyle görünen payment event hacminden düşük olabilir
- aynı sipariş bağlamı için duplicate create engellenmelidir

---

## 4.3 İade / refund hacmi

Varsayım:
- return/refund hacmi toplam sipariş hacminin küçük yüzdesi olarak planlanır
- ama operasyonel ve finansal ağırlığı yüksektir

Planlama kuralı:
- hacim düşük diye reliability hedefi düşürülmez
- refund ve adjustment işleme kapasitesi küçük ama güvenli tutulur

---

## 5. SHIPMENT VE DELIVERY VARSAYIMLARI

---

## 5.1 Shipment hacmi

Varsayım:
- siparişlerin önemli kısmı shipment gerektirir
- bir sipariş birden fazla shipment üretebilir
- bu nedenle shipment count, order count’tan yüksek olabilir

Planlama kuralı:
- shipment create ve tracking update hacmi order hacminden ayrı düşünülür

---

## 5.2 Delivery event hacmi

Varsayım:
- her shipment için birden fazla event gelebilir
- provider duplicate callback veya out-of-order callback riski vardır

Planlama kuralı:
- delivery event ingestion kapasitesi, shipment sayısından daha yüksek planlanmalıdır
- event dedupe ve append-only davranış yük altında bozulmamalıdır

---

## 6. ELIGIBILITY / REWARD YUK VARSAYIMLARI

---

## 6.1 Delivered sonrası propagation hacmi

Varsayım:
- her delivered line, verified purchase / review eligibility / story eligibility / reward impact gibi birden fazla yan etki doğurabilir

Planlama kuralı:
- propagation zinciri order hacminden değil, delivered line hacminden türetilerek düşünülmelidir
- async worker kapasitesi bu yan etki çoğalmasını kaldırmalıdır

---

## 6.2 Revoke / geri etki hacmi

Varsayım:
- return/refund hacmi düşük olsa da revoke/update zinciri kritik
- geri etki hacmi düşük frekanslı ama önemli durumdur

Planlama kuralı:
- revoke işlemleri düşük hacim nedeniyle ihmal edilmez

---

## 7. NOTIFICATION HACIM VARSAYIMLARI

---

## 7.1 Notification intent üretimi

Varsayım:
- tek bir domain olayından birden çok notification intent türeyebilir
- notification hacmi sipariş hacminden büyük olabilir

Örnek:
- order created
- shipment delivered
- return decision
- refund result
- support update

Planlama kuralı:
- notification queue hacmi commerce mutation hacminden ayrı ve daha yüksek çarpanlı planlanmalıdır

---

## 7.2 Email sandbox hacmi

İlk fazda:
- gerçek email provider aktif değil
- sandbox veya controlled send flow vardır

Planlama kuralı:
- email send hacmi gerçek kullanıcı teslim başarımı değil, orchestration doğrulama seviyesi için düşünülür

---

## 8. PANEL KULLANIM VARSAYIMLARI

---

## 8.1 Panel kullanıcı sayısı

Varsayım:
- panel kullanıcı sayısı storefront/app kullanıcılarından çok daha azdır
- eşzamanlı panel yükü nispeten düşüktür

Panel tipleri:
- admin
- support
- moderation
- finance
- supplier / creator panel kullanıcıları

## 8.2 Panel davranış yükü

Varsayım:
- panelde write/protected action hacmi düşüktür
- ama read filtreleme/listeme sorguları ağır olabilir

Planlama kuralı:
- panel throughput değil, doğruluk + audit + query verimliliği önceliklidir

---

## 9. MEDIA / STORY VARSAYIMLARI

---

## 9.1 Story / video görüntüleme hacmi

Varsayım:
- story/video yüzeyleri browse trafiğine yakın yüksek okuma yükü üretebilir
- create/upload hacmi consume hacminden çok düşüktür

Planlama kuralı:
- read ağır, write görece hafif model kabul edilir

## 9.2 Upload / processing hacmi

İlk fazda gerçek CDN/media vendor aktif değildir.
Buna rağmen planlama yaklaşımı:
- upload event sayısı sınırlı
- processing ve ready/published state yönetimi kontrollü
- gerçek global media scale henüz hedef değil

---

## 10. ARAMA / DISCOVER / HOME VARSAYIMLARI

---

## 10.1 Read yoğunluğu

Varsayım:
- home / discover / category / search çağrıları platformun en yüksek read yüzeylerindendir

Planlama kuralı:
- bu yüzeyler commerce write yükünden çok daha fazla trafik alabilir
- eventual consistency kabul edilir
- cached/read model yaklaşımı gereklidir

## 10.2 Arama ve discover yenilenme sıklığı

Varsayım:
- tüm write olayları anında discover/search görünmek zorunda değildir
- kontrollü propagation lag kabul edilir

---

## 11. EVENT HACIM VARSAYIMLARI

---

## 11.1 Event çarpanı

Varsayım:
Tek bir domain işleminden birden fazla event üretilebilir.

Örnek:
- payment captured
- order created
- shipment delivered
- eligibility active
- notification intent
- reward impact

Planlama kuralı:
- event hacmi doğrudan order sayısına eşit kabul edilmez
- event ingestion kapasitesi çarpanlı düşünülmelidir

## 11.2 Duplicate event varsayımı

Varsayım:
- payment callback duplicate olabilir
- shipment callback duplicate olabilir
- payout result duplicate olabilir

Planlama kuralı:
- event/command dedupe kapasite planının parçasıdır, istisna değildir

---

## 12. KAPASITE ARTIS VARSAYIMI

Bu platform için büyüme varsayımı:
- ilk fazda orta seviye canlı yük
- kampanya dönemlerinde pik artış
- sonraki fazlarda modül bazlı büyüme

Büyüme sırası muhtemelen:
1. public read traffic
2. search/discover/home yükü
3. notification hacmi
4. shipment/tracking olayları
5. payment/order hacmi
6. panel operasyon hacmi

Net kural:
Büyüme her katmanda eşit olmaz.
Önce read ve event yükü büyür.

---

## 13. KAPASITE PLANLAMA PRENSIPLERI

1. Browse yükü commerce write yükünden daha yüksektir
2. Commerce write hacmi küçük ama daha kritiktir
3. Shipment event hacmi order hacminden yüksek olabilir
4. Notification intent hacmi commerce event’lerinden büyük olabilir
5. Panel kullanıcı sayısı düşük ama sorgu karmaşıklığı yüksek olabilir
6. Async propagation worker kapasitesi delivered line çarpanını kaldırmalıdır
7. Duplicate callback/load senaryosu kapasite planının parçasıdır
8. İlk fazda medya global-scale değil, kontrollü büyüme varsayılır

---

## 14. IMPLEMENTASYON ICIN NET KARARLAR

1. Sistem demo kapasitesi için değil, kontrollü canlı büyüme için tasarlanır
2. Public read surfaces en yüksek trafik yüzeyi kabul edilir
3. Checkout/payment/order zinciri hacimce dar ama kritik kabul edilir
4. Shipment ve callback hacmi order hacminden bağımsız planlanır
5. Eligibility/reward propagation delivered line hacmine göre düşünülür
6. Notification hacmi commerce truth mutation hacminden büyük olabilir
7. Panel kullanıcı hacmi düşük kabul edilir ama ağır sorgular hesaba katılır
8. Event hacmi doğrudan sipariş sayısına eşit varsayılmaz
9. Büyümenin ilk dalgası read ve async katmanda beklenir

---

## 15. DEVAM DOSYALARI ICIN ETKI

Bu belge sonrası:
- `PERFORMANCE_BUDGETS.md` hangi latency bütçesinin hangi yükte geçerli olduğunu sayılaştırır
- `RELIABILITY_TARGETS.md` bu hacim varsayımlarında uptime, recovery, data safety hedeflerini netleştirir

---

## 16. KISA OZET

Bu platform için kapasite varsayımı şudur:

- ilk faz orta ölçekli canlı kullanım hedefler
- browse/read trafiği commerce write trafiğinden belirgin biçimde yüksek olur
- shipment event ve notification hacmi order hacminden daha büyük olabilir
- async propagation delivered line bazında çarpanlı yük üretir
- panel throughput düşük, query ağırlığı görece yüksek kabul edilir
- mimari ilk günden hiper-ölçek için değil, güvenli büyüme için hazırlanır