# STATE_MACHINES/payout-batch

Bu dosya, payout / ödeme çıkış alanındaki batch yaşam döngüsünün kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- payout, settlement değildir
- payout, hakediş hesaplama sistemi değildir
- payout, kesinleşmiş ve ödenebilir bakiyeyi gerçek ödeme çıkışına çeviren icra sistemidir
- payout batch, çok sayıda payable line/bakiyeyi dönemsel ve denetlenebilir şekilde taşır
- payout batch başarısı ile tek tek line başarıları birebir aynı şey olmayabilir

Payout sistemi, mutabakat sistemi tarafından üretilen ve ödenebilir statüye gelmiş etkileri gerçek transfer akışına çıkaran finansal icra katmanıdır. 

---

## 1. PAYOUT-BATCH SISTEMININ AMACI

Bu sistem şu işleri yapar:

- payable bakiyeleri taraf bazında toplamak
- ödeme dönemine bağlamak
- blokaj / hold / eksik bilgi / eşik kontrollerini yapmak
- payout batch oluşturmak
- ödeme talimatı üretmek
- provider/banka sonucunu işlemek
- başarısız ödemeleri yeniden denemeye almak
- audit izi bırakmak

Bu sistem şu işleri yapmaz:

- settlement line hesaplamak
- sipariş veya refund truth üretmek
- kupon sponsor etkisini hesaplamak
- creator/supplier lifecycle owner’ı olmak

---

## 2. GIRDISI

Payout-batch şu kaynaklardan beslenir:

- payable settlement line’lar
- alıcı tipi (fenomen / tedarikçi / diğer tanımlı taraf)
- payout account/banka doğrulama bilgileri
- minimum ödeme eşiği
- hold / risk / finance block durumu
- payout period / batch window
- ilgili tarafın aktiflik durumu
- açık finans incelemesi olup olmadığı

Net kural:
Settlement line `payable` olmadan payout batch’e girilmez. 

---

## 3. AKTORLER

### 3.1 Platform
Payout owner ve nihai ödeme çıkış otoritesidir.

### 3.2 Finance admin
Batch oluşturma, kontrol, hold/release ve inceleme aktörüdür.

### 3.3 Fraud / risk
Riskli payout’lara hold/review sinyali verebilir.

### 3.4 Alıcı taraf
Fenomen veya tedarikçi gibi payout alıcısıdır; payout truth owner’ı değildir.

### 3.5 Dış ödeme/banka sağlayıcısı
Transfer icrası ve sonucu üreten dış entegrasyon aktörüdür.

---

## 4. PAYOUT-BATCH STATE LISTESI

Önerilen minimum state listesi:

- created
- validating
- blocked
- ready
- submitted
- partially_processed
- processed
- partially_failed
- failed
- closed

İlk faz için güvenli çekirdek:
- created
- validating
- blocked
- ready
- submitted
- processed
- failed
- closed

Not:
Batch seviyesinde başarı/başarısızlık ile line seviyesinde sonuçlar ayrı tutulmalıdır.

---

## 5. STATE TANIMLARI

### 5.1 created
Payout batch oluşturulmuştur.
Henüz tam doğrulama bitmemiştir.

### 5.2 validating
Batch içindeki line ve alıcı bilgileri doğrulanmaktadır.

Kontrol edilen başlıca alanlar:
- payable line var mı
- alıcı aktif mi
- hesap/banka bilgisi tam mı
- minimum eşik sağlandı mı
- hold/block var mı
- aynı line daha önce batch’e girdi mi

### 5.3 blocked
Batch veya batch içindeki anlamlı kısmı payout’a hazır değildir.
Sebep risk, finans incelemesi, eksik hesap bilgisi veya başka blok olabilir.

### 5.4 ready
Batch transfere gönderilmeye hazırdır.

### 5.5 submitted
Payout batch dış ödeme/banka sağlayıcısına gönderilmiştir.

### 5.6 partially_processed
Batch içindeki bazı transferler başarılı, bazıları henüz tamamlanmamış veya farklı durumda olabilir.

### 5.7 processed
Batch’in işlenebilir satırları başarıyla sonuçlanmıştır.

### 5.8 partially_failed
Batch’in bir kısmı başarısız olmuştur.

### 5.9 failed
Batch genel olarak başarısız olmuştur veya transfere çıkamamıştır.

### 5.10 closed
Batch aktif ödeme yaşamını tamamlamıştır; tarihsel kayıt olarak kalır.

---

## 6. GECERLI TRANSITION LISTESI

### Oluşum / doğrulama
- created → validating

### Doğrulama sonucu
- validating → blocked
- validating → ready
- blocked → validating
  (blok sebebi çözüldüyse)

### Gönderim
- ready → submitted

### Sonuç işleme
- submitted → processed
- submitted → partially_processed
- submitted → partially_failed
- submitted → failed

### Kısmi sonuçlar
- partially_processed → processed
- partially_processed → partially_failed
- partially_failed → processed
- partially_failed → failed

