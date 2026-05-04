# KRITIK_KARAR_KUMELERI

Bu dosya, kodlamaya başlamadan önce birlikte okunması ve tek karara bağlanması gereken yüksek bağlılık kümelerini içerir.

Her kümede:
- çatışma alanı
- geçerli kanonik karar
- birlikte okunacak dosyalar
- kodlama öncesi netleşmesi gereken odak
tanımlanır.

---

## KUME 1 — STORY ↔ KEŞFET ↔ ARAMA ↔ MEDYA

### Birlikte okunacak dosyalar
5-story sistemi(6).md  
7-keşfet sistemi(3).md  
12- Arama Sistemi(1).md  
34-kullanıcı story sistemi.md  
50-medya sistemş asset  sitemi.md  
37-öneri ve sıralama sistemi.md  

### Çatışma alanı
- Hangi story türü hangi yüzeyde görünür?
- Keşfet üst şeridinin tek amacı nedir?
- Keşfet araması ne kadar bağlamsal, ne kadar genel davranır?
- Kullanıcı story’leri sistemde kalırken görünürlük nasıl sınırlandırılır?
- Medya sıcak görünürlük ile arşiv yaşam döngüsü nasıl ayrılır?

### Geçerli kanonik karar
- Keşfet üst story şeridinde yalnız mağaza tanıtım story’leri bulunur.
- Ürün tanıtım story’leri keşfet üst şeridinde yer almaz.
- Kullanıcı story keşfete düşmez.
- Keşfet araması bağlamsal olarak video-merkezli olabilir; ancak kullanıcı deneyimi kör ve kapalı arama duvarına dönüşmez.
- Kullanıcı story içerikleri sistemde kalabilir; fakat sıcak görünürlük sınırsız değildir.
- Medya truth’u ile görünür medya katmanı ayrıdır.
- Hot / warm / cold storage mantığı desteklenebilir.

### Kodlama öncesi netleşecek odak
- Story yüzey matrisi
- Keşfet sonuç davranışı
- UGC görünürlük süresi
- Medya yaşam döngüsü
- Görünür story seçim mantığı

---

## KUME 2 — ÜYELİK ↔ SEPET ↔ CHECKOUT ↔ ADRES ↔ YETKİ

### Birlikte okunacak dosyalar
23-üyelik giriş sistemi.md  
13-sepet sistemi (1).md  
14-checkout sistemi (1).md  
24-adres sistem,.md  
25-kural -yetki sistemi.md  

### Çatışma alanı
- Misafir kullanıcı nerede serbest, nerede sınırlı?
- Guest checkout hangi sınırlar içinde çalışır?
- Adres kimde tutulur, siparişte nasıl sabitlenir?
- Sepet ile checkout arasındaki hak ve doğrulama sınırı nedir?
- Eligibility ve guard katmanları hangi aşamada devreye girer?

### Geçerli kanonik karar
- Misafir kullanıcı keşif yapabilir.
- Misafir kullanıcı sosyal ve sahiplik bağlı write aksiyonları yapamaz.
- Kontrollü guest checkout açıktır; bu, sosyal hak açan bir model değildir.
- Sepete ekleme rezervasyon anlamına gelmez.
- Checkout, sepet değildir; ödeme de değildir.
- Address truth kullanıcı hesabında yönetilir; siparişte snapshot olarak sabitlenir.
- Guard yapısı auth + role/scope + ownership + eligibility katmanlarıyla çalışır.

### Kodlama öncesi netleşecek odak
- Guest checkout sınırı
- Login → checkout → order görünürlüğü akışı
- Sepet merge kuralları
- Address snapshot kuralı
- Can_Checkout / Can_Pay eligibility koşulları

---

## KUME 3 — STOK ↔ FİYAT ↔ KAMPANYA ↔ KUPON ↔ MUTABAKAT

### Birlikte okunacak dosyalar
27-merkezi stok sistemi.md  
29-merkezi fiyat sistemi.md  
35-kampanya sistemi.md  
46-kupon sistemi.md  
47-finansal mutabakat  hakediş sistemi.md  
1-havuz sistemi(8).md  

### Çatışma alanı
- Baz fiyat kimden gelir, satış fiyatını kim kurar?
- Stok truth’u merkeziyken mağaza görünürlüğü nasıl çalışır?
- Kampanya ve kupon aynı anda nasıl davranır?
- Kupon sponsor etkisi kime yansır?
- Effective payable price hangi katmanlardan sonra oluşur?
- İndirim ve düzeltme finansal olarak nasıl parçalanır?

