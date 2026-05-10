# STATE_MACHINES/checkout

Bu dosya, checkout sisteminin kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- checkout, sepet değildir
- checkout, ödeme değildir
- checkout, sipariş de değildir
- checkout’un görevi sipariş hazırlığını doğrulamak ve ödeme için güvenli bağlam üretmektir

Checkout state’i, payment state’inden ayrı tutulmalıdır.
Payment sonucu order oluşturma hakkı doğurur; checkout bunu önceden hazırlar. 

---

## 1. CHECKOUT SISTEMININ AMACI

Checkout sistemi şu işleri yapar:

- sepetten gelen ticari niyeti doğrulamak
- ürün/satır/varyant geçerliliğini yeniden kontrol etmek
- fiyat ve stok doğrulamasını yapmak
- teslimat/adres bağlamını netleştirmek
- kargo/toplam etkisini netleştirmek
- ödeme için “valid checkout context” üretmek

Checkout sistemi şu işleri yapmaz:

- finansal sonucu üretmez
- payment state çalıştırmaz
- siparişi resmi kayda dönüştürmez
- refund execution yapmaz
- fulfillment hattını yürütmez

Sepet hazırlık alanıdır; checkout sipariş hazırlığını tamamlar; ödeme ticareti kapatır. 

---

## 2. CHECKOUT GIRDISI

Checkout doğrudan şu kaynaklardan beslenir:

- sepet satırları
- kullanıcı / guest checkout bağlamı
- mağaza bağlamlı ürün seçimi
- varyant/adet bilgisi
- aktif satış fiyatı
- stok uygunluğu
- kayıtlı adres veya yeni adres
- teslimat uygunluğu
- kupon/kampanya uygulanmış özet
- checkout başlatma kimliği / bağlamı

Adres sistemi açısından doğru model:
adres gerçeği kullanıcı hesabında tutulur; sipariş oluştuğunda snapshot’a taşınır.
Checkout bu snapshot üretiminin hazırlık alanıdır. 

---

## 3. CHECKOUT AKTORLERI

### 3.1 Misafir kullanıcı
Kontrollü guest checkout açıksa checkout’a girebilir.

### 3.2 Giriş yapmış kullanıcı
Checkout’un ana aktörüdür.

### 3.3 Fenomen mağaza
Checkout aktörü değildir.

### 3.4 Tedarikçi
Checkout aktörü değildir.

### 3.5 Platform
Checkout doğrulama ve rule enforcement owner’ıdır.

Not:
Guest checkout, sosyal write hakları açan auth modeli değildir; yalnız ticari kapanış için kontrollü istisnadır.
Bu karar, güncel kanonik proje kararına göre uygulanır.

---

## 4. CHECKOUT STATE LISTESI

Checkout için önerilen profesyonel ve sade state omurgası:

- created
- reviewing
- invalid
- valid
- ready_for_payment
- expired
- converted_to_payment
- abandoned

İlk faz için minimum güvenli çekirdek:

- created
- reviewing
- invalid
- ready_for_payment
- expired
- abandoned

Not:
`valid` ile `ready_for_payment` istenirse tek state altında birleştirilebilir.
Ancak ticari doğrulama tamamlandı ile ödeme handoff üretildi ayrımını korumak daha güvenlidir.

---

## 5. STATE TANIMLARI

### 5.1 created
Checkout başlatılmıştır.
Sepetten gelen ilk bağlam alınmıştır.
Henüz tam doğrulama çalışmamıştır.

### 5.2 reviewing
Sistem şu kontrolleri yürütür:
- satır geçerliliği
- ürün aktiflik durumu
- varyant seçimi doğruluğu
- fiyat doğrulaması
- stok doğrulaması
- adres / teslimat uygunluğu
- kupon/kampanya geçerliliği
- toplam tutar hesaplama
- guest/login bağlamı kontrolleri
- risk blokesi ilk kontrolü

