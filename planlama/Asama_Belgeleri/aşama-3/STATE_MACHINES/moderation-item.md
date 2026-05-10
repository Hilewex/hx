# STATE_MACHINES/moderation-item

Bu dosya, moderasyon alanındaki içerik/vaka öğesinin kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- moderasyon, içerik ve davranış görünürlüğü/güvenliği alanıdır
- moderasyon, fraud/risk ile ilişkili olabilir ama aynı şey değildir
- moderasyon item, içerik veya davranış inceleme nesnesidir
- moderasyon kararı owner truth alanını doğrudan keyfi bozmaz; görünürlük, yayın ve kural uygulama etkisi üretir

Moderasyon sistemi; yorum, story, post, soru-cevap ve ilgili topluluk alanlarının güvenli çalışmasını sağlayan kurallı inceleme katmanıdır. 

---

## 1. MODERATION-ITEM SISTEMININ AMACI

Bu sistem şu işleri yapar:

- moderasyona konu olan öğeyi kayıt altına almak
- öğeyi doğru queue’ya almak
- inceleme, onay, reddetme, kısıtlama veya kaldırma kararını üretmek
- görünürlük etkisini yönetmek
- tekrar inceleme / appeal akışını desteklemek
- audit izi bırakmak

Bu sistem şu işleri yapmaz:

- finansal karar vermek
- sipariş truth mutate etmek
- risk sisteminin yerine geçmek
- kullanıcı puanını doğrudan owner gibi hesaplamak
- creator/supplier lifecycle’ı tek başına kapatmak

---

## 2. MODERATION ITEM GIRDISI

Moderation item şu kaynaklardan gelebilir:

- kullanıcı story
- yorum
- mağaza postu
- soru-cevap içeriği
- mağaza içerik alanları
- kullanıcı şikayeti
- admin iç açılışı
- otomatik kural motoru işareti
- risk sistemi referansı

Net kural:
Her içerik doğrudan moderasyona düşmek zorunda değildir; ama moderasyona düşen her öğe tek item olarak izlenmelidir.

---

## 3. AKTORLER

### 3.1 Kullanıcı
İçerik üreticisi veya şikayetçi olabilir.

### 3.2 Moderator
İnceleme ve karar üretim aktörüdür.

### 3.3 Moderation admin
Üst seviye karar, escalation ve quality control aktörüdür.

### 3.4 Risk/fraud team
Abuse veya koordineli kötü kullanım şüphesi varsa sinyal verebilir.

### 3.5 Admin
Kritik escalation ve nihai platform politikası tarafında rol alabilir.

---

## 4. MODERATION ITEM STATE LISTESI

Önerilen minimum state listesi:

- created
- queued
- in_review
- approved
- rejected
- restricted
- taken_down
- escalated
- appealed
- overturned
- closed

İlk faz için güvenli çekirdek:
- created
- queued
- in_review
- approved
- rejected
- restricted
- taken_down
- escalated
- closed

---

## 5. STATE TANIMLARI

### 5.1 created
Moderation item oluşmuştur.

### 5.2 queued
İnceleme kuyruğuna alınmıştır.

### 5.3 in_review
Moderator aktif olarak incelemektedir.

### 5.4 approved
İçerik/pattern mevcut politika açısından uygun bulunmuştur.

### 5.5 rejected
İçerik/pattern uygun bulunmamıştır; yayın/onay açılmaz.

### 5.6 restricted
İçerik tamamen kaldırılmamış ama görünürlüğü/scope’u sınırlandırılmıştır.

### 5.7 taken_down
İçerik yayından kaldırılmıştır.

### 5.8 escalated
Karar daha üst seviyeye taşınmıştır.

### 5.9 appealed
İçerik sahibi veya ilgili taraf karara itiraz etmiştir.

### 5.10 overturned
Önceki karar geri çevrilmiştir.

### 5.11 closed
Moderation item kapanmıştır; audit ve tarihsel kayıt korunur.

---

## 6. GECERLI TRANSITION LISTESI

- created → queued
- queued → in_review
- in_review → approved
- in_review → rejected
- in_review → restricted
- in_review → taken_down
- in_review → escalated
- escalated → approved
- escalated → rejected
- escalated → restricted
- escalated → taken_down
- approved → appealed
- rejected → appealed
- restricted → appealed
- taken_down → appealed
- appealed → escalated
- appealed → overturned
- approved → closed
- rejected → closed
- restricted → closed
- taken_down → closed
- overturned → closed

---

## 7. YASAK TRANSITION LISTESI

- created → approved
- created → taken_down
- queued → closed
- closed → in_review
- taken_down → approved
  (yeniden açılacaksa appeal/escalation üzerinden)
- rejected → approved
  (yeniden açılacaksa appeal/escalation üzerinden)

---

## 8. MODERATION KARAR ETKILERI

Moderation kararı aşağıdaki alanları etkileyebilir:

- içerik görünürlüğü
- yayın durumu
- verified işaretlerinin sunumu
- puan üretimi veya puan iptali
- creator/supplier kısıt sinyali
- risk escalation
- support case referansı

Net kural:
Moderasyon kararı görünürlük owner etkisi doğurur; financial owner veya commerce owner davranışı göstermez.

---

## 9. RISK ILE ILISKI

Moderation ve risk ayrı sistemlerdir.

Doğru ilişki:
- moderation içerik/politika uygunluğunu inceler
- risk kötüye kullanım/anomaliyi inceler
- bazı vakalarda risk sinyali moderation item açabilir
- bazı moderation kararları risk escalation tetikleyebilir

---

## 10. AUDIT / EVENT NOKTALARI

En az şu event’ler üretilmelidir:

- moderation_item_created
- moderation_item_queued
- moderation_review_started
- moderation_item_approved
- moderation_item_rejected
- moderation_item_restricted
- moderation_item_taken_down
- moderation_item_escalated
- moderation_item_appealed
- moderation_item_overturned
- moderation_item_closed

---

## 11. IDEMPOTENCY / DUPLICATE KURALI

Şu alanlarda duplicate önleme gerekir:

- aynı içerik için aynı zaman penceresinde çoklu moderasyon item
- aynı otomatik kural işaretinden çoklu item üretimi
- aynı şikayet zincirinin gereksiz çoğalması

En az şu alanlar normalize edilmelidir:
- subject_type
- subject_id
- source
- complaint_key
- created_window

---

## 12. KISA OZET

Doğru moderation-item omurgası şudur:

- item oluşur
- queue’ya girer
- incelenir
- onay / red / kısıt / kaldırma kararı alır
- gerekirse escalation/appeal çalışır
- audit iziyle kapanır