### Geçerli kanonik karar
- Baz fiyat tedarikçiden gelir.
- Satış fiyatını platform kurar.
- Fenomen bağımsız fiyat motoru değildir.
- Stok görünürlüğü dağıtık olabilir; stok gerçeği dağıtık olamaz.
- Kampanya, merkezi fiyat sisteminin üstündeki özel ticari rejim katmanıdır.
- Kupon uygulanmadan önce sponsor modeli bellidir.
- Effective payable price; fiyat koridoru, kampanya ve kupon etkisi birlikte değerlendirilerek oluşur.
- Tahsil edilen para ile hak edilmiş para aynı şey değildir.
- Kupon sponsor etkisi ve iade düzeltmesi kalem bazlı finans yapısına yansır.

### Kodlama öncesi netleşecek odak
- Price lock / batch activation kararı
- Kampanya + kupon kombinasyon matrisi
- Kupon sponsor modelleri
- Settlement line parçalanma mantığı
- Stok baskısı görünürlüğü

---

## KUME 4 — ÖDEME ↔ SİPARİŞ ↔ TESLİMAT ↔ İADE ↔ SİPARİŞ TAKİP ↔ PAYOUT

### Birlikte okunacak dosyalar
15-ödeme sistemi (1).md  
16-sipariş sistemi (1).md  
17- kargo ve teslimat sistemi(1).md  
18- iptal ve iade sistemi (1).md  
30-sipariş takip sistemi.md  
45-sipariş operasyon sistemi.md  
47-finansal mutabakat  hakediş sistemi.md  
54-payaut ödeme çıkış sistemi.md  

### Çatışma alanı
- Hangi anda ödeme başarılı sayılır?
- Sipariş ne zaman resmi kayıt olur?
- Sipariş ile sipariş operasyonu nasıl ayrılır?
- Teslimat ve sipariş takip ekranı aynı şey midir?
- İade/refund etkisi hangi sistemlerde görünür?
- Payout neyin üstünden, ne zaman üretilir?

### Geçerli kanonik karar
- Payment, checkout’tan ayrı state machine’dir.
- Sipariş yalnız başarılı ödeme sonrası oluşur.
- Sipariş operasyonu, sipariş truth’unun kendisi değil; iç operasyon iş akışıdır.
- Teslimat sistemi yalnız lojistik görünürlük sistemi değildir; teslimat sonrası hak eşiklerini açar.
- Sipariş takip sistemi, order + delivery + return truth’unu kullanıcı diline çeviren görünür katmandır.
- İptal teslimat öncesi, iade teslimat sonrası eksendir.
- Refund execution ile commerce/order truth aynı sistem değildir.
- Finansal mutabakat sistemi hesaplama motorudur.
- Payout sistemi icra sistemidir.
- Payable, blocked, settled ayrımı zorunludur.

### Kodlama öncesi netleşecek odak
- Payment → order transition
- Shipment ve delivery proof modeli
- Return/refund etkilerinin data zinciri
- Order tracking status mapping
- Payout eligibility ve hold/release kuralları

---

## KUME 5 — YORUM ↔ SORU-CEVAP ↔ STORY ↔ PUAN ↔ MODERASYON ↔ RISK

### Birlikte okunacak dosyalar
31-yorum ve puanlama sistemi.md  
32-soru cevap sistemi.md  
34-kullanıcı story sistemi.md  
39-ödül puan sistemi.md  
38-puan market sistemi.md  
22-moderasyon sistemi(1).md  
49-fraud risk abuse sistemi.md  

### Çatışma alanı
- Hangi katkı hangi eligibility ile açılır?
- Hangi içerik puan üretir?
- Hangi noktada moderasyon devreye girer?
- Puan ne zaman pending, ne zaman spendable olur?
- İade, silme veya abuse durumunda görünürlük ve puan nasıl etkilenir?
- Risk sistemi ile moderasyon sistemi nasıl ayrılır?

### Geçerli kanonik karar
- Yorum yalnız satın alınmış ve teslim edilmiş ürün için açılır.
- Kullanıcı story yalnız satın alınmış ve teslim edilmiş ürün için açılır.
- Soru ürün bazlıdır.
- Nihai görünür resmi cevap owner’ı platformdur.
- Fenomen resmi cevap aktörü değildir.
- Tedarikçi kontrollü taslak bilgi katkısı verebilir; yayın owner’ı yine platformda kalır.
- Ödül puanı ile ürün yıldız puanı aynı şey değildir.
- Puan tek katmanlı değildir: pending / vested / spendable ayrımı vardır.
- Puan market yalnız spendable bakiye kullanır.
- Moderasyon ve risk ayrı ama bağlı sistemlerdir.
- Fraud/risk sistemi cezalandırma makinesi değil, kademeli koruma sistemidir.

### Kodlama öncesi netleşecek odak
- Eligibility rulebook
- Moderation queue noktaları
- Reward point lifecycle
- Puan geri alma kuralları
- Abuse tespiti ve escalation mantığı

---

## KUME 6 — FENOMEN ↔ TEDARIKÇI ↔ ADMIN ↔ PANEL ↔ YETKİ

### Birlikte okunacak dosyalar
40-admin sistemi.md  
41- fenomen yönetim sistemi.md  
42-fenomen mağaza yönetim panel sistemi.md  
43-tedarikçi panel sistemi.md  
44-tedarikçi yönetim sistemi.md  
25-kural -yetki sistemi.md  

### Çatışma alanı
- Kim yönetim owner’ı, kim self-service kullanıcı?
- Panel neyi görebilir ama değiştiremez?
- Başvuru, onay, askı, kısıt ve görünürlük kararlarını kim verir?
- Fenomen ve tedarikçi panelleri hangi sınırda durur?
- Audit zorunluluğu hangi aksiyonlarda devreye girer?

### Geçerli kanonik karar
- Fenomen bağımsız satıcı değildir; kontrollü mağaza işleten aktördür.
- Tedarikçi ürün ve operasyon girdisi sağlar; ticari son kararı vermez.
- Fenomen paneli self-service mağaza yönetim alanıdır.
- Tedarikçi paneli ürün/fulfillment çalışma alanıdır.
- Admin paneli üst denetim ve kurallı müdahale merkezidir.
- Panel direct write yapmaz; owner modüle protected action / command gönderir.
- Audit log kritik panel ve yönetim aksiyonlarında zorunludur.

### Kodlama öncesi netleşecek odak
- Başvuru lifecycle state’leri
- Kategori yetkisi modelleri
- Restriction / suspension kararları
- Panel action catalog
- Admin audit taxonomy

---

## KUME 7 — ANALITIK ↔ ARAMA INDEKSLEME ↔ RANKING ↔ RISK

### Birlikte okunacak dosyalar
48-arka paln analatik ölçümleme sistemi.md  
51-arama  indeksleme sistemi.md  
37-öneri ve sıralama sistemi.md  
49-fraud risk abuse sistemi.md  
12- Arama Sistemi(1).md  

### Çatışma alanı
- Retrieval ile ranking sınırı nerede başlar?
- Analytics hangi katmanda karar vermez, yalnız sinyal üretir?
- Risk sistemi hangi metrikleri kullanır?
- Search quality metriği nasıl oluşur?
- Event taxonomy ile ranking/risk sinyalleri nasıl bağlanır?

### Geçerli kanonik karar
- Ölçümleme sistemi karar vermez; karar sistemlerini besler.
- Retrieval / indexing aday setini üretir.
- Ranking final ordering ve scoring alanıdır.
- Risk sistemi veri toplama sistemi değil; sinyal ve koruma sistemidir.
- Arka planda çoklu retrieval hattı olabilir; kullanıcıya tek ürün evreni hissi korunur.

### Kodlama öncesi netleşecek odak
- Event taxonomy
- Search document modeli
- Ranking signal seti
- Risk signal seti
- Query → click → PDP → order ölçümü

---

## KUME 8 — ROADMAP ↔ SISTEM AGACI ↔ TUM SISTEMLER

### Birlikte okunacak dosyalar
60-KODLAMAYA HAZIRLIK YOL HARİTASI.md  
platform sistem ağacı (1).md  
25-kural -yetki sistemi.md  

### Çatışma alanı
- Yol haritası ile sistem ağacı aynı öncelik diliyle mi konuşuyor?
- Hangi hazırlık çıktısı hangi sisteme dayanıyor?
- Kodlamaya hazır olma kapısı hangi somut artefact’larla ölçülecek?

### Geçerli kanonik karar
- Yol haritası, sistemleri kodlama öncesi disiplinli hale getirmek içindir.
- Platform sistem ağacı, hangi sistemlerin çekirdek ve öncelikli olduğunu gösteren referans omurgadır.
- Kural/yetki sistemi, tüm aşamaların owner ve write sınırını belirleyen temel anayasal dosyadır.

### Kodlama öncesi netleşecek odak
- Aşama 1 çıktıları
- Aşama 2 owner matrisi
- Aşama 5 API-first sözleşmeler
- Aşama 7 NFR hedefleri
- Aşama 15 coding readiness gate