### Kapanış
- processed → closed
- failed → closed
- partially_failed → closed
  (yeniden deneme ayrı batch ile yapılacaksa)
- blocked → closed
  (iptal edilen batch senaryosu varsa)

---

## 7. YASAK TRANSITION LISTESI

- created → submitted
- blocked → submitted
- failed → submitted
- closed → any_active_state
- processed → ready
- processed → submitted

Net kural:
Validation geçmeden payout batch transfere çıkamaz.

---

## 8. BATCH ICINDEKI LINE MANTIGI

Bir payout batch, çok sayıda settlement line veya taraf bazlı toplulaştırılmış payout item taşıyabilir.

Bu nedenle:
- batch state ile item state aynı şey değildir
- batch başarılı olsa bile bazı item’lar başarısız olabilir
- item bazlı retry için yeni batch veya alt retry mekanizması tasarlanmalıdır

İlk faz için sade model:
- batch state + payout item result listesi

---

## 9. SETTLEMENT ILE ILISKI

Doğru model:
- settlement line finansal hakedişi kesinleştirir
- payout batch bu line’ların payable hale gelmiş etkisini toplar
- payout batch başarı sonucu ilgili line’lar `paid_out` etkisine taşınır

Net kural:
Payout sistemi settlement oluşturmaz; settlement kullanır. 

---

## 10. HOLD / BLOCK ILISKISI

Aşağıdaki durumlar `blocked` state üretebilir:

- risk/fraud incelemesi
- eksik banka/hesap bilgisi
- minimum ödeme eşiği sağlanmaması
- alıcı hesap pasif/suspended olması
- açık finans incelemesi
- duplicate payout riski
- uyumsuz settlement line

Net kural:
Hold, line/batch’i yok etmez; transfere çıkmasını durdurur.

---

## 11. BASARISIZLIK VE RETRY MANTIGI

Başarısızlık tipleri:
- sağlayıcı/banka erişim hatası
- hesap bilgisi problemi
- kısmi transfer başarısızlığı
- duplicate transfer koruması
- batch validation sonrası son dakika blok

Doğru model:
- başarısız item’lar kaybolmaz
- retry gerekiyorsa yeni payout batch veya kontrollü retry akışıyla işlenir
- aynı transfer ikinci kez kör şekilde gönderilmez

---

## 12. AUDIT / EVENT NOKTALARI

Payout owner sistemi en az şu event’leri üretebilmelidir:

- payout_batch_created
- payout_batch_validation_started
- payout_batch_blocked
- payout_batch_ready
- payout_batch_submitted
- payout_batch_partially_processed
- payout_batch_processed
- payout_batch_partially_failed
- payout_batch_failed
- payout_batch_closed

Ek olarak item-level event’ler de düşünülebilir:
- payout_item_submitted
- payout_item_paid
- payout_item_failed

Bu event’ler:
- finance dashboards
- audit
- risk
- analytics
alanlarında kullanılabilir.

---

## 13. IDEMPOTENCY KURALI

Aşağıdaki alanlarda duplicate önleme gerekir:

- aynı payable line’ın iki farklı batch’e yanlışlıkla tekrar alınması
- aynı batch’in sağlayıcıya iki kez gönderilmesi
- callback / provider sonucu tekrar işlenmesi
- aynı payout item’ın ikinci kez paid kabul edilmesi

En az şu anahtarlar normalize edilmelidir:
- payout_batch_id
- payout_reference
- payout_item_reference
- settlement_line_id
- provider_transfer_reference

Bu koruma olmazsa:
- double payout
- yanlış finance raporu
- settlement/payout uyumsuzluğu
- platform zararı
oluşabilir.

---

## 14. GORUNURLUK NOTU

### Fenomen / tedarikçi tarafı
- sade payout özeti
- dönemsel ödeme durumu
- “işlendi / bekliyor / bloklu” gibi sade projection

### Finance admin
- detaylı batch görünürlüğü
- line/item düzeyinde hata/başarı
- hold nedenleri
- provider response görünürlüğü

Net kural:
Alıcı taraf, tüm iç finance detail truth’unu görmez.

---

## 15. MOBIL / PANEL TASARIM NOTU

Payout batch yönetimi mobil öncelikli storefront özelliği değil; iç finance/admin panel özelliğidir.

Bu nedenle:
- admin/finance panelinde tablo ve batch detail ağırlıklı tasarlanır
- alıcı taraf için yalnız sade summary görünürlüğü açılır

---

## 16. KISA OZET

Doğru payout-batch omurgası şudur:

- payable finansal etkiler toplanır
- batch doğrulanır
- blok yoksa gönderilir
- başarı/kısmi başarı/başarısızlık sonucu işlenir
- transfer tamamlandığında kapanır

Bu nedenle payout-batch,
settlement’tan ayrı ama ona bağlı finansal icra state machine’i olarak tasarlanmalıdır.