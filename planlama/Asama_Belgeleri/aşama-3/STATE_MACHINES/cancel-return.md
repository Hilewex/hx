# STATE_MACHINES/cancel-return

Bu dosya, iptal ve iade alanının kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- iptal ve iade aynı şey değildir
- iptal teslimat öncesi eksendir
- iade teslimat sonrası eksendir
- refund execution, cancel/return state machine’in finansal sonucu olabilir; ama aynı sistem değildir
- cancel/return, order’ı yok etmez; order’ın sonucunu ve ilişkili hakları değiştirir

İptal/iade sistemi, satış sonrası güven ve ticari düzeltme alanıdır. Siparişin kendisini silmez; siparişin yaşam sonucunu yönetir. 

---

## 1. CANCEL / RETURN SISTEMININ AMACI

Bu sistem şu işleri yapar:

- teslimat öncesi iptal taleplerini yönetmek
- teslimat sonrası iade taleplerini yönetmek
- satır bazlı veya sipariş bazlı hak uygunluğunu kontrol etmek
- ilgili operasyon, support, finance ve refund zincirlerini tetiklemek
- kullanıcıya görünür iade/iptal durumu üretmek
- yorum, story, verified purchase, puan ve settlement etkilerini başlatmak

Bu sistem şu işleri yapmaz:

- payment capture yapmak
- refund execution’ı tek başına yürütmek
- settlement hesabı yapmak
- order truth’unu silmek
- shipment owner’ı olmak

---

## 2. GIRDISI

Cancel/return sistemi şu truth alanlarından beslenir:

- order
- order lines
- shipment / delivery result
- return eligibility
- payment reference
- address / shipment proof gerekirse
- support / moderation / risk referansları
- user identity
- time window / policy rules

Net kural:
İptal ve iade uygunluğu doğrudan sepet veya checkout’a bakılarak değil; order, delivery ve policy birleşiminden hesaplanır.

---

## 3. AKTORLER

### 3.1 Kullanıcı
Kendi siparişi için iptal/iade talebini başlatabilir.

### 3.2 Platform
Cancel/return owner alanını yönetir.

### 3.3 Support
Vaka yönlendirme, sınıflandırma, açıklama ve escalation tarafında rol alır.

### 3.4 Operations
Teslimat öncesi iptal ve fiziksel geri akışlarda rol alabilir.

### 3.5 Finance
Refund / settlement etkisi ve finansal inceleme tarafında devreye girer.

### 3.6 Risk / Moderation
Abuse, sahte talep, yüksek risk veya içerik/kanıt sorunlarında devreye girebilir.

---

## 4. AYRIM: IPTAL VE IADE

### İptal
- teslimat öncesi
- henüz ürün kullanıcıya geçmemiştir
- sipariş/satır sevkiyat öncesi veya uygun operasyon aşamasındadır

### İade
- teslimat sonrası
- ürün kullanıcıya ulaşmıştır
- iade hakkı policy ve süre kurallarına bağlıdır

Net kural:
İptal ile refund aynı şey değildir.
İade ile refund da aynı şey değildir.
Refund, bunların finansal yürütme sonucu olabilir. 

---

## 5. CANCEL REQUEST STATE LISTESI

Önerilen iptal request state listesi:

- created
- under_review
- approved
- rejected
- operationally_blocked
- refund_pending
- refunded
- closed

İlk faz için güvenli omurga:
- created
- under_review
- approved
- rejected
- refund_pending
- refunded
- closed

---

## 6. RETURN REQUEST STATE LISTESI

Önerilen iade request state listesi:

- created
- under_review
- awaiting_return_shipment
- return_in_transit
- received_back
- approved
- partially_approved
- rejected
- refund_pending
- refunded_partially
- refunded_fully
- closed

İlk faz için çekirdek güvenli omurga:
- created
- under_review
- approved
- rejected
- refund_pending
- refunded_fully
- closed

Not:
Fiziksel geri gönderim ayrıntısı iş modeline göre daraltılabilir; ama kavramsal olarak sistem bunu taşıyabilmelidir.

---

## 7. CANCEL STATE TANIMLARI

### 7.1 created
İptal talebi oluşturulmuştur.

### 7.2 under_review
İptal uygunluğu ve operasyonel durdurulabilirlik incelenmektedir.

### 7.3 approved
İptal talebi kabul edilmiştir.
İlgili order/satır artık iptal etkisine girebilir.

### 7.4 rejected
İptal talebi reddedilmiştir.

### 7.5 operationally_blocked
İptal talebi iş kuralı, shipment durumu veya başka sebeple uygulanamaz hale gelmiştir.

### 7.6 refund_pending
İptalin finansal geri ödeme etkisi başlatılmıştır; refund sonucu beklenmektedir.

### 7.7 refunded
İptal için ilgili finansal geri ödeme kapanmıştır.

### 7.8 closed
İptal vakası kapanmıştır.

---

## 8. RETURN STATE TANIMLARI

### 8.1 created
İade talebi oluşturulmuştur.

### 8.2 under_review
İade uygunluğu, süre, satır, durum, gerekçe ve varsa kanıt incelenmektedir.

### 8.3 awaiting_return_shipment
Kullanıcının geri gönderim yapması beklenmektedir.

### 8.4 return_in_transit
İade edilen ürün fiziksel geri akıştadır.

### 8.5 received_back
İade edilen ürün geri alınmıştır.

### 8.6 approved
İade talebi kabul edilmiştir.

### 8.7 partially_approved
İadenin bir kısmı veya bazı satırları kabul edilmiştir.

### 8.8 rejected
İade talebi reddedilmiştir.

### 8.9 refund_pending
Finansal geri ödeme işlemi beklenmektedir.

### 8.10 refunded_partially
Kısmi geri ödeme tamamlanmıştır.

### 8.11 refunded_fully
Tam geri ödeme tamamlanmıştır.

### 8.12 closed
İade vakası kapanmıştır.

---

## 9. CANCEL ICIN GECERLI TRANSITION LISTESI

- created → under_review
- under_review → approved
- under_review → rejected
- under_review → operationally_blocked
- approved → refund_pending
- refund_pending → refunded
- approved → closed
  (refund gerekmeyen edge-case varsa)
- rejected → closed
- operationally_blocked → closed
- refunded → closed

---

## 10. RETURN ICIN GECERLI TRANSITION LISTESI

- created → under_review
- under_review → approved
- under_review → partially_approved
- under_review → rejected
- under_review → awaiting_return_shipment
- awaiting_return_shipment → return_in_transit
- return_in_transit → received_back
- received_back → approved
- received_back → partially_approved
- received_back → rejected
- approved → refund_pending
- partially_approved → refund_pending
- refund_pending → refunded_partially
- refund_pending → refunded_fully
- approved → closed
  (refund yoksa/başka çözüldüyse iş kuralına bağlı)
- rejected → closed
- refunded_partially → closed
- refunded_fully → closed

---

## 11. YASAK TRANSITION LISTESI

### Cancel
- created → refunded
- rejected → refunded
- operationally_blocked → refunded
- closed → any_active_state

### Return
- created → refunded_fully
- rejected → refunded_fully
- rejected → approved
- closed → any_active_state
- delivered olmamış satır için return create
- cancelled satır için return create

Net kural:
Teslim edilmemiş satır için iade açılmaz.
Teslim edilmiş satır için iptal açılmaz.

---

## 12. ELIGIBILITY KURALI

### Cancel eligible
Genel mantık:
- ilgili order/satır henüz teslim edilmemiş olmalı
- operasyon/shipment state iptale elverişli olmalı
- iş kuralı ve süre sınırları uygun olmalı

### Return eligible
Genel mantık:
- ilgili order/satır teslim edilmiş olmalı
- iade süresi dolmamış olmalı
- ürün tipi / hijyen / özel kural blokesi yoksa iade açılmalı
- risk/fraud veya policy blokesi yoksa akış ilerlemeli

Net kural:
Eligibility, yalnız auth ile açılmaz; order + delivery + policy birleşiminden hesaplanır.

---

## 13. ORDER ILE ILISKI

Cancel/return order’ı silmez.

Doğru model:
- iptal, order sonucunu değiştirir
- iade, teslim edilmiş order/satırın satış sonrası sonucunu değiştirir
- order projection “cancelled / partially_cancelled / return_in_progress / returned” gibi üst seviye görünür state’ler üretir

Line-level davranış first-class olmalıdır:
- kısmi iptal
- kısmi iade
- satır bazlı eligibility
- satır bazlı settlement düzeltmesi



---

## 14. PAYMENT / REFUND ILE ILISKI

Refund execution bu sistemin içinde “karar” olarak başlatılabilir; ama finansal yürütme payment/financial owner alanındadır.

Doğru zincir:
- cancel/return owner kararı verir
- refund gereksinimi üretir
- financial/payment owner refund execution yapar
- sonuç payment + settlement + payout etkilerine yansır

Net kural:
Return accepted olması, refund’un mutlaka aynı anda tamamlandığı anlamına gelmez. 

---

## 15. YORUM / STORY / PUAN ETKISI

Cancel/return sonucu şu alanları etkileyebilir:

- verified purchase görünürlüğü
- review eligibility
- story eligibility
- mevcut review/story görünürlüğü
- ödül puanı pending/vested/spendable durumu
- puan geri alma / eksi bakiye

Doğru model:
- yorum otomatik yok edilmez; verified/puan etkisi değişebilir
- kullanıcı story otomatik zorunlu silinmez; görünürlük/meta etkisi değişebilir
- puan geri alınabilir
- puan market kullanılmışsa eksi bakiye oluşabilir



---

## 16. SUPPORT / OPERATIONS / RISK ILISKISI

### Support
- vaka sınıflandırır
- kullanıcı iletişimini yürütür
- escalation başlatır

### Operations
- teslimat öncesi iptal uygulanabilirliği
- fiziksel geri akış / paket süreçleri
- shipment anomaly

### Risk
- abuse pattern
- sürekli iade / kupon sömürüsü
- çoklu hesap kaynaklı iade suistimali
- refund hold ihtiyacı

### Moderation
- görsel/kanıt/içerik itirazları varsa devreye girebilir

---

## 17. AUDIT / EVENT NOKTALARI

Cancel/return owner sistemi en az şu olayları üretebilmelidir:

### Cancel
- cancel_requested
- cancel_review_started
- cancel_approved
- cancel_rejected
- cancel_operationally_blocked
- cancel_refund_requested
- cancel_closed

### Return
- return_requested
- return_review_started
- return_awaiting_shipment
- return_in_transit
- return_received_back
- return_approved
- return_partially_approved
- return_rejected
- return_refund_requested
- return_refunded_partially
- return_refunded_fully
- return_closed

Bu event’ler:
- support
- analytics
- finance
- risk
- notification
alanlarında kullanılabilir.

---

## 18. IDEMPOTENCY KURALI

Aşağıdaki alanlarda idempotency gerekir:

- aynı satır için duplicate cancel create
- aynı satır için duplicate return create
- refund request tekrarları
- provider callback sonrası duplicate refunded sonucu
- repeated review action

En az şu anahtarlar gerekir:
- cancel_request_id
- return_request_id
- order_line_id
- refund_reference
- review_action_id

Bu koruma olmazsa:
- double refund
- çift iade talebi
- yanlış payout etkisi
- yanlış support görünürlüğü
oluşabilir.

---

## 19. KULLANICI GORUNURLUGU NOTU

Kullanıcıya gösterilecek dil sade olmalıdır:

### İptal tarafı
- iptal talebi alındı
- inceleniyor
- iptal edildi
- iptal reddedildi
- geri ödeme bekleniyor
- geri ödeme tamamlandı

### İade tarafı
- iade talebi alındı
- inceleniyor
- iade onaylandı
- iade reddedildi
- geri ödeme bekleniyor
- geri ödeme tamamlandı

İç risk, operasyon, finans inceleme dili kullanıcıya aynen yansıtılmaz.

---

## 20. MOBIL ONCELIKLI TASARIM NOTU

Cancel/return akışları mobil öncelikli olmalıdır:

- sipariş satırı düzeyinde net seçim
- kısa ve sade gerekçe akışı
- varsa kanıt/medya yükleme kolaylığı
- süreç ilerleme ekranı
- destek CTA’sı
- kullanıcıya gereksiz iç jargon gösterilmemesi

---

## 21. KISA OZET

Doğru cancel/return omurgası şudur:

- iptal teslimat öncesi eksendir
- iade teslimat sonrası eksendir
- refund finansal yürütmedir
- order sonucu değişir ama order silinmez
- line-level davranış birinci sınıf desteklenir

Bu nedenle cancel/return state machine, order ve payment’tan ayrı ama onlara bağlı tasarlanmalıdır.