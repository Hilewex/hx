# STATE_MACHINES/order

Bu dosya, sipariş sisteminin kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- order, payment değildir
- order, sipariş operasyonu değildir
- order, shipment/delivery görünürlüğünün kendisi değildir
- order, başarılı payment sonucu oluşan resmi ticari kayıttır
- order oluştuktan sonra yaşam döngüsü teslimat, iade, refund, settlement ve payout zincirlerine veri taşır

Sipariş sistemi, satışın resmi ticari gerçeğini taşır.
Ödeme başarıyla kapanmadan order oluşmaz. 

---

## 1. ORDER SISTEMININ AMACI

Order sistemi şu işleri yapar:

- başarılı payment sonrası resmi satış kaydı oluşturmak
- order satırlarını sabitlemek
- fiyat / adres / mağaza bağlamı snapshot’larını taşımak
- shipment / delivery / return / settlement süreçlerine referans truth üretmek
- kullanıcıya sipariş görünürlüğü için temel kaynak olmak

Order sistemi şu işleri yapmaz:

- ödeme tahsilatı yapmak
- fulfillment operasyonunu yürütmek
- shipment hareketini yönetmek
- refund execution yapmak
- payout üretmek

Net kural:
Order ticari gerçektir; operasyon ve finans bu gerçeğin etrafında çalışır. 

---

## 2. ORDER GIRDISI

Order create için minimum girişler:

- başarılı payment sonucu
- checkout validated context
- checkout_id
- payment_attempt_id
- user_id veya guest_context_id
- validated_line_items
- final_total
- address_context
- coupon/campaign snapshot
- store/storefront context
- currency
- order create idempotency key

Net kural:
Order doğrudan sepetten oluşmaz.
Order, checkout + payment zinciri sonrası oluşur. 

---

## 3. ORDER AKTORLERI

### 3.1 Kullanıcı
Siparişin sahibi olan müşteri aktörüdür.
Siparişi görüntüler, takip eder, uygunluk varsa iade/iptal başlatır.

### 3.2 Platform
Order truth owner’ıdır.

### 3.3 Payment sistemi
Başarılı ödeme sonucu order create hakkı doğurur.

### 3.4 Sipariş operasyon sistemi
Order truth’u okuyup operasyon iş akışına çevirir.

### 3.5 Teslimat sistemi
Order ve shipment referanslarıyla fiziksel süreci yürütür.

### 3.6 Finans sistemi
Order snapshot ve financial line’lardan settlement/payout zinciri kurar.

### 3.7 Admin / operasyon / destek
Siparişe ait projection ve operasyonel görünürlük kullanır; direct truth owner değildir.

---

## 4. ORDER STATE LISTESI

Önerilen minimum profesyonel state listesi:

- created
- confirmed
- in_operation
- partially_fulfilled
- fulfilled
- partially_delivered
- delivered
- partially_cancelled
- cancelled
- return_in_progress
- partially_returned
- returned
- closed

İlk faz için çekirdek güvenli omurga:

- created
- confirmed
- in_operation
- delivered
- cancelled
- return_in_progress
- returned
- closed

Not:
Order state ile shipment state birebir aynı olmak zorunda değildir.
Order üst düzey ticari görünüm state’i taşır; shipment daha ayrıntılı lojistik state taşır. 

---

## 5. STATE TANIMLARI

### 5.1 created
Order kaydı oluşturulmuştur.
Henüz ilk doğrulama/yerleştirme adımları bitmemiş olabilir.

### 5.2 confirmed
Order resmi ticari kayıt olarak kabul edilmiştir.
Ana snapshot’lar sabitlenmiştir.

### 5.3 in_operation
Sipariş operasyon sistemi order’ı iç iş akışına çevirmiştir.
Hazırlama / ayrıştırma / fulfillment çalışıyordur.

### 5.4 partially_fulfilled
Sipariş satırlarının bir kısmı operasyonel olarak hazırlanmış/sevke uygun hale gelmiştir.

### 5.5 fulfilled
Siparişin tüm satırları operasyonel hazırlık açısından tamamlanmıştır.

### 5.6 partially_delivered
Siparişin bazı satırları veya paketleri teslim edilmiştir; tamamı değil.

### 5.7 delivered
Siparişin teslimat açısından tamamı teslim edilmiştir.

Not:
Teslim edilen satır bazında yorum/story eligibility açılabilir.
Tüm siparişin delivered olması her satırın aynı anda teslim edildiği anlamına gelmeyebilir. 

### 5.8 partially_cancelled
Siparişin bazı satırları teslimat öncesi iptal edilmiştir.

### 5.9 cancelled
Sipariş tamamen iptal edilmiştir.

### 5.10 return_in_progress
Teslim edilmiş sipariş veya satırları için iade süreci başlamıştır.

### 5.11 partially_returned
Siparişin bazı satırları iade edilmiştir.

### 5.12 returned
Siparişin tamamı iade edilmiştir.

### 5.13 closed
Sipariş aktif ticari yaşamını tamamlamıştır.
Artık yalnız tarihsel ve finansal referans olarak yaşar.

---

## 6. GECERLI TRANSITION LISTESI

### Oluşum
- created → confirmed

### Operasyon akışı
- confirmed → in_operation
- in_operation → partially_fulfilled
- in_operation → fulfilled
- partially_fulfilled → fulfilled

### Teslimat akışı
- fulfilled → partially_delivered
- fulfilled → delivered
- partially_delivered → delivered

### İptal akışı
- confirmed → partially_cancelled
- confirmed → cancelled
- in_operation → partially_cancelled
- in_operation → cancelled
- partially_fulfilled → partially_cancelled
  (iş modeline göre bazı satırlar iptal olabilir)

### İade akışı
- delivered → return_in_progress
- partially_delivered → return_in_progress
- return_in_progress → partially_returned
- return_in_progress → returned
- partially_returned → returned

### Kapanış
- cancelled → closed
- delivered → closed
- returned → closed
- partially_returned → closed
- partially_cancelled → closed
  (iş modeline göre finans/operasyon tamamen kapanınca)

---

## 7. YASAK TRANSITION LISTESI

- created → delivered
- confirmed → delivered
- cancelled → delivered
- returned → delivered
- closed → in_operation
- closed → delivered
- cancelled → return_in_progress
  (iptal edilmiş ve teslim edilmemiş order için iade akışı açılmaz)
- delivered → confirmed

Net kural:
Teslimat ve iade akışları order state’i geriye sarmamalıdır.

---

## 8. ORDER SNAPSHOT KURALI

Order oluştuğunda en az şu alanlar snapshot olarak sabitlenir:

- order line items
- ürün/varyant bağlamı
- mağaza/storefront bağlamı
- address snapshot
- price snapshot
- coupon snapshot
- campaign effect snapshot
- ödeme referansı
- kullanıcı/guest kimlik bağlamı

Bu snapshot’lar sonradan ürün, fiyat, adres veya mağaza değişse bile order gerçeğini bozmaz. 

---

## 9. PAYMENT ILE ILISKI

### Ana kural
- payment captured olmadan order create edilmez
- order create payment callback’in içinde kör biçimde çalıştırılmaz
- payment success sonucu order create command üretir
- order create idempotent olmalıdır

### Özel durum
Payment başarılı olduğu halde order create başarısız olabilir.
Bu durum kritik incident kabul edilir.

Doğru model:
- payment captured event / command
- idempotent order create
- retry / reconciliation zinciri

---

## 10. SIPARIS OPERASYONU ILE ILISKI

Sipariş operasyon sistemi order değildir.

Doğru ilişki:
- order = resmi ticari kayıt
- sipariş operasyonu = bu kaydı operasyon işine çeviren iç motor

Bu nedenle:
- order state ile ops state birebir aynı olmak zorunda değildir
- ops detayları kullanıcı order view’a aynen yansıtılmaz
- order, operasyonun üst seviye ticari sonucu olarak yaşar. 

---

## 11. TESLIMAT ILE ILISKI

Teslimat sistemi order’dan veri okur ama delivery truth ayrı akışta ilerler.

Doğru model:
- order bir veya birden fazla shipment/paket doğurabilir
- teslimat satır/sipariş bazında kısmi olabilir
- order tracking kullanıcıya sadeleştirilmiş state gösterir
- “teslim edildi” görünürlüğü order + shipment + delivery proof birleşiminden türetilir

---

## 12. IPTAL / IADE ILE ILISKI

### İptal
Teslimat öncesi eksendir.
Order’ı yok etmez; order sonucunu değiştirir.

### İade
Teslimat sonrası eksendir.
Refund execution ile birleşebilir ama onunla aynı şey değildir.

### Kritik kural
İptal / iade etkileri:
- order projection
- payment/refund
- settlement
- payout
- review/story eligibility
alanlarına yansıyabilir.



---

## 13. ORDER LINE VE KISMI AKISLAR

Order tek state taşısa da line-level etkiler desteklenmelidir.

Özellikle:
- kısmi iptal
- kısmi teslimat
- kısmi iade
- satır bazlı yorum/story eligibility
- satır bazlı settlement düzeltmesi

Bu yüzden order üst state’i sade olabilir; ama line-level model ayrıntılı tutulmalıdır.

---

## 14. AUDIT / EVENT NOKTALARI

Order owner sistemi en az şu olayları üretebilmelidir:

- order_created
- order_confirmed
- order_sent_to_operations
- order_partially_fulfilled
- order_fulfilled
- order_partially_delivered
- order_delivered
- order_partially_cancelled
- order_cancelled
- order_return_started
- order_partially_returned
- order_returned
- order_closed

Bu event’ler:
- analytics
- notification
- support
- finance
- risk
alanlarında kullanılabilir.

---

## 15. IDEMPOTENCY KURALI

Aşağıdaki alanlarda idempotency zorunludur:

- order create
- payment success sonrası create/retry
- same callback same order create zinciri
- order return/cancel command’ları
- ops handoff tetikleme

En az şu anahtarlar gerekir:
- order_create_key
- payment_attempt_id
- checkout_id
- order_idempotency_version

Bu koruma olmazsa:
- duplicate order
- yanlış shipment
- yanlış settlement
- yanlış notification
oluşabilir.

---

## 16. KULLANICI GORUNURLUGU NOTU

Kullanıcıya gösterilen sipariş dili:
- “hazırlanıyor”
- “kargoya verildi”
- “teslim edildi”
- “iade sürecinde”
gibi sade olmalıdır.

İç operasyon state’leri kullanıcıya doğrudan dökülmemelidir.
Order tracking, operasyonel karmaşıklığı sadeleştiren yüzdür. :contentReference[oaicite:9]{index=9}

---

## 17. MOBIL ONCELIKLI TASARIM NOTU

Order detail ve order tracking mobil öncelikli çalışmalıdır:

- en üstte sade current state
- paket/satır kırılımı sade görünür
- iade/yorum/story gibi açılan haklar net CTA ile sunulur
- gereksiz operasyon dili kullanılmaz

---

## 18. KISA OZET

Doğru order omurgası şudur:

- checkout doğrular
- payment tahsilatı kapatır
- order resmi ticari kayıt olur
- ops/delivery/return/finance zincirleri order etrafında çalışır

Bu nedenle order state machine:
ticari truth’u taşır, operasyon detayını aynen kopyalamaz.