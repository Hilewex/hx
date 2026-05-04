# GUARD_MATRIX

Bu matris, platformda aksiyonların hangi koruma katmanlarından geçerek çalıştığını tanımlar.

Net kural:
Bir aksiyonun çalışması için yalnız “giriş yapılmış mı?” sorusu yeterli değildir.
Doğru kontrol zinciri şudur:

1. Authentication guard
2. Role / scope guard
3. Ownership guard
4. Eligibility guard
5. State / lifecycle guard
6. Risk / moderation / financial block guard
7. Idempotency / replay guard (gerekiyorsa)

Her aksiyon bütün guard katmanlarını kullanmak zorunda değildir.
Ancak kritik ticari ve yönetsel aksiyonlarda bu zincir sistematik olarak uygulanmalıdır.

---

## 1. AUTHENTICATION GUARD

### Amacı
Aktörün gerçekten tanımlı kimlikle işlem yapıp yapmadığını kontrol eder.

### Temel sorular
- kullanıcı giriş yapmış mı?
- panel kullanıcısı oturum açmış mı?
- internal service kimlik doğrulaması sağlam mı?
- request imzalı / yetkili mi?

### Uygulandığı başlıca alanlar
- beğeni / kaydetme / takip
- mesaj gönderme
- soru sorma
- yorum yazma
- kullanıcı story yükleme
- panel erişimi
- admin aksiyonları
- payout/finance ekranı
- protected internal endpoints

### Not
Guest checkout, auth guard’ın istisna tanımlı ticari akışıdır.
Bu istisna sosyal write guard’larını açmaz.

---

## 2. ROLE / SCOPE GUARD

### Amacı
Aktörün hangi scope içinde işlem yapabildiğini kontrol eder.

### Scope örnekleri
- guest scope
- shopper scope
- creator scope
- supplier scope
- admin scope
- moderator scope
- operations scope
- finance scope
- internal scope

### Temel sorular
- bu aktör bu yüzey/endpoint için doğru rolde mi?
- kullanıcı shopper scope’ta mı?
- fenomen creator scope’ta mı?
- tedarikçi supplier scope’ta mı?
- admin ilgili alt role sahip mi?

### Uygulandığı başlıca alanlar
- creator panel
- supplier panel
- admin modülleri
- finance görünürlüğü
- moderation queue
- support ticket iç ekranları

### Not
Aynı kimlik altında profile switch olabilir; ama scope değişmeden aksiyon açılamaz.

---

## 3. OWNERSHIP GUARD

### Amacı
Aksiyonun ilgili truth alanında doğru owner tarafından yürütülmesini sağlar.

### Temel sorular
- bu write aksiyonu doğru owner sistemde mi?
- panel yalnız command mi gönderiyor?
- BFF bu alanda write yapmaya çalışıyor mu?
- bu sistem yalnız projection mi taşıyor, yoksa owner mı?

### Kritik kurallar
- owner dışı write yoktur
- BFF write yapmaz
- panel direct write yapmaz
- UI truth üretmez
- event ile owner state mutate edilmez

### Uygulandığı başlıca alanlar
- fiyat değişikliği
- payout hold/release
- settlement mutation
- moderation visibility decision
- creator/supplier lifecycle kararı
- order create / refund execute / campaign rule update
- search ranking vs candidate ayrımı

### Not
Ownership guard teknik erişim izni değil, mimari yetki sınırıdır.

---

## 4. ELIGIBILITY GUARD

### Amacı
Aktör auth sahibi olsa bile, ilgili hakkın gerçekten açılıp açılmadığını kontrol eder.

### Temel sorular
- kullanıcı review eligible mi?
- story eligible mi?
- return eligible mi?
- payout eligible mi?
- campaign/coupon kullanımı için uygun mu?
- question aksiyonu için gerekli şartlar sağlanıyor mu?

### Uygulandığı başlıca alanlar
- yorum yazma
- kullanıcı story yükleme
- iade başlatma
- puan market kullanma
- payout alma
- bazı kupon modelleri
- verified purchase badge görünürlüğü

### Not
Eligibility, auth sonrası ikinci ana savunma katmanıdır.
Birçok kullanıcı aksiyonu role ile değil eligibility ile açılır.

---

## 5. STATE / LIFECYCLE GUARD

### Amacı
İşlemin, nesnenin veya sürecin doğru yaşam döngüsü anında olup olmadığını kontrol eder.

### Temel sorular
- ürün aktif mi?
- checkout valid mi?
- payment pending mi / completed mi?
- order create için payment başarıyla kapanmış mı?
- shipment oluşturmak için order uygun durumda mı?
- iade için teslimat tamamlanmış mı?
- creator/supplier aktif mi, askıda mı?
- kupon / kampanya süresi aktif mi?

### Uygulandığı başlıca alanlar
- order create
- refund / return request
- review / story açılışı
- shipment işlemleri
- payout batch’e giriş
- creator/supplier panel erişimi
- campaign / coupon active window kontrolü

### Not
State guard, permission’dan sonra değil; çoğu zaman onunla birlikte çalışır.

---

## 6. RISK / MODERATION / FINANCIAL BLOCK GUARD

### Amacı
İlgili aksiyonu risk, moderasyon veya finansal inceleme sebebiyle geçici ya da kalıcı olarak sınırlamak.

### Alt guard türleri

#### 6.1 Risk Guard
- fraud flag
- suspicious pattern
- abuse hold
- velocity / anomaly block

#### 6.2 Moderation Guard
- içerik görünürlüğü engeli
- hesap / mağaza içerik yükleme kısıtı
- Q&A / post / story yayın yasağı

#### 6.3 Financial Guard
- payout hold
- unsettled state
- blocked balance
- refund review / sponsor dispute / reconciliation hold

### Uygulandığı başlıca alanlar
- puan kullanımı
- payout alma
- creator/supplier görünürlük ve içerik aksiyonları
- yüksek riskli checkout/payment akışları
- moderation bekleyen içeriklerin yayınlanması
- settlement/payout işlemleri

### Not
Risk guard ile moderation guard aynı şey değildir.
Financial guard ise bunlardan ayrı bir alanıdır.

---

## 7. IDEMPOTENCY / REPLAY GUARD

### Amacı
Aynı isteğin tekrar gelmesi halinde duplicate etki üretmemesini sağlar.

### Temel sorular
- bu istek daha önce işlendi mi?
- aynı payment callback tekrar mı geliyor?
- aynı order create command ikinci kez mi geldi?
- payout tetikleme daha önce çalıştı mı?
- aynı event replay mi?

### Uygulandığı başlıca alanlar
- payment callbacks
- order create
- refund execute
- payout trigger
- coupon apply/consume
- event consumer işlemleri
- analytics/event ingestion dedupe gereken alanlar

### Not
İdempotency özellikle dış entegrasyonlarda zorunludur.

---

## 8. GUARD ZINCIRLERI / ORNEK AKISLAR

### 8.1 Kullanıcının yorum yazması
1. Authentication guard
2. Scope guard (shopper)
3. Eligibility guard (review eligible)
4. State guard (ilgili sipariş satırı delivered)
5. Risk/moderation guard
6. Idempotency guard (aynı yorum hakkı tekrar kullanılıyor mu)

### 8.2 Kullanıcının ürün story yüklemesi
1. Authentication guard
2. Scope guard (shopper)
3. Eligibility guard (story eligible)
4. State guard (delivered + ürün etiketi)
5. Moderation guard
6. Risk guard

### 8.3 Guest checkout
1. Guest checkout rule check
2. Checkout eligibility guard
3. State guard (ürün/varyant/sepet geçerli)
4. Risk guard
5. Payment readiness guard

### 8.4 Creator’ın mağaza kuponu oluşturması
1. Authentication guard
2. Scope guard (creator)
3. State guard (creator aktif, kısıt yok)
4. Permission guard (kupon sistemi creator için açık)
5. Ownership guard (panel command → owner modül)
6. Financial/rule guard (sponsor modeli, fiyat koridoru)

### 8.5 Tedarikçinin baz fiyat güncellemesi
1. Authentication guard
2. Scope guard (supplier)
3. State guard (supplier aktif, ürün kendi kapsamında)
4. Permission guard (base price update açık)
5. Ownership guard (supplier input → platform pricing owner)
6. Idempotency / duplicate input guard

### 8.6 Admin’in fenomeni askıya alması
1. Authentication guard
2. Scope guard (admin / creator admin)
3. Permission guard
4. Ownership guard (panel action → creator lifecycle owner)
5. Audit guard
6. Risk/finance/moderation referans kontrolü gerekiyorsa uygulanır

### 8.7 Finance admin’in payout hold koyması
1. Authentication guard
2. Scope guard (finance admin)
3. Permission guard
4. Ownership guard (panel action → financial truth owner)
5. Financial state guard
6. Audit guard
7. Idempotency guard

---

## 9. HANGI ALANLARDA HANGI GUARD ZORUNLU

### Minimum auth + scope + ownership
- panel ekranları
- admin aksiyonları
- internal protected endpoints

### Minimum auth + eligibility + state
- review
- story
- return
- reward point use

### Minimum auth + scope + ownership + audit
- admin approve/reject
- creator/supplier restriction
- payout hold/release
- campaign / coupon rule update

### Minimum state + idempotency
- payment callback
- order create
- refund execute
- payout trigger

---

## 10. KISA OZET

- Auth guard: “kim?”
- Scope guard: “hangi rolde?”
- Ownership guard: “hangi truth alanında?”
- Eligibility guard: “bu hakkı gerçekten açtı mı?”
- State guard: “şu an doğru anda mı?”
- Risk/Moderation/Financial block guard: “engelleyici bir durum var mı?”
- Idempotency guard: “aynı işlem tekrar mı geliyor?”

Doğru sistem davranışı, bu guard katmanlarını aksiyona göre birlikte kullanmaktır.