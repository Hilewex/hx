# SCREEN_CONTRACTS

## 1. Amaç

Bu dosya, storefront ve kullanıcıya dönük uygulama yüzeylerinin kodlama öncesi ekran sözleşmelerini sabitler.

Bu dosyanın amacı:

* her ekranın tek amacını netleştirmek,
* hangi truth veya projection kaynaklarından beslendiğini ayırmak,
* hangi aksiyonların command, hangilerinin yalnız görünürlük/projection olduğunu sabitlemek,
* loading / empty / blocked / degraded / error davranışlarını ekran bazında tanımlamak,
* mobil ve web davranış farklarını kontrollü biçimde yazmak,
* UI tarafının owner truth üretmesini engellemektir.

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
Bu dosya panel ekranlarını kapsamaz. Panel yüzeyleri `PANEL_CONTRACTS.md` içinde tanımlanır.

---

## 3. Ortak ekran sözleşmesi şablonu

Her ekran için aşağıdaki başlıklar tanımlanmalıdır:

1. Ekranın tek amacı
2. Ana aktörler
3. Girdi kaynakları
4. Okuduğu truth / projection alanları
5. Tetiklediği aksiyonlar
6. Ana bileşenler
7. State görünürlüğü
8. Block / empty / degraded kuralları
9. Mobil / web farkları
10. Yasak davranışlar

---

## 4. Ortak davranış kuralları

### 4.1 Login gate kuralı

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Misafir kullanıcı açık yüzeyleri görebilir.
* Misafir kullanıcı kimlik bağlı sosyal write aksiyonları (yorum, beğeni, story, vb.) yapamaz. Buralarda login duvarı devreye girer.
* Login duvarı erken ve kör biçimde değil, aksiyon anında açılmalıdır.
* Guest checkout ticari istisnadır; login duvarı commerce akışını kesmez. Misafir kullanıcı ödeme yapabilir ve sipariş oluşturabilir.
* Ancak guest commerce modeli sosyal hak açmaz, kalıcı hesap yetkisi üretmez.

### 4.2 Command / projection ayrımı

* Ekranda görünen sayaçlar, rozetler, özetler projection olabilir.
* Sepete ekle, takip et, beğen, kaydet, sipariş başlat, iade başlat gibi aksiyonlar command tarafıdır.
* Projection gecikebilir; command sonucu owner kurallarına göre belirlenir.

### 4.3 Dürüst degradation kuralı

* Ekran veri eksikliğini gizleyip sahte tamlık üretmez.
* Bazı bloklar partial/degraded gelebilir.
* Core commerce akışında yanlış kesinlik verilmez.

### 4.4 Moderasyon / risk / policy görünürlüğü

* Kullanıcının yapamadığı aksiyonlarda mümkün olduğunda neden görünür olmalıdır.
* “Yorum yazamazsın”, “soru şu an incelemede”, “story yükleme hakkı yok”, “kupon uygulanamadı” gibi durumlar ekran diline çevrilmelidir.

---

## 5. ANA SAYFA SÖZLEŞMESİ

### 5.1 Tek amacı

Platformun ilk vitrini olmak; kullanıcıyı keşfet, kategori, fenomen mağazası ve PDP’ye yönlendiren kontrollü giriş yüzeyi olmaktır.

### 5.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 5.3 Okuduğu ana alanlar

* Mağaza tanıtım story projection
* Promo / vitrin blokları
* Videolu ürün kart blokları
* Klasik ürün kart blokları
* Kategori erişim verisi
* Header chrome verisi

### 5.4 Tetiklediği aksiyonlar

* Arama aç
* Kategoriye git
* Keşfete git
* Mağazaya git
* PDP’ye git
* Giriş yap
* Sepete git
* Bildirim merkezine git

### 5.5 Ana bileşenler

* Sticky header
* İnce kategori şeridi
* Fenomen mağaza tanıtım story şeridi
* Promo / vitrin bandı
* Videolu ürün kart blokları
* Klasik ürün kart blokları
* Güven / kapanış blokları

### 5.6 State görünürlüğü

* Initial loading
* Block loading
* Partial block degraded
* Empty block
* Normal state

### 5.7 Block / empty / degraded kuralları

* Tek blok bozuldu diye tüm ana sayfa yok sayılmaz.
* Promo veya discovery blokları partial gelebilir.
* Header ve ana navigasyon mümkün olduğunca stabil kalmalıdır.

### 5.8 Mobil / web farkları

* Mobilde blok yoğunluğu daha sade tutulur.
* Web’de aynı anda daha çok blok görünür.
* Sticky header her iki tarafta da korunur.

### 5.9 Yasak davranışlar

* Ana sayfa full sosyal feed’e dönüşmez.
* Kategori/PLP gibi ağır filtre ekranı davranışı göstermez.
* Sipariş/ödeme gibi dikkat daraltıcı commerce state’lerini ana yüzey mantığına taşımaz.

---

## 6. KEŞFET SÖZLEŞMESİ

### 6.1 Tek amacı

Yeni mağaza ve yeni ürün karşılaşmaları üretmek; ilgi ve merak yüzeyi olmak.

### 6.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 6.3 Okuduğu ana alanlar

* Mağaza tanıtım story şeridi
* Video ağırlıklı ürün akışı
* Düşük oranlı klasik ürün kart desteği
* Hafif etkileşim projection’ları

### 6.4 Tetiklediği aksiyonlar

* Story aç
* PDP’ye git
* Mağazaya git
* Beğen
* Kaydet
* Paylaş
* Sepete git / PDP üzerinden ticari akışa geç

### 6.5 Ana bileşenler

* Üst story şeridi
* Video merkezli akış
* Düşük oranlı klasik ürün kart desteği
* Hafif etkileşim barı

### 6.6 State görünürlüğü

* Feed loading
* Story loading
* Empty discover
* Degraded video feed
* Limited availability

### 6.7 Block / empty / degraded kuralları

* Story şeridinde yalnız mağaza tanıtım story’leri görünür.
* Ürün tanıtım story’leri keşfet üst şeridinde yer almaz.
* Keşfet karar tamamlama yüzeyi gibi davranmaz.

### 6.8 Mobil / web farkları

* Mobilde akış daha immersif ve tek kolon ağırlıklıdır.
* Web’de daha fazla yardımcı bağlam görünür olabilir.

### 6.9 Yasak davranışlar

* Keşfet PLP’ye dönüştürülmez.
* Aşırı filtre / facet duvarı kurulmaz.
* PDP’deki güven ve derin karar katmanı keşfete taşınmaz.

---

## 7. ARAMA SÖZLEŞMESİ

### 7.1 Tek amacı

Kullanıcı niyetini en kısa yoldan doğru yüzeye taşımak.

### 7.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 7.3 Okuduğu ana alanlar

* Ürün retrieval adayları
* Mağaza retrieval adayları
* Kategori / taksonomi adayları
* Keşif / video retrieval adayları
* Query suggestion / synonym / typo tolerant projection

### 7.4 Arama modları

* Genel platform araması
* Keşfet araması
* Katalog / ürün araması
* Gerekiyorsa mağaza içi arama

### 7.5 Tetiklediği aksiyonlar

* PDP’ye git
* Kategori / PLP’ye git
* Mağazaya git
* Sonuç görünümünü değiştir
* Filtre uygula

### 7.6 State görünürlüğü

* Empty query
* Suggestion state
* Result state
* No result
* Degraded search

### 7.7 Block / empty / degraded kuralları

* Tek arama kutusu olabilir ama tek tip davranış olmaz.
* Keşfet araması kullanıcıyı kör ve kapalı arama duvarına dönüştürmez.
* Arama altyapısı truth owner değildir; aday üretim katmanıdır.

### 7.8 Mobil / web farkları

* Mobilde minimum adımla sonuç üretimi önceliklidir.
* Web’de facet ve yardımcı kırılımlar daha görünür olabilir.

### 7.9 Yasak davranışlar

* Tüm arama modlarını tek liste davranışına indirmek.
* Ürün, kategori ve mağaza niyetlerini tek tip sonuçta boğmak.

---

## 8. KATEGORİ / PLP SÖZLEŞMESİ

### 8.1 Tek amacı

Niyetli ürün taraması ve seçim alanı açmak.

### 8.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 8.3 Okuduğu ana alanlar

* Kategori kimliği
* Alt kategori yapısı
* Filtre / facet projection’ları
* Klasik ürün kart listesi
* Tek sıra destekleyici video şeridi

### 8.4 Tetiklediği aksiyonlar

* Filtre uygula
* Sıralama değiştir
* Alt kategoriye geç
* PDP’ye git
* Hafif etkileşimler

### 8.5 Ana bileşenler

* Breadcrumb
* Kategori adı / açıklama
* Alt kategori geçiş alanı
* Filtre alanı
* Sıralama alanı
* Sonuç listesi

### 8.6 State görünürlüğü

* Initial loading
* Filter loading
* Empty result
* Degraded facet
* Normal list state

### 8.7 Block / empty / degraded kuralları

* Varsayılan durumda toplam ürün sayısı görünmeyebilir.
* Filtre uygulandığında sonuç sayısı görünür.
* Filtreler kategoriye göre dinamik olmalıdır.

### 8.8 Mobil / web farkları

* Mobilde filtreler sheet/drawer mantığında olabilir.
* Web’de yan panel filtre daha uygundur.

### 8.9 Yasak davranışlar

* Keşfet gibi ilgi akışına dönüşmek.
* PDP’deki derin güven karar katmanını listeye taşımak.

---

## 9. PDP SÖZLEŞMESİ

### 9.1 Tek amacı

Ürün kararını tamamlama ve satın alma başlatma.

### 9.2 Ana aktörler

* Misafir kullanıcı
* Giriş yapmış kullanıcı

### 9.3 Okuduğu ana alanlar

* Ürün çekirdek bilgi katmanı
* Ticari karar katmanı
* Satın alma aksiyon katmanı
* Etkileşim / davranış sinyali katmanı
* Fenomen mağaza bağlamı
* Yorum / puan katmanı
* Soru-cevap katmanı
* Kullanıcı deneyim story / sosyal kanıt katmanı

### 9.4 Tetiklediği aksiyonlar

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

### 9.5 Ana bileşenler

* Medya galerisi
* Ürün bilgi bloğu
* Ticari karar bloğu
* Satın alma aksiyonları
* Etkileşim barı
* Mağaza bağlam kartı
* Yorum / puan alanı
* Soru-cevap alanı
* İlgili sosyal kanıt alanları

### 9.6 State görünürlüğü

* Loading
* Variant not selected blocked
* Out of stock
* Low stock warning
* Social/content partial degraded
* Login required for interaction

### 9.7 Block / empty / degraded kuralları

* PDP mağaza bağlamında açılır.
* Aynı ürün farklı mağazalarda satılabilir; ancak yorum ve soru-cevap ürün bazlı ortak kalır.
* Mağaza story akışı PDP içinde açılmaz.
* Kritik düşük stokta dürüst baskı/uyarı dili kullanılabilir.

### 9.8 Mobil / web farkları

* Mobilde sticky CTA ve tek elle aksiyon önceliği önemlidir.
* Web’de yan satın alma alanı / daha geniş bilgi görünürlüğü olabilir.

### 9.9 Yasak davranışlar

* PDP’yi keşfet akışına çevirmek.
* Ürün güven katmanını mağaza mesajlaşmasına kaydırmak.
* Yorum / soru-cevap / etkileşim write haklarını login ve eligibility olmadan açmak.

---

## 10. SEPET SÖZLEŞMESİ

### 10.1 Tek amacı

Kullanıcının seçtiği ürünleri işlem öncesi toplu biçimde görmesini, düzenlemesini ve checkout’a geçmesini sağlamak.

### 10.2 Not

Sepet ayrıntılı ekran contract’ı bu dosyanın commerce flow bölümünde ilerleyen revizyonda genişletilecektir.

---

## 11. CHECKOUT SÖZLEŞMESİ

### 11.1 Tek amacı

Sepeti siparişe hazır hale getiren son ticari doğrulama ekranı olmak. Misafir kullanıcı bu ekranda zorunlu teslimat ve iletişim bilgilerini tek seferlik (one-time) olarak sağlayarak akışı tamamlayabilir.

### 11.2 Ana aktörler

* Kontrollü guest checkout kullanıcısı
* Giriş yapmış kullanıcı

### 11.3 Okuduğu ana alanlar

* Sepet satırları özeti
* Adres seçimi / yeni adres
* Teslimat uygunluğu
* Fiyat / stok final doğrulaması
* Kupon / kampanya etkisi
* Nihai sipariş özeti

### 11.4 Tetiklediği aksiyonlar

* Adres seç / ekle
* Satır doğrulama sonucu gör
* Kupon uygula / kaldır
* Checkout review yenile
* Ödemeye geç

### 11.5 Ana state’ler

* Reviewing
* Invalid
* Ready for payment
* Expired
* Abandoned return state

### 11.6 Yasak davranışlar

* Sosyal akış öğeleri baskın olmaz.
* Story / yorum / keşif mantığı checkout’u bölmez.

---

## 12. ÖDEME SÖZLEŞMESİ

### 12.1 Tek amacı

Checkout’tan gelen doğrulanmış sipariş hazırlığını finansal sonuca taşımak.

### 12.2 Ana aktörler

* Giriş yapmış kullanıcı
* Kontrollü guest checkout kullanıcısı (Misafir kullanıcı ödeme yapabilir)

### 12.3 Okuduğu ana alanlar

* Checkout validated context
* Nihai toplam
* Para birimi
* Ödeme attempt durumu

### 12.4 Tetiklediği aksiyonlar

* Payment initiate
* Retry payment
* Gerekirse checkout’a geri dön

### 12.5 Ana state’ler

* Initiating
* Pending provider
* Failed
* Cancelled
* Captured result visible
* Unknown result / waiting verification

### 12.6 Yasak davranışlar

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Misafir kullanıcı ödeme yapamaz gibi eski engellemeler uygulanamaz; ödeme ekranında guest user aktör olarak desteklenir.
* Ödeme ekranı sosyal yüzeye dönmez.
* “Başarılı ödeme = sipariş kesin oluştu” dili kullanılmaz.

---

## 13. SİPARİŞ DETAY SÖZLEŞMESİ

### 13.1 Tek amacı

Başarılı ödeme sonrası oluşmuş resmi sipariş kaydını kullanıcıya görünür kılmak.

### 13.2 Okuduğu ana alanlar

* Sipariş özeti
* Adres özeti
* Satır listesi
* Ödeme durumu özeti
* Paket / fulfillment özeti
* İptal / iade uygunluğu özeti

### 13.3 Tetiklediği aksiyonlar

* Sipariş takibe git
* Destek aç
* Uygunsa iptal / iade başlat

---

## 14. SİPARİŞ TAKİP SÖZLEŞMESİ

### 14.1 Tek amacı

Sipariş ve paket durumunu kullanıcı diline çevrilmiş dürüst operasyon görünürlüğüyle göstermek.

### 14.2 Okuduğu ana alanlar

* Sipariş sistemi projection
* Shipment / delivery projection
* Paket bazlı durum özeti
* Problem / gecikme işaretleri
* Teslimat sonrası hak görünürlüğü

### 14.3 Tetiklediği aksiyonlar

* Destek aç
* İlgili sipariş detayına dön
* Uygunsa iade başlat

### 14.4 Ana state’ler

* Hazırlanıyor
* Kargoya verildi
* Taşınıyor
* Teslim edildi
* Sorun var
* Kısmi teslimat

### 14.5 Yasak davranışlar

* İç operasyon karmaşasını aynen kullanıcıya dökmek.
* Stale projection’ı kesin gerçek gibi göstermek.

---

## 15. İPTAL / İADE BAŞLANGIÇ YÜZEYLERİ SÖZLEŞMESİ

### 15.1 Tek amacı

Kullanıcının uygun sipariş veya satır için iptal/iade talebini kontrollü ve dürüst biçimde başlatmasını sağlamak.

### 15.2 Okuduğu ana alanlar

* Sipariş uygunluğu
* Teslimat durumu
* Satır bazlı iade uygunluğu
* Refund durum özeti gerekiyorsa

### 15.3 Tetiklediği aksiyonlar

* İptal talebi oluştur
* İade talebi oluştur
* Sebep seç
* Destek akışına yönel

### 15.4 Yasak davranışlar

* İptal ve iadeyi tek akış gibi göstermek.
* Refund completed ile request approved durumunu karıştırmak.

---

## 16. BİLDİRİM MERKEZİ SÖZLEŞMESİ

### 16.1 Tek amacı

Kritik olayları aktör bazlı ve öncelik bazlı görünür kılmak.

### 16.2 Okuduğu ana alanlar

* In-app notification listesi
* Öncelik sınıfı
* Okundu / okunmadı durumu
* Gerekirse özetlenmiş sosyal sinyaller

### 16.3 Tetiklediği aksiyonlar

* İlgili ekrana git
* Bildirimi okundu yap
* Gerekirse ayar / tercih alanına git

### 16.4 Yasak davranışlar

* Her olayı aynı seviyede sunmak.
* Gürültü yoğun sinyalleri tek tek yağmur gibi göstermek.

---

## 17. DESTEK GİRİŞİ SÖZLEŞMESİ

### 17.1 Tek amacı

Kullanıcıyı doğru destek başlığına yönlendirip mümkünse self-service çözüm sunmak, gerekirse ticket akışına taşımak.

### 17.2 Okuduğu ana alanlar

* Bağlamsal ekran bilgisi
* Sipariş / teslimat / ödeme / hesap bağlamı (Guest siparişler için destek girişine geçiş referansları dahil)
* Destek konu başlıkları
* Self-service çözüm içerikleri

### 17.3 Tetiklediği aksiyonlar

* Konu seç
* Self-service içeriğe git
* Ticket oluştur
* Canlı destek / insan destek kuyruğuna yönel (varsa)

### 17.4 Yasak davranışlar

* Serbest ve sınırsız chat ile başlamak.
* Resmi destek sürecini fenomen mesajlaşmasıyla karıştırmak.

---

## 18. Ekranlar arası kesin ayrımlar

### 18.1 Keşfet / PLP / PDP ayrımı

* Keşfet = ilgi üretir
* PLP = seçim alanı açar
* PDP = final karar alanıdır

### 18.2 Sepet / Checkout / Ödeme / Sipariş ayrımı

* Sepet = niyet toplar
* Checkout = doğrular
* Ödeme = finansal sonucu üretir
* Sipariş = resmi ticari kaydı taşır

### 18.3 Sipariş / Takip / Teslimat ayrımı

* Sipariş = ticari kayıt
* Teslimat = operasyon truth
* Takip = kullanıcıya çevrilmiş projection

### 18.4 Destek / Mesajlaşma ayrımı

* Destek = resmi süreç
* Sosyal mesajlaşma = ilişkisel iletişim

---

## 19. Aşama 8 kapsamında bu dosyanın kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* tüm storefront / app yüzeyleri için tek amaç yazılmışsa,
* okunan truth / projection alanları ayrılmışsa,
* tetiklenen aksiyonlar command mantığıyla yazılmışsa,
* loading / empty / blocked / degraded davranışları tanımlanmışsa,
* mobil / web farkları not edilmişse,
* ekranlar arası çakışan rol tanımları kapatılmışsa.

---

## 20. Açık sonraki adım

Bu dosya ilk sürüm storefront omurgasını sabitler.
Bir sonraki revizyonda:

* Sepet yüzeyi detaylandırılacak,
* Checkout / Ödeme / Sipariş akışı derinleştirilecek,
* Post-order ve support ekranları daha ayrıntılı sabitlenecektir.