### 5.3 invalid
Checkout bağlamı ödeme için uygun değildir.

Tipik nedenler:
- ürün pasifleşti
- varyant eksik / geçersiz
- stok yetersiz
- fiyat değişti ve tekrar onay gerekli
- adres geçersiz
- teslimat uygun değil
- kupon geçersiz
- kullanıcı/guest bağlamı uygun değil

### 5.4 valid
İşlemsel doğrulamalar geçmiştir.
Ancak ödeme handoff nesnesi henüz kurulmamış olabilir.

### 5.5 ready_for_payment
Checkout bağlamı artık ödeme sistemine aktarılabilecek kadar temiz ve tamdır.

Bu state’te en az şu alanlar net olmalıdır:
- checkout kimliği
- kullanıcı/guest bağlamı
- doğrulanmış satırlar
- nihai toplam
- teslimat/kargo etkisi
- para birimi
- kupon/kampanya etkisi
- ödeme denemesi için referans bağlam

Ödeme sistemi doğrudan sepetten değil, checkout’un doğrulanmış sipariş hazırlığından beslenmelidir. 

### 5.6 converted_to_payment
Checkout bağlamı payment attempt üretmek üzere ödeme sistemine güvenli biçimde devredilmiştir.

Not:
Bu state sipariş oluştu anlamına gelmez.

### 5.7 expired
Checkout oturumu zaman aşımına uğramıştır.
Bağlam yenilenmeden ödeme akışına ilerlenemez.

### 5.8 abandoned
Kullanıcı checkout’u terk etmiştir.
Bu, teknik hata olmak zorunda değildir; davranışsal terk olabilir.

---

## 6. GECERLI TRANSITION LISTESI

### Başlangıç
- created → reviewing

### Doğrulama akışı
- reviewing → invalid
- reviewing → valid
- reviewing → ready_for_payment

### Invalid akışı
- invalid → reviewing
  (kullanıcı düzeltme yaptıysa veya sistem tekrar doğrulama aldıysa)

### Valid akışı
- valid → ready_for_payment
- valid → invalid
  (ara doğrulama bozulduysa)

### Ödeme handoff akışı
- ready_for_payment → converted_to_payment

### Süre / terk akışı
- created → abandoned
- reviewing → abandoned
- invalid → abandoned
- valid → abandoned
- ready_for_payment → abandoned

### Expire akışı
- created → expired
- reviewing → expired
- invalid → expired
- valid → expired
- ready_for_payment → expired

---

## 7. YASAK TRANSITION LISTESI

Aşağıdaki geçişler yasaktır:

- created → ready_for_payment
  (doğrulama olmadan)

- created → converted_to_payment
  (review olmadan)

- invalid → converted_to_payment
  (geçersiz checkout ödeme üretemez)

- abandoned → ready_for_payment
  (yeniden review olmadan)

- expired → ready_for_payment
  (yeniden doğrulama olmadan)

- converted_to_payment → ready_for_payment
  (aynı checkout bağlamı tekrar ödeme üretmemeli; yeni payment akışı ayrıca tasarlanmalı)

---

## 8. CHECKOUT VALIDASYON BLOKLARI

Checkout `reviewing` aşamasında aşağıdaki bloklar çalışır:

### 8.1 Sepet / satır doğrulaması
- satır mevcut mu
- ürün aktif mi
- mağaza bağlamı görünür mü
- varyant seçimi tamam mı
- adet uyguluğu var mı

Sepet satırı nötr ürün satırı değildir; mağaza bağlamı korunmalıdır. 

### 8.2 Fiyat doğrulaması
- aktif satış fiyatı güncel mi
- kampanya etkisi güncel mi
- kupon hâlâ geçerli mi
- toplam yeniden hesaplandığında tutarlılık korunuyor mu

### 8.3 Stok doğrulaması
- stok yeterli mi
- satır checkout için uygun mu

Net kural:
Sepet stok rezervasyonu değildir; sert doğrulama checkout’ta yapılır. 

### 8.4 Adres ve teslimat doğrulaması
- adres zorunlu alanları tam mı
- seçili adres aktif mi
- teslimat uygun mu
- adres ödeme aşamasına taşınabilir mi

Uygun olmayan adresle ödeme adımına geçilemez. 

### 8.5 Kimlik / guest bağlam doğrulaması
- shopper auth geçerli mi
- guest checkout açıksa gerekli minimum bağlam sağlanmış mı
- risk/fraud blokesi var mı

### 8.6 Teknik/idempotency doğrulaması
- aynı checkout context ile eşzamanlı çakışan handoff var mı
- önceki payment attempt bağlanmış mı
- expire olmuş bağlam tekrar kullanılıyor mu

---

## 9. CHECKOUT CIKTISI

Checkout başarılı olursa üretilen ana çıktı:

### checkout_payment_context
En az şu alanları içerir:
- checkout_id
- user_id veya guest_context_id
- validated_line_items
- final_total
- shipping_total
- discount_total
- coupon_context
- campaign_context
- address_context
- currency
- payment_attempt_seed
- created_at / validated_at

Bu nesne payment owner sistemine verilir.
Payment sistemi ürün detayını yeniden yorumlamaz; checkout’un verdiği toplamı işler. 

---

## 10. HATA VE GERI DONUS DAVRANISI

### Invalid checkout durumunda
Kullanıcıya net biçimde şu tip sonuç gösterilir:
- ürün geçersizleşti
- fiyat güncellendi
- stok tükendi
- adres geçersiz
- teslimat uygun değil
- kupon geçersiz

### Geri dönüş kuralı
- kullanıcı düzeltme yapar
- checkout yeniden `reviewing` state’ine döner
- tüm bağlam baştan sıfırlanmaz
- sepet mümkün olduğunca korunur

Checkout başarısızlığı kullanıcıyı cezalandırmamalı; ama ödeme için kirli bağlamı da geçirmemelidir.

---

## 11. AUDIT / EVENT NOKTALARI

Checkout owner sistemi en az şu olayları üretebilmelidir:

- checkout_created
- checkout_review_started
- checkout_invalidated
- checkout_validated
- checkout_ready_for_payment
- checkout_expired
- checkout_abandoned
- checkout_converted_to_payment

Bu olaylar:
- analytics
- risk
- support
- debugging
amaçlı kullanılabilir.

Net kural:
Bu event’ler projection ve bilgilendirme içindir; owner truth mutation yerine geçmez.

---

## 12. IDEMPOTENCY KURALI

Aynı checkout bağlamı aynı anda birden fazla payment handoff üretmemelidir.

En az şu korumalar gerekir:
- checkout_id + version
- checkout_id + payment_attempt_seed
- ready_for_payment sonrası tek aktif handoff kuralı

Bu koruma yoksa:
- duplicate payment attempt
- duplicate order creation chain
- yanlış analytics
üretilebilir.

---

## 13. MOBIL ONCELIKLI TASARIM NOTU

Checkout mobil öncelikli davranmalıdır:

- tek kolon
- net adım dili
- kısa ve anlaşılır toplam özeti
- fazla dikkat dağıtıcı içerik yok
- checkout → payment geçişi baskın CTA
- invalid state’ler sade ve eyleme dönük olmalı

Sepet ve ödeme gibi checkout da sosyal yüzeye dönüşmemelidir. 

---

## 14. KISA OZET

Checkout state machine’in ana mantığı şudur:

- sepet niyeti taşır
- checkout doğrular
- payment finansal sonucu üretir
- order başarılı payment sonrası oluşur

Bu nedenle doğru checkout omurgası:
created → reviewing → invalid/valid → ready_for_payment → converted_to_payment

şeklinde çalışmalıdır.