# STATE_MACHINES/shipment-delivery

Bu dosya, shipment ve delivery alanının kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- shipment / delivery, order değildir
- shipment / delivery, sipariş takip ekranı da değildir
- shipment/delivery fiziksel akışı taşır
- order tracking bu fiziksel akışı kullanıcı diline çeviren projection katmanıdır
- teslimat sonrası bazı haklar açılır: yorum, kullanıcı story, iade uygunluğu gibi

Teslimat sistemi, satış sonrası fiziksel akışın ve teslimat eşiklerinin owner alanıdır. 

---

## 1. SHIPMENT / DELIVERY SISTEMININ AMACI

Shipment / delivery sistemi şu işleri yapar:

- order satırlarını fiziksel gönderim bağlamına çevirmek
- paket/shipment üretmek
- taşıyıcıya devir ve taşıma sürecini izlemek
- teslimat ispatı / teslim sonucu üretmek
- kısmi teslimat / çoklu paket davranışını taşımak
- teslimat sonrası hak eşiklerini açmak

Shipment / delivery sistemi şu işleri yapmaz:

- siparişi oluşturmaz
- tahsilat yapmaz
- settlement hesaplamaz
- order truth’u yerine geçmez
- iade/refund owner’ı olmaz

---

## 2. SHIPMENT / DELIVERY GIRDISI

Bu sistem doğrudan şu kaynaklardan beslenir:

- confirmed order
- order lines
- operasyon ayrıştırma sonucu
- paketleme / hazırlama çıktıları
- tedarikçi / depo / fulfillment bağlamı
- adres snapshot
- lojistik uygunluk verileri
- taşıyıcı seçimi ve kargo referansları

Not:
Aynı order birden fazla shipment doğurabilir.
Aynı shipment birden fazla satır taşıyabilir.
Kısmi teslimat first-class citizen olarak düşünülmelidir. 

---

## 3. AKTORLER

### 3.1 Platform
Shipment/delivery owner alanını yönetir.

### 3.2 Tedarikçi
Kendine düşen hazırlama/sevkiyat girdilerini sağlar.

### 3.3 Sipariş operasyonu
Shipment akışını iç operasyon tarafından yönetir ve izler.

### 3.4 Taşıyıcı / kargo sağlayıcısı
Dış entegrasyon aktörüdür.

### 3.5 Kullanıcı
Shipment owner aktörü değildir; etkisini order tracking ve bildirimlerde hisseder.

### 3.6 Support / operations admin
Teslimat sorunlarını ve escalation’ları yönetir.

---

## 4. SHIPMENT STATE LISTESI

Önerilen minimum shipment state listesi:

- created
- awaiting_preparation
- preparing
- packed
- awaiting_handover
- handed_to_carrier
- in_transit
- out_for_delivery
- delivered
- delivery_failed
- returned_to_sender
- closed

İlk faz için güvenli çekirdek:
- created
- preparing
- packed
- handed_to_carrier
- in_transit
- delivered
- delivery_failed

---

## 5. SHIPMENT STATE TANIMLARI

### 5.1 created
Shipment kaydı oluşmuştur.
Order satırları fiziksel gönderim bağlamına ayrılmıştır.

### 5.2 awaiting_preparation
Hazırlama henüz başlamamıştır.

### 5.3 preparing
Toplama / hazırlama / paketleme süreci devam etmektedir.

### 5.4 packed
Paketleme tamamlanmıştır.

### 5.5 awaiting_handover
Paket hazırdır ama henüz taşıyıcıya verilmemiştir.

### 5.6 handed_to_carrier
Shipment taşıyıcıya teslim edilmiştir.

### 5.7 in_transit
Taşıma süreci devam etmektedir.

### 5.8 out_for_delivery
Teslimata çıkmıştır.

### 5.9 delivered
Teslimat başarıyla tamamlanmıştır.

### 5.10 delivery_failed
Teslimat girişimi başarısız olmuştur.

### 5.11 returned_to_sender
Gönderi geri dönmektedir veya göndericiye dönmüştür.

### 5.12 closed
Shipment aktif fiziksel yaşamını tamamlamıştır.

---

## 6. GECERLI TRANSITION LISTESI

### Oluşum ve hazırlık
- created → awaiting_preparation
- created → preparing
- awaiting_preparation → preparing
- preparing → packed
- packed → awaiting_handover
- packed → handed_to_carrier
- awaiting_handover → handed_to_carrier

### Taşıma
- handed_to_carrier → in_transit
- in_transit → out_for_delivery
- in_transit → delivered
- out_for_delivery → delivered
- out_for_delivery → delivery_failed

### İstisnalar
- delivery_failed → out_for_delivery
  (yeniden dağıtıma çıkma)
- delivery_failed → returned_to_sender
- in_transit → returned_to_sender

### Kapanış
- delivered → closed
- returned_to_sender → closed

---

## 7. YASAK TRANSITION LISTESI

- created → delivered
- preparing → delivered
- packed → delivered
- delivered → in_transit
- delivered → preparing
- closed → any_active_state
- returned_to_sender → delivered
  (ayrı yeniden gönderim akışı gerekirse yeni shipment ile çalışmalıdır)

---

## 8. DELIVERY SONUCU VE PROOF MANTIGI

Teslimat yalnız state değişimi değildir.
Teslimat sonucu aşağıdaki alanlarla desteklenmelidir:

- delivered_at
- carrier_reference
- delivery_attempt_count
- delivery_proof_type
- teslim alan bilgisi gerekiyorsa
- teslimat notu / failure reason

Delivery proof, shipment truth’u için referans kayıttır.
Order tracking bu detayı sadeleştirerek kullanıcıya gösterir.

---

## 9. ORDER ILE ILISKI

Doğru model:
- order resmi ticari kayıttır
- shipment fiziksel akıştır
- order bir veya daha fazla shipment içerebilir
- shipment state ile order state birebir aynı olmayabilir

Örnek:
- bir shipment delivered
- bir shipment in_transit
→ order state = partially_delivered olabilir

Bu yüzden:
shipment state line-level/fiziksel gerçeği,
order state ticari üst görünümü taşır. 

---

## 10. SIPARIS TAKIP ILE ILISKI

Order tracking shipment truth’unu doğrudan kopyalamaz.
Kullanıcıya sadeleştirilmiş görünür state verir.

Örnek kullanıcı dili:
- hazırlanıyor
- kargoya verildi
- yolda
- teslim edildi
- teslim edilemedi

Net kural:
shipment iç state’leri ile kullanıcı tracking state’leri birebir olmak zorunda değildir. :contentReference[oaicite:4]{index=4}

---

## 11. TESLIMAT SONRASI HAK ESIKLERI

Teslimat başarıyla tamamlandıktan sonra şu alanlar etkilenebilir:

- review eligibility açılması
- user product story eligibility açılması
- return eligible penceresi
- reward point lifecycle başlangıcı için uygunluk
- verified purchase görünürlüğü

Teslimat sistemi bu eşikleri doğrudan puan owner’ı olarak açmaz; ama gerekli teslimat truth’unu sağlar. 

---

## 12. KISMI TESLIMAT MANTIGI

Kısmi teslimat first-class desteklenmelidir.

Bu şu alanlara yansır:
- order state
- review/story eligibility satır bazında
- return eligibility satır bazında
- settlement düzeltmeleri
- support ticket sınıflandırması
- notification içeriği

Bu nedenle delivery sonucu order düzeyinde tek bool ile tutulmamalıdır.

---

## 13. TESLIM EDILEMEDI / ISTISNA AKISI

Delivery_failed için en az şu reason sınıfları gerekir:
- alıcıya ulaşılamadı
- adres problemi
- taşıyıcı problemi
- hasarlı gönderi
- reddedildi
- diğer lojistik istisnalar

Bu durumlar:
- support
- operations
- analytics
- risk
- iade/iptal
alanlarına bağlanabilir.

---

## 14. AUDIT / EVENT NOKTALARI

Shipment/delivery owner sistemi en az şu olayları üretebilmelidir:

- shipment_created
- shipment_preparation_started
- shipment_packed
- shipment_handed_to_carrier
- shipment_in_transit
- shipment_out_for_delivery
- shipment_delivered
- shipment_delivery_failed
- shipment_returned_to_sender
- shipment_closed

Bu event’ler:
- order tracking
- notification
- analytics
- support
- operations
alanlarında kullanılabilir.

---

## 15. IDEMPOTENCY KURALI

Aşağıdaki alanlarda idempotency gerekir:

- shipment create
- carrier callback consume
- delivery proof kayıtları
- failed/delivered duplicate callback işleme

En az şu anahtarlar gerekir:
- shipment_id
- carrier_reference
- callback_event_id
- delivery_proof_id

Bu koruma olmazsa:
- duplicate delivery
- yanlış eligibility açılması
- yanlış notification
- yanlış settlement etkisi
oluşabilir.

---

## 16. KULLANICI GORUNURLUGU NOTU

Kullanıcıya:
- iç hazırlama detayları
- tedarikçi iç operasyon dili
- ham taşıyıcı hata dili
doğrudan gösterilmez.

Görünür dil sade olmalıdır:
- hazırlanıyor
- kargoya verildi
- dağıtımda
- teslim edildi
- teslim edilemedi

---

## 17. MOBIL ONCELIKLI TASARIM NOTU

Teslimat görünürlüğü mobil öncelikli tasarlanmalıdır:

- en üstte current shipment/order state
- kargo hareketleri timeline şeklinde
- destek / iade / tekrar dene / teslimat sorunu bildir CTA’ları net
- çoklu paket varsa sade ayrıştırma
- satır bazlı teslimat farkları anlaşılır gösterim

---

## 18. KISA OZET

Doğru shipment/delivery omurgası şudur:

- order ticari truth’tur
- shipment fiziksel akıştır
- delivery proof sonucu hak eşiklerini etkiler
- order tracking bu fiziksel akışı kullanıcı diline çevirir

Bu nedenle shipment/delivery state machine, order state’inden ayrı ama ona bağlı tasarlanmalıdır.