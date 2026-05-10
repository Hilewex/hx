# TEST_STRATEJISI

Bu dosya, platformun planlama ve kodlama sürecinde uygulanacak test stratejisini tanımlar.

Amaç:
- test işini rastgele ve dağınık olmaktan çıkarmak
- her küçük kod değişikliğinden sonra tam test koşma zorunluluğu oluşturmamak
- buna karşılık, anlamlı modül kapanışlarında ve kritik geçişlerde güçlü doğrulama yapmak
- owner boundary, state machine, API contract, idempotency ve kritik akışların güvenliğini korumak

Net kural:
- her küçük kod satırından sonra tam test zorunlu değildir
- test, anlamlı iş paketi / modül / aşama kapısı tamamlandığında yapılır
- kritik akışlar test edilmeden “tamamlandı” sayılmaz
- test seviyesi, yapılan değişikliğin etkisine göre seçilir
- test kanıtı olmayan önemli kapanış kabul edilmez

---

## 1. TEST FELSEFESI

Bu projede test yaklaşımı şu ilkeye dayanır:

### 1.1 Mikro değişiklik sonrası tam test zorunlu değildir
Küçük refactor, isim düzeltmesi, yorum ekleme veya izole ufak değişikliklerden sonra tüm test setini çalıştırmak zorunlu değildir.

### 1.2 Anlamlı kapanış sonrası doğrulama zorunludur
Aşağıdaki gibi anlamlı teslim noktalarında test zorunludur:
- bir PACK tamamlandığında
- bir modülün ana akışı bittiğinde
- bir state machine implementasyonu kapandığında
- bir endpoint ailesi tamamlandığında
- bir entegrasyon zinciri ilk kez çalışır hale geldiğinde
- bir aşama kapanışına gelindiğinde

### 1.3 Test, değişikliğin ağırlığına göre seçilir
Her iş için aynı test seviyesi uygulanmaz.

Örnek:
- yalnız read schema değiştiyse contract + smoke yeterli olabilir
- state machine geçişi değiştiyse transition testleri gerekir
- checkout/payment/order zinciri etkilenmişse entegrasyon testi gerekir
- payout/settlement etkilenmişse finansal doğrulama gerekir

---

## 2. TEST ZAMANLAMA PRENSIBI

## 2.1 Test ne zaman ZORUNLU?
Aşağıdaki durumlarda test zorunludur:

1. Yeni bir domain akışı eklendiğinde
2. Mevcut state machine transition değiştiğinde
3. Owner boundary etkilenince
4. API contract değişince
5. Idempotency davranışı etkilenince
6. Snapshot / archive / financial logic etkilenince
7. Bir PACK veya modül “tamamlandı” denildiğinde
8. Bir aşama kapısı kapanırken

## 2.2 Test ne zaman ERTELENEBİLİR?
Aşağıdaki durumlarda tam test paketi hemen zorunlu değildir:

1. Dosya içi küçük refactor
2. İsim sadeleştirme
3. Açıklama/yorum ekleme
4. Aynı davranışı koruyan küçük düzenleme
5. Henüz yarım olan ve anlamlı akış oluşturmayan ara geliştirme

Net kural:
Ara geliştirme boyunca kısmi kontrol yapılabilir ama “kapanış testi” daha sonra toplu yapılır.

---

## 3. TEST SEVIYELERI

---

## 3.1 T0 — Statik doğrulama
Amaç:
- kod yapısı ve tip güvenliği

Kapsam:
- lint
- typecheck
- schema validation
- openapi validation
- build doğrulaması

Ne zaman:
- anlamlı dosya grubu tamamlandığında
- merge öncesi
- aşama/paket kapanışı öncesi

Bu seviye tek başına yeterli değildir.

---

## 3.2 T1 — Modül davranış testi
Amaç:
- izole iş kuralını doğrulamak

