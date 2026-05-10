# SCREEN_CONTRACTS_REFINED

## 1. Amaç

Bu dosya, storefront ve kullanıcıya dönük uygulama yüzeylerinin Aşama 8 kapsamındaki sertleştirilmiş ekran sözleşmelerini sabitler.

Bu dosyanın amacı:

* her ekranın tek amacını kesinleştirmek,
* hangi truth veya projection kaynaklarından beslendiğini ayırmak,
* hangi aksiyonların command, hangilerinin yalnız görünürlük/projection olduğunu netleştirmek,
* loading / empty / blocked / degraded / conflict / pending davranışlarını ekran bazında tanımlamak,
* mobil ve web davranış farklarını kontrollü biçimde yazmak,
* transaction ve post-order akışlarında ara durumları dürüst görünür kılmaktır.

Net kural:

* UI truth üretmez.
* BFF truth owner değildir.
* Read model truth değildir.
* Ekran sözleşmesi, owner boundary ve state machine kararlarını bozamaz.

---

## 2. Kapsam

Bu dosya şu storefront / app yüzeylerini kapsar:

### Storefront core

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP

### Commerce flow

* Sepet
* Checkout
* Ödeme
* Sipariş Detayı

### Post-order / support

* Sipariş Takip
* İptal / İade Başlangıç Yüzeyleri
* Bildirim Merkezi
* Destek Girişi

Not:
Panel yüzeyleri `PANEL_CONTRACTS.md` içindedir.

---

## 3. Ortak davranış kuralları

### 3.1 Login gate

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Misafir kullanıcı açık yüzeyleri görebilir.
* Login gate yalnız kimlik bağlı sosyal/write aksiyonları anında açılır.
* Guest checkout ticari istisnadır; login duvarı commerce akışını (sepet, checkout, ödeme) kesmez.
* Ancak guest commerce modeli sosyal hak açmaz, kalıcı hesap yetkisi üretmez.

### 3.2 Command / projection ayrımı

* Sayaçlar, özetler, rozetler projection olabilir.
* Sepete ekle, ödeme başlat, iade başlat, takip et gibi aksiyonlar command tarafıdır.
* Projection gecikebilir; command sonucu owner kurallarına göre belirlenir.

### 3.3 Dürüst degradation

* Tek blok bozuldu diye tüm ekran çökmek zorunda değildir.
* Ama eksik veri sahte tamlıkla doldurulmaz.

### 3.4 Ara durum görünürlüğü

Aşağıdaki ayrımlar ekranda korunmalıdır:

* accepted ≠ completed
* captured ≠ order_created
* approved ≠ refunded
* delivered ≠ all side effects completed
* empty ≠ error
* degraded ≠ broken

---

## 4. ANA SAYFA SÖZLEŞMESİ

### 4.1 Tek amacı

Platformun ilk vitrini olmak; kullanıcıyı keşfet, kategori, mağaza ve PDP’ye yönlendiren kontrollü giriş yüzeyi olmak.

### 4.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 4.3 Okuduğu ana alanlar

* Mağaza tanıtım story projection
* Promo / vitrin blokları
* Videolu ürün kart blokları
* Klasik ürün kart blokları
* Kategori erişim verisi
* Header chrome verisi

### 4.4 Tetiklediği aksiyonlar

* Arama aç
* Kategoriye git
* Keşfete git
* Mağazaya git
* PDP’ye git
* Giriş yap
* Sepete git
* Bildirim merkezine git

### 4.5 State görünürlüğü

* Initial loading
* Block loading
* Partial block degraded
* Empty block
* Normal state

### 4.6 Yasak davranışlar

* Ana sayfayı full sosyal feed’e çevirmek
* Kategori/PLP filtre mantığını ana sayfanın çekirdeğine taşımak

---

## 5. KEŞFET SÖZLEŞMESİ

### 5.1 Tek amacı

Yeni mağaza ve yeni ürün karşılaşmaları üretmek; ilgi ve merak yüzeyi olmak.

### 5.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 5.3 Okuduğu ana alanlar

* Mağaza tanıtım story şeridi
* Video ağırlıklı ürün akışı
* Düşük oranlı klasik kart desteği
* Hafif etkileşim projection’ları

### 5.4 Tetiklediği aksiyonlar

* Story aç
* PDP’ye git
* Mağazaya git
* Beğen
* Kaydet
* Paylaş

### 5.5 State görünürlüğü

* Feed loading
* Story loading
* Empty discover
* Degraded video feed
* Limited availability

### 5.6 Yasak davranışlar

* Keşfeti PLP’ye çevirmek
* PDP güven ve derin karar katmanını keşfete taşımak

---

## 6. ARAMA SÖZLEŞMESİ

### 6.1 Tek amacı

Kullanıcı niyetini en kısa yoldan doğru yüzeye taşımak.

### 6.2 Arama modları

* Genel platform araması
* Keşfet araması
* Katalog / ürün araması
* Gerekirse mağaza içi arama

### 6.3 State görünürlüğü

* Empty query
* Suggestion state
* Result state
* No result
* Degraded search
* Stale filter refresh

### 6.4 Yasak davranışlar

* Tek kutu olduğu için tüm arama modlarını tek davranışa indirmek
* Ürün / mağaza / kategori niyetlerini tek kaba listeye boğmak

---

## 7. KATEGORİ / PLP SÖZLEŞMESİ

### 7.1 Tek amacı

Niyetli ürün taraması ve seçim alanı açmak.

### 7.2 Okuduğu ana alanlar

* Kategori kimliği
* Alt kategori yapısı
* Filtre / facet projection’ları
* Klasik ürün kart listesi
* Tek sıra destekleyici video şeridi

### 7.3 Tetiklediği aksiyonlar

* Filtre uygula
* Sıralama değiştir
* Alt kategoriye geç
* PDP’ye git
* Hafif etkileşimler

### 7.4 State görünürlüğü

* Initial loading
* Filter loading
* Empty result
* Degraded facet
* Normal list state

### 7.5 Yasak davranışlar

* PLP’yi keşfet gibi ilgi yüzeyine çevirmek
* PDP karar derinliğini listeye taşımak

---

## 8. PDP SÖZLEŞMESİ

### 8.1 Tek amacı

Ürün kararını tamamlama ve satın alma başlatma.

### 8.2 Okuduğu ana alanlar

* Ürün çekirdek bilgi katmanı
* Ticari karar katmanı
* Satın alma aksiyon katmanı
* Etkileşim / davranış sinyali katmanı
* Fenomen mağaza bağlamı
* Yorum / puan katmanı
* Soru-cevap katmanı
* Kullanıcı deneyim story / sosyal kanıt katmanı

### 8.3 Tetiklediği aksiyonlar

* Varyant seç
* Adet seç
* Sepete ekle
* Hemen al
* Beğen
* Kaydet
* Paylaş
* Takip et
* Mağazaya git
* Soru sor
* Uygunsa yorum yaz

### 8.4 State görünürlüğü

* Loading
* Variant not selected blocked
* Out of stock
* Low stock warning
* Social/content partial degraded
* Login required for interaction
* Eligibility required for review/question

### 8.5 Davranış kuralları

* PDP mağaza bağlamında açılır.
* Aynı ürün farklı mağazalarda satılabilir; ancak yorum ve soru-cevap ürün bazlı ortak kalabilir.
* Mağaza story akışı PDP içinde açılmaz.
* Düşük stokta dürüst kıtlık dili kullanılabilir; rezervasyon vaadi verilmez.

### 8.6 Yasak davranışlar

* PDP’yi keşfet akışına çevirmek
* Ürün bilgi alanını mesaj kutusuna kaydırmak
* Login ve eligibility olmadan review/question açmak

---

## 9. SEPET SÖZLEŞMESİ

### 9.1 Tek amacı

Kullanıcının seçtiği ürünleri işlem öncesi toplu biçimde görmesini, düzenlemesini ve checkout’a geçmesini sağlamak.

### 9.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 9.3 Okuduğu ana alanlar

* Sepet satırları
* Ürün summary bilgisi
* Mağaza bağlamı
* Varyant summary bilgisi
* Anlık fiyat görünümü
* Satır bazlı availability / warning bilgisi
* Sepet toplam özeti

### 9.4 Tetiklediği aksiyonlar

* Adet artır / azalt
* Satır kaldır
* Varyantı değiştir (destekleniyorsa)
* Sepeti güncelle
* Checkout’a geç
* PDP’ye geri dön

### 9.5 Ana bileşenler

* Sepet satır listesi
* Satır uyarı alanları
* Sepet toplam özeti
* Checkout CTA alanı
* Boş sepet yönlendirme alanı

### 9.6 State görünürlüğü

* Loading
* Normal ready state
* Line warning state
* Cart degraded state
* Empty cart state
* Checkout blocked state

### 9.7 Davranış kuralları

* Tek satır problemliyse tüm sepet invalid ilan edilmez; satır bazlı uyarı gösterilir.
* Sepette görünen fiyat nihai ticari doğruluk değildir; drift uyarısı taşıyabilir.
* Ürün sepette var diye checkout garantili değildir.

### 9.8 Yasak davranışlar

* Sepeti sipariş oluşmuş gibi göstermek
* Stok/fiyat drift riskini saklamak

---

## 10. CHECKOUT SÖZLEŞMESİ

### 10.1 Tek amacı

Sepeti siparişe hazır hale getiren son ticari doğrulama ekranı olmak. Misafir kullanıcı bu ekranda zorunlu teslimat ve iletişim bilgilerini tek seferlik (one-time) sağlayarak checkout ve payment akışını tamamlayabilir.

### 10.2 Ana aktörler

* Kontrollü guest checkout kullanıcısı
* Giriş yapmış kullanıcı

### 10.3 Okuduğu ana alanlar

* Sepet satırları özeti
* Adres seçimi / yeni adres
* Teslimat uygunluğu
* Fiyat / stok final doğrulaması
* Kupon / kampanya etkisi
* Nihai sipariş özeti
* Checkout validity ve readiness bilgisi

### 10.4 Tetiklediği aksiyonlar

* Adres seç / ekle / değiştir
* Kupon uygula / kaldır
* Review yenile
* Problemli satırı düzeltmeye dön
* Ödemeye geç

### 10.5 Ana bileşenler

* Teslimat bilgisi bölümü
* Sipariş satırları özeti
* Fiyat / indirim / toplam özeti
* Kupon / kampanya alanı
* Checkout warning alanı
* Payment CTA alanı

### 10.6 State görünürlüğü

* Reviewing
* Invalid
* Ready for payment
* Expired
* Partial warning state

### 10.7 Davranış kuralları

* Invalid checkout genel hata değil, neden sınıfıyla görünmelidir.
* Hazır olmayan checkout ödeme ekranına taşınmaz.
* Expired checkout gizlenmez; kullanıcıya yenileme / geri dönüş yolu verilir.
* Guest checkout varsa bu sosyal hak açıldığı izlenimi vermemelidir.

### 10.8 Yasak davranışlar

* Ready_for_payment durumunu sipariş oluştu gibi sunmak
* Address, stock, price, coupon drift’lerini gizlemek

---

## 11. ÖDEME SÖZLEŞMESİ

### 11.1 Tek amacı

Checkout’tan gelen doğrulanmış sipariş hazırlığını finansal sonuca taşımak.

### 11.2 Ana aktörler

* Giriş yapmış kullanıcı

### 11.3 Okuduğu ana alanlar

* Checkout validated context
* Nihai toplam
* Para birimi
* Payment attempt summary
* Provider state summary

### 11.4 Tetiklediği aksiyonlar

* Payment initiate
* Gerekirse retry payment
* Gerekirse checkout’a dön

### 11.5 Ana bileşenler

* Ödeme özeti
* Ödeme yöntemi alanı
* Payment state alanı
* Retry / guidance alanı
* Güven / açıklama alanı

### 11.6 Ana state’ler

* Initiating
* Pending provider
* Failed
* Cancelled
* Captured result visible
* Unknown result / waiting verification

### 11.7 Davranış kuralları

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Misafir kullanıcı ödeme yapamaz gibi eski engellemeler uygulanamaz; ödeme ekranında guest payment mümkündür ve desteklenir.
* Unknown_result durumda yanlış kesinlik verilmez.
* Payment success ile order created aynı mesaj altında birleştirilmez.
* Tekrar deneme yalnız güvenli ve uygun durumda görünür kılınır.

### 11.8 Yasak davranışlar

* Payment pending / unknown sonucu başarısız diye kesmek
* Payment captured = sipariş kesin oluştu diye göstermek

---

## 12. SİPARİŞ DETAY SÖZLEŞMESİ

### 12.1 Tek amacı

Başarılı ödeme sonrası oluşmuş resmi sipariş kaydını kullanıcıya görünür kılmak.

### 12.2 Ana aktörler

* Giriş yapmış kullanıcı

### 12.3 Okuduğu ana alanlar

* Sipariş özeti
* Adres özeti
* Satır listesi
* Ödeme durumu özeti
* Paket / fulfillment özeti
* İptal / iade uygunluğu özeti
* Guest sipariş için hesap bağlı hakların açılmadığını belirten guest order context özeti
* Destek ve takip giriş noktaları

### 12.4 Tetiklediği aksiyonlar

* Sipariş takibe git
* Destek aç
* Uygunsa iptal başlat
* Uygunsa iade başlat

### 12.5 State görünürlüğü

* Created / confirmed görünürlüğü
* Partial delivery
* Partial cancel
* Return in progress
* Returned / closed görünürlüğü

### 12.6 Davranış kuralları

* Sipariş detayı kullanıcı için resmi kayıt hissi vermelidir.
* İç operasyon detayları doğrudan dökülmez.
* Kısmi durumlar dürüst ve satır/paket bağlamıyla görünür olmalıdır.

---

## 13. SİPARİŞ TAKİP SÖZLEŞMESİ

### 13.1 Tek amacı

Sipariş ve paket durumunu kullanıcı diline çevrilmiş dürüst operasyon görünürlüğüyle göstermek.

### 13.2 Ana aktörler

* Giriş yapmış kullanıcı

### 13.3 Okuduğu ana alanlar

* Sipariş sistemi projection
* Shipment / delivery projection
* Paket bazlı durum özeti
* Gecikme / problem işaretleri
* Teslimat sonrası hak görünürlüğü

### 13.4 Tetiklediği aksiyonlar

* Destek aç
* İlgili sipariş detayına dön
* Uygunsa iade başlat

### 13.5 Ana bileşenler

* Tracking headline alanı
* Paket kartları
* Milestone zaman çizgisi
* Problem / gecikme alanı
* Post-delivery entitlement alanı

### 13.6 Ana state’ler

* Hazırlanıyor
* Kargoya verildi
* Taşınıyor
* Teslim edildi
* Sorun var
* Kısmi teslimat

### 13.7 Davranış kuralları

* Tracking projection gecikebilir ama yanlış kesinlik göstermez.
* İç operasyon statüleri kullanıcıya aynen dökülmez.
* Problem varsa destek ve sonraki aksiyon köprüsü görünür olmalıdır.

### 13.8 Yasak davranışlar

* Tracking’i shipment truth’un birebir kopyası gibi göstermek
* Gecikmeyi veya belirsizliği gizlemek

---

## 14. İPTAL / İADE BAŞLANGIÇ YÜZEYLERİ SÖZLEŞMESİ

### 14.1 Tek amacı

Kullanıcının uygun sipariş veya satır için iptal/iade talebini kontrollü ve dürüst biçimde başlatmasını sağlamak.

### 14.2 Ana aktörler

* Giriş yapmış kullanıcı

### 14.3 Okuduğu ana alanlar

* Sipariş uygunluğu
* Satır bazlı uygunluk
* Teslimat durumu
* İptal / iade policy özeti
* Refund expectation summary gerekiyorsa

### 14.4 Tetiklediği aksiyonlar

* İptal talebi oluştur
* İade talebi oluştur
* Sebep seç
* Gerekirse destek akışına git

### 14.5 State görünürlüğü

* Eligible
* Not eligible
* Review required
* Refund pending reference
* Partial eligibility

### 14.6 Davranış kuralları

* İptal ile iade aynı akış gibi sunulmaz.
* Approved ile refunded durumları ayrı görünür.
* Tüm sipariş değil satır bazlı uygunluk da desteklenir.

### 14.7 Yasak davranışlar

* İptal ve iadeyi bulanıklaştırmak
* Refund sonucunu request state’inin yerine koymak

---

## 15. BİLDİRİM MERKEZİ SÖZLEŞMESİ

### 15.1 Tek amacı

Kritik olayları aktör bazlı ve öncelik bazlı görünür kılmak.

### 15.2 Ana aktörler

* Giriş yapmış kullanıcı
* İlgili role sahip mağaza / panel kullanıcıları için ayrı merkezler olabilir

### 15.3 Okuduğu ana alanlar

* Notification listesi
* Öncelik sınıfı
* Okundu / okunmadı durumu
* Gerekirse özetlenmiş sosyal sinyaller

### 15.4 Tetiklediği aksiyonlar

* Hedef ekrana git
* Bildirimi okundu yap
* Gerekirse ayarlara git

### 15.5 State görünürlüğü

* Unread / read
* Priority tier
* Empty inbox
* Partial degraded delivery visibility

### 15.6 Davranış kuralları

* Gürültü yoğun sinyaller özetlenebilir.
* Ana truth geri alınmaz; notification gecikmesi böyle sunulmaz.

### 15.7 Yasak davranışlar

* Her olayı aynı öncelikte sunmak
* Gürültülü sosyal sinyalleri zorunlu kritik olay gibi göstermek

---

## 16. DESTEK GİRİŞİ SÖZLEŞMESİ

### 16.1 Tek amacı

Kullanıcıyı doğru destek başlığına yönlendirip mümkünse self-service çözüm sunmak, gerekirse ticket akışına taşımak.

### 16.2 Ana aktörler

* Giriş yapmış kullanıcı
* Gerekli bağlamda misafir kullanıcı için sınırlı yardım görünürlüğü olabilir

### 16.3 Okuduğu ana alanlar

* Ekran / bağlam özeti
* Sipariş / ödeme / teslimat / hesap bağlamı
* Destek konu başlıkları
* Self-service çözüm içerikleri

### 16.4 Tetiklediği aksiyonlar

* Konu seç
* Self-service içeriğe git
* Ticket oluştur
* Gerekirse canlı destek / insan desteğine yönel

### 16.5 State görünürlüğü

* Context-aware entry
* Topic-selected state
* Self-service result state
* Escalate-to-ticket state

### 16.6 Davranış kuralları

* Serbest chat ile açılmaz.
* Bağlamsal giriş zenginleşebilir ama mantık ortak kalır.
* Ticket motoru ile sosyal mesajlaşma karışmaz.

### 16.7 Yasak davranışlar

* Destek girişini fenomen mesaj kutusuyla karıştırmak
* Serbest boş metin kutusunu tek giriş modeli yapmak

---

## 17. Kesin ayrımlar

### 17.1 Keşfet / PLP / PDP

* Keşfet = ilgi üretir
* PLP = seçim alanı açar
* PDP = final karar alanıdır

### 17.2 Sepet / Checkout / Ödeme / Sipariş

* Sepet = niyet toplar
* Checkout = doğrular
* Ödeme = finansal sonucu üretir
* Sipariş = resmi ticari kaydı taşır

### 17.3 Sipariş / Takip / Teslimat

* Sipariş = ticari kayıt
* Teslimat = operasyon truth
* Takip = kullanıcıya çevrilmiş projection

### 17.4 Destek / Mesajlaşma

* Destek = resmi süreç
* Sosyal mesajlaşma = ilişkisel iletişim

---

## 18. Kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* tüm storefront / app yüzeyleri için tek amaç yazılmışsa,
* okunan truth / projection alanları ayrılmışsa,
* tetiklenen aksiyonlar command mantığıyla yazılmışsa,
* loading / empty / blocked / degraded / ara durum davranışları tanımlanmışsa,
* transaction ve post-order ayrımları netleşmişse,
* ekranlar arası çakışan rol tanımları kapatılmışsa.
