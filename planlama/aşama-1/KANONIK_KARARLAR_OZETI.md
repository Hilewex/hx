# KANONIK_KARARLAR_OZETI

## 1. Kimlik ve erişim
- Misafir kullanıcı platformda dolaşabilir, ürün inceleyebilir, açık yüzeyleri görebilir.
- Misafir kullanıcı sosyal ve sahiplik bağlı write aksiyonları yapamaz.
- Kontrollü guest checkout açıktır; bu, sosyal hak açan bir model değildir.
- Kullanıcı hesabı ile fenomen hesabı aynı şey değildir.
- Aynı kimlik altında shopper profile / fenomen profile geçişi desteklenebilir; bu role merge değildir.

## 2. Sistem mimarisi ve truth sahipliği
- Owner dışı write yoktur.
- BFF read-only aggregation katmanıdır.
- Panel direct write yapmaz; owner modüle protected action / command gönderir.
- UI truth üretmez.
- Event, truth mutate etmez; bilgilendirme ve eventual consistency amaçlıdır.

## 3. Ürün, havuz ve katalog
- Ürün kaynağı tedarikçidir.
- Ticari otorite platformdur.
- Onaysız ürün satış havuzuna ve fenomenlere açılmaz.
- Taksonomi truth’u platformdadır.
- Varyant, yalnız görsel seçenek değil; satılabilir ticari alt birimdir.

## 4. Fiyat, kampanya ve kupon
- Baz fiyat tedarikçiden gelir.
- Satış fiyatını platform kurar.
- Fenomen bağımsız fiyat motoru değildir.
- Kampanya, merkezi fiyat sisteminin üstündeki özel ticari rejim katmanıdır.
- Kupon uygulanmadan önce sponsor modeli bellidir.
- Effective payable price; fiyat koridoru, kampanya ve kupon etkisi birlikte değerlendirilerek oluşur.
- Büyük baz fiyat değişimleri kontrollü aktivasyon mantığıyla ele alınır.

## 5. Stok ve sepet
- Stok görünürlüğü dağıtık olabilir; stok gerçeği dağıtık olamaz.
- Aynı ürün farklı mağazalarda görünse de stok truth’u tektir.
- Sepete ekleme rezervasyon anlamına gelmez.
- Kritik düşük stokta dürüst baskı/uyarı görünürlüğü açılabilir.

## 6. Checkout, ödeme ve sipariş
- Checkout, sepet değildir; ödeme de değildir.
- Payment, checkout’tan ayrı state machine’dir.
- Sipariş yalnız başarılı ödeme sonrası oluşur.
- Sipariş operasyonu, sipariş truth’unun kendisi değil; iç operasyon iş akışıdır.
- Sipariş takip sistemi, order + delivery + return truth’unu kullanıcı diline çeviren görünür katmandır.

## 7. Teslimat, iade ve refund etkisi
- Teslimat sistemi yalnız lojistik görünürlük sistemi değildir; teslimat sonrası hak eşiklerini açar.
- İptal teslimat öncesi, iade teslimat sonrası eksendir.
- Refund execution ile commerce/order truth aynı sistem değildir.
- İade etkisi; finans, puan, verified purchase ve görünürlük katmanlarına yansır.

## 8. Soru-cevap, yorum, story ve puan
- Yorum yalnız satın alınmış ve teslim edilmiş ürün için açılır.
- Kullanıcı story yalnız satın alınmış ve teslim edilmiş ürün için açılır.
- Soru ürün bazlıdır.
- Nihai görünür resmi cevap owner’ı platformdur.
- Fenomen resmi cevap aktörü değildir.
- Tedarikçi kontrollü taslak bilgi katkısı verebilir; yayın owner’ı yine platformda kalır.
- Ödül puanı ile ürün yıldız puanı aynı şey değildir.
- Puan tek katmanlı değildir: pending / vested / spendable ayrımı vardır.
- Puan market yalnız spendable bakiye kullanır.
- İade veya kötüye kullanım durumlarında puan geri alınabilir.

## 9. Story, keşfet ve arama
- Keşfet üst story şeridinde yalnız mağaza tanıtım story’leri bulunur.
- Ürün tanıtım story’leri keşfet üst şeridinde yer almaz.
- Kullanıcı story keşfete düşmez.
- Keşfet araması bağlamsal olarak video-merkezli olabilir; ancak kullanıcı deneyimi kör ve kapalı arama duvarına dönüşmez.
- Arka planda çoklu retrieval hattı olabilir; kullanıcıya tek ürün evreni hissi korunur.

## 10. Fenomen, tedarikçi ve paneller
- Fenomen bağımsız satıcı değildir; kontrollü mağaza işleten aktördür.
- Tedarikçi ürün ve operasyon girdisi sağlar; ticari son kararı vermez.
- Fenomen paneli self-service mağaza yönetim alanıdır.
- Tedarikçi paneli ürün/fulfillment çalışma alanıdır.
- Admin paneli üst denetim ve kurallı müdahale merkezidir.

## 11. Finans zinciri
- Tahsil edilen para ile hak edilmiş para aynı şey değildir.
- Finansal mutabakat sistemi hesaplama motorudur.
- Payout sistemi icra sistemidir.
- Payable, blocked, settled ayrımı zorunludur.
- Kupon sponsor etkisi ve iade düzeltmesi kalem bazlı finans yapısına yansır.

## 12. Medya ve görünürlük yaşam döngüsü
- Yüklenen dosya ile yayına uygun medya aynı şey değildir.
- Medya truth’u ile görünür medya katmanı ayrıdır.
- Kullanıcı story içerikleri sistemde kalabilir; fakat sıcak görünürlük sınırsız değildir.
- Hot / warm / cold storage mantığı desteklenebilir.

## 13. Analitik, audit ve risk
- Ölçümleme sistemi karar vermez; karar sistemlerini besler.
- Audit log kritik panel ve yönetim aksiyonlarında zorunludur.
- Fraud/risk sistemi cezalandırma makinesi değil, kademeli koruma sistemidir.
- Moderasyon ve risk ayrı ama bağlı sistemlerdir.