Kapsam:
- unit test
- state transition test
- pure logic test
- guard test
- permission test
- serializer / mapper test

Ne zaman:
- yeni state machine eklendiğinde
- transition değiştiğinde
- idempotency/guard logic yazıldığında
- mapping/contract mantığı kritik olduğunda

---

## 3.3 T2 — Kontrat testi
Amaç:
- API ve modüller arası sözleşme uyumunu doğrulamak

Kapsam:
- request/response contract
- OpenAPI schema doğrulama
- error code doğrulama
- mock fixture doğrulama
- serialization consistency

Ne zaman:
- endpoint ailesi tamamlandığında
- public/app/panel/internal contract değiştiğinde
- mocking seti güncellendiğinde

---

## 3.4 T3 — Entegrasyon testi
Amaç:
- birden fazla modülün birlikte doğru çalıştığını doğrulamak

Kapsam:
- checkout -> payment -> order
- order -> shipment
- return -> refund
- settlement -> payout
- shipment delivered -> eligibility propagation
- panel action -> owner command sonucu

Ne zaman:
- ilk kez uçtan uca zincir kurulduğunda
- kritik akışta önemli değişiklik yapıldığında
- paket kapanışında

---

## 3.5 T4 — Kabul / kapı testi
Amaç:
- iş paketi veya aşamanın kabul kriterlerini kanıtlamak

Kapsam:
- senaryo bazlı acceptance test
- karar dokümanına bağlı doğrulama
- “hazır / tamamlandı” iddiasını kanıtlama

Ne zaman:
- PACK kapanışında
- aşama kapanışında
- release öncesi
- önemli milestone’larda

Bu seviye olmadan kritik kapanış kabul edilmez.

---

## 4. TEST TETIKLEYICI MATRISI

### 4.1 State machine değiştiyse
Zorunlu:
- T0
- T1
- ilgiliyse T3
- kapanışta T4

### 4.2 Endpoint contract değiştiyse
Zorunlu:
- T0
- T2
- ilgiliyse T3
- paket kapanışında T4

### 4.3 Sadece UI projection değiştiyse
Genelde yeterli:
- T0
- gerekli UI/contract smoke
- anlamlıysa T2

### 4.4 Finansal mantık değiştiyse
Zorunlu:
- T0
- T1
- T3
- kapanışta T4

### 4.5 Permission / guard değiştiyse
Zorunlu:
- T0
- T1
- T2
- panel/internal etkileniyorsa T3

### 4.6 Snapshot / archive / eligibility mantığı değiştiyse
Zorunlu:
- T0
- T1
- T3
- önemli pakette T4

---

## 5. KRITIK ZINCIRLER VE ZORUNLU TESTLER

Bu sistemde aşağıdaki zincirler “kritik akış” kabul edilir:

### 5.1 Checkout -> Payment -> Order
Minimum:
- checkout review doğrulama
- payment create / capture sonucu
- duplicate order create engeli
- checkout expired davranışı
- stock/price conflict

### 5.2 Order -> Shipment -> Delivery
Minimum:
- shipment create
- event append
- delivered event işleme
- duplicate callback koruması

### 5.3 Delivery -> Verified Purchase / Review / Story Eligibility
Minimum:
- delivered sonrası eligibility active
- return sonrası revoke / update
- yanlış line için hak açılmaması

### 5.4 Return -> Refund
Minimum:
- return request create
- return decision
- refund create/execute
- return approved != refund completed ayrımı

### 5.5 Settlement -> Payout
Minimum:
- settlement line create
- adjustment append
- payable ayrımı
- payout batch create
- payout result işleme

### 5.6 Panel Protected Actions
Minimum:
- scope check
- permission check
- actor not allowed
- invalid transition
- reason_code zorunluluğu
- audit izi

---

## 6. TEST KAPILARI

Bu projede test kapıları şu mantıkla uygulanır:

## 6.1 Kodlama içi ara kontrol
Amaç:
- tamamen kopmamak
- büyük hata birikimini önlemek

Zorunlu olmayan ama önerilen:
- typecheck
- ilgili modül smoke
- basit unit doğrulama

Bu aşama “tam kabul testi” değildir.

## 6.2 PACK kapanış testi
Zorunlu:
- T0
- ilgili T1/T2
- kritik akış etkileniyorsa T3
- acceptance kanıtı

PACK kapatılmadan önce test kanıtı bulunmalıdır.

## 6.3 Aşama kapanış testi
Zorunlu:
- T0 toplu
- kritik zincirler için T3
- senaryo bazlı T4
- varsa açık sınırlamalar dürüstçe yazılır

Aşama kapanışı test kanıtsız yapılamaz.

---

## 7. TEST KAPSAMI HEDEFI

Bu projede hedef “rastgele yüksek yüzde” değil, “kritik risk alanlarının tam kapsanması”dır.

Öncelik sırası:

1. state machine geçişleri
2. owner boundary ve guard
3. idempotency
4. API contract
5. financial correctness
6. eligibility/reward side effects
7. projection/read consistency

Net kural:
Düşük riskli yardımcı kodlarda aşırı test yazmak yerine, kritik akışların açıkta kalmaması daha önemlidir.

---

## 8. MOCK VE TEST ILISKISI

Mock testte kullanılabilir ama:

- mock truth değildir
- mock ile geçen test production doğruluğu garantilemez
- mock ağırlıklı test daha çok:
  - contract
  - UI
  - happy path / error path görünürlüğü
  için uygundur

Gerçek kritik doğrulamalar için:
- gerçek state logic
- gerçek transition
- gerçek idempotency
- gerçek integration behavior
ayrıca test edilmelidir

---

## 9. TEST KANITI FORMATI

Önemli kapanışlarda test kanıtı şu biçimde sunulmalıdır:

- çalıştırılan komut
- sonuç özeti
- geçen/başarısız test sayısı
- varsa bilinen sınırlama
- hangi senaryoların doğrulandığı

Örnek kanıt bileşenleri:
- `pnpm run typecheck`
- `pnpm run build`
- ilgili test komutu
- acceptance senaryo adı
- çıktı özeti

Net kural:
“çalışıyor gibi” ifadesi kanıt sayılmaz.

---

## 10. RED / KABUL KRITERI

Aşağıdaki durumda iş “tamamlandı” sayılmaz:

- kritik akış değişmiş ama test yoksa
- endpoint contract değişmiş ama doğrulama yoksa
- state machine değişmiş ama transition testi yoksa
- financial logic değişmiş ama entegrasyon doğrulaması yoksa
- panel protected action eklenmiş ama guard/permission testi yoksa

Aşağıdaki durumda kabul edilebilir:
- küçük ara geliştirme yapılmış
- iş henüz kapanış noktasında değil
- tam test bir sonraki anlamlı kapıda yapılacak

---

## 11. YURUYEN ISKELET ICIN TEST YAKLASIMI

İlk implementasyon akışında:
- en ince dikey dilim seçilir
- o dilim için T0 + T2 + T3 minimum seviyede çalıştırılır

Amaç:
- tüm sistemi değil
- ilk gerçek uçtan uca zinciri doğrulamak

Bu yaklaşım, erken entegrasyon riski azaltır.

---

## 12. KISA OZET

Doğru test stratejisi şudur:

- her küçük kod değişikliğinden sonra tam test zorunlu değildir
- test, anlamlı iş paketi ve aşama kapanışlarında zorunludur
- test seviyesi değişikliğin etkisine göre seçilir
- kritik zincirler mutlaka entegrasyon ve kabul seviyesiyle doğrulanır
- state machine, owner boundary, idempotency, API contract ve financial logic en yüksek önceliktir
- test kanıtı olmayan önemli kapanış kabul edilmez