# 00-PRODUCTION_READINESS_WORKING_RULES.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun mevcut foundation, hardening, domain implementation ve payment reconciliation kayıtlarından sonra, yayına hazır hale gelene kadar izlenecek yeni çalışma disiplinini tanımlar.

Bu dosya eski roadmap’in devamı değildir.

Bu dosyanın amacı:

- bundan sonraki tüm production-readiness çalışmalarında ortak kuralları sabitlemek
- sistem dosyaları ile kayıt dosyalarının birlikte okunmasını zorunlu hale getirmek
- kör ilerlemeyi ve varsayımı engellemek
- her fazın ayrı dosyada, kanıtlı ve kontrollü ilerlemesini sağlamak
- her faz sonunda `PASS`, `PASS WITH LIMITATION`, `PARTIAL` veya `FAIL` kararını standartlaştırmak
- gereksiz ağır test yükü oluşturmadan gerekli kanıt seviyesini korumak
- HARDENING-10C10 sonrası payment reconciliation durumunu doğru baseline’a almak

---

## 2. Ana Çalışma İlkesi

Bu aşamadan sonra çalışma modeli şudur:

```text
Sistem dosyası → yapılan kayıt → açık eksik → risk → faz planı → faz uygulaması → faz kontrolü → kapanış kararı
```

Hiçbir faz yalnız sezgiyle, tahminle veya eksik kaynakla başlatılmaz.

Her faz başlamadan önce:

- ilgili sistem dosyaları belirlenir
- ilgili kayıt dosyaları belirlenir
- önceden yapılan işler ayrılır
- eksikler ayrılır
- ertelenenler ayrılır
- riskler ayrılır
- kabul kriterleri yazılır

---

## 3. Değişmez Kurallar

### 3.1 Kör ilerleme yok

Kayıt veya sistem dosyasıyla desteklenmeyen karar alınmaz.

Bir işin yapıldığı söyleniyorsa kayıt karşılığı gösterilmelidir.

Bir eksik olduğu söyleniyorsa hangi sistem beklentisine göre eksik olduğu belirtilmelidir.

### 3.2 Varsayım yok

Dosya, paket, path, karar veya test sonucu uydurulmaz.

Bilgi yoksa şu ifadelerden biri kullanılır:

- `Kayıtlarda bulunamadı`
- `Sistem dosyasında beklenti var, uygulama kaydı net değil`
- `Bu madde faz içinde doğrulanmalıdır`
- `Ek dosya veya kaynak inceleme gerekir`

### 3.3 PASS kanıtsız verilmez

Bir faz veya iş için `PASS` kararı verilebilmesi için en az şu kanıt tiplerinden uygun olanlar bulunmalıdır:

- sistem dosyası eşleşmesi
- kayıt dosyası eşleşmesi
- owner / guard / permission kontrolü
- source review sonucu
- boundary review sonucu
- gerekli test veya smoke sonucu
- bilinen limitation kaydı

Kod etkisi olmayan planlama fazlarında test kanıtı aranmaz; ancak kaynak eşleştirme ve kontrol listesi zorunludur.

### 3.4 Production-ready iddiası en son verilir

Foundation tamamlandı demek production-ready demek değildir.

Release candidate kabulü, canlı yayın hazır anlamına gelmez.

Production-ready kararı yalnız release gate fazı kapandıktan sonra verilebilir.

---

## 4. Kaynak Okuma Modeli

Bundan sonraki çalışmalarda dosyalar şu rollerle kullanılacaktır.

### 4.1 Sistem dosyaları

54 sistem dosyası platformun hedef davranışını, iş kurallarını, aktör sınırlarını ve sistem mantığını tanımlar.

Bu dosyalar şu sorulara cevap verir:

- sistem ne olmalı?
- kim ne yapabilir?
- kim ne yapamaz?
- hangi akış hangi koşulla çalışır?
- hangi alan hangi sistemden beslenir?
- hangi ayrımlar korunmalıdır?

### 4.2 Kayıt dosyaları

63 / 64 / 65, hardening kayıtları, PX domain kayıtları ve HARDENING-10C10 birleşik referans kaydı yapılan işleri, kalan borçları, `PASS`, `PARTIAL`, `LIMITATION` kararlarını ve aktif riskleri gösterir.

Bu dosyalar şu sorulara cevap verir:

- ne kodlandı?
- hangi paket kapandı?
- hangi iş foundation seviyesinde kaldı?
- hangi iş `PASS WITH LIMITATION` aldı?
- hangi iş `PARTIAL` kaldı?
- hangi riskler hâlâ açık?
- production-readiness için hangi blocker’lar var?

### 4.3 Roadmap dosyaları

60 / 61 / 62 / 67 dosyaları yeni roadmap’in doğrudan devam ettirilecek planı değildir.

Bu dosyalar yalnız:

- tarihsel planlama bağlamı
- stratejik uygulama disiplini
- paket bazlı çalışma mantığı
- referans seti yaklaşımı
- eski paket numaralandırma bağlamı

amaçlarıyla kullanılır.

Yeni production-readiness roadmap’i sıfırdan, mevcut gerçek duruma göre çıkarılacaktır.

### 4.4 Anayasal dosyalar

OWNER_MATRIX, GUARD_MATRIX, PERMISSION_MATRIX ve TRANSITION_POLICIES her fazda sınır kontrolü için kullanılır.

Bu dosyaların temel kuralı:

- owner dışı write yok
- BFF truth owner değildir
- panel direct write yapmaz
- UI truth üretmez
- event state mutation yerine geçmez
- permission, eligibility ile karıştırılmaz
- transition yalnız ilgili owner alanında yapılır

---

## 5. HARDENING-10C10 Sonrası Payment Reconciliation Baseline Kuralı

HARDENING-10C10 kaydı, payment reconciliation hattında önceki baseline’ı güncellemiştir.

Bundan sonra payment / provider / callback / reconciliation değerlendirmelerinde aşağıdaki gerçek durum esas alınır:

### 5.1 Artık yapılmış kabul edilenler

HARDENING-10C10 hattında şu foundation işler yapılmış kabul edilir:

- PayTR status inquiry contract ve mapping foundation
- PayTR status inquiry adapter boundary remediation
- reconciliation decision contract / task model foundation
- reconciliation task persistence / repository foundation
- reconciliation worker dry-run / no mutation foundation
- owner command guard fix
- explicit opt-in controlled reconciliation payment mutation
- reconciliation E2E smoke / no order handoff validation
- reconciliation audit / outbox evidence + task finalization guard

Bu nedenle bundan sonra `reconciliation tamamen yok` ifadesi kullanılmaz.

Doğru ifade:

```text
Payment reconciliation foundation vardır; ancak production runtime ve order handoff hâlâ yoktur.
```

### 5.2 Hâlâ yapılmamış / açık kalanlar

HARDENING-10C10 sonrası aşağıdaki işler hâlâ production-readiness borcudur:

- canlı PayTR request yok
- gerçek PayTR HTTP çağrısı yok
- production PayTR entegrasyonu yok
- order create yok
- order handoff yok
- finance mutation yok
- settlement mutation yok
- payout mutation yok
- risk mutation yok
- BFF route yok
- scheduler / queue / background runtime yok
- outbox consumer / delivery worker yok
- production operator panel flow yok
- reconciliation task modelinde expected amount / currency kalıcı modele tam taşınmamış olabilir
- providerReference için payment tablosunda DB-level uniqueness guarantee ayrıca ele alınmalıdır
- PayTR returns alanı refund / settlement hattına bırakılmıştır

### 5.3 10C11’e geçiş kuralı

HARDENING-10C10 sonrası sıradaki mantıklı teknik hat:

```text
HARDENING-10C11 — Payment Succeeded → Order Handoff Foundation
```

Ancak 10C11’e doğrudan implementasyonla başlanmaz.

10C11 önce inventory / boundary review ile başlamalıdır.

Cevaplanmadan kodlanmayacak ana sorular:

1. Payment SUCCEEDED olduktan sonra order handoff nasıl başlar?
2. Order owner hangi command / event’i kabul eder?
3. Aynı payment için ikinci order nasıl engellenir?
4. Payment reconciliation event’i order handoff için yeterli mi, yoksa ayrı eligibility gerekir mi?
5. Order creation idempotency key nasıl üretilecek?
6. Payment failed / cancelled / unknown durumlarında order kesin nasıl engellenecek?
7. Audit / outbox hangi sınırda kullanılacak?
8. Order handoff event’i business truth mu, command mı, sadece trigger mı?
9. Reconciled payment ile ordinary callback success aynı order eligibility modelini mi kullanacak?
10. Duplicate success / alreadyApplied durumunda order handoff tekrar tetiklenecek mi?
11. Order owner payment attempt state’ini nasıl doğrulayacak?
12. Risk hold varsa order handoff duracak mı?
13. Finance / settlement order create sonrası mı, delivery sonrası mı tetiklenecek?
14. `payment.reconciliation.completed` event’i doğrudan order create tetiklememelidir; bu sınır nasıl korunacak?
15. Order create idempotency key `paymentAttemptId`, `checkoutId`, `paymentId` veya composite modelden hangisiyle üretilecek?

---

## 6. Faz Bazlı Çalışma Modeli

Her faz ayrı dosyada ele alınacaktır.

Her faz dosyası şu bilgileri içermek zorundadır:

1. fazın amacı
2. fazın kapsamı
3. referans sistem dosyaları
4. referans kayıt dosyaları
5. önceden yapılmış işler
6. önceden ertelenmiş veya sınırlı bırakılmış işler
7. bu fazda yapılacak işler
8. bu fazda yapılmayacak işler
9. owner / guard / permission kuralları
10. riskler
11. kabul kriterleri
12. gerekli test / kontrol / kanıtlar
13. kapanış kontrol listesi
14. faz sonu kararı
15. sonraki faza devreden işler

---

## 7. Faz Kapanış Kararları

Her faz sonunda yalnız dört karardan biri verilir.

### 7.1 PASS

Faz kapsamındaki işler tamamlanmıştır.

Gerekli kanıtlar vardır.

Sonraki faza geçişi engelleyen açık blocker yoktur.

### 7.2 PASS WITH LIMITATION

Fazın ana amacı tamamlanmıştır.

Ancak bilinçli olarak sonraki faza devredilen limitation veya production-readiness borcu vardır.

Bu limitation açıkça yazılmıştır.

### 7.3 PARTIAL

Faz içinde bazı işler yapılmıştır.

Ancak fazın ana amacı tam kapanmamıştır.

Sonraki faza geçmek riskli olabilir veya önce eksik kapatılmalıdır.

### 7.4 FAIL

Faz hedefi kapanmamıştır.

Kritik blocker vardır.

Faz kapatılamaz.

---

## 8. Test ve Kanıt Yaklaşımı

Bu projede test yaklaşımı risk bazlıdır.

Amaç gereksiz zaman kaybı yaratmak değil, kritik hataları kaçırmamaktır.

### 8.1 Her küçük değişiklikte tam test yok

Küçük düzeltme, dokümantasyon, isim sadeleştirme veya yalnız planlama dosyası için tam test zorunlu değildir.

### 8.2 Faz kapanışında uygun kanıt zorunludur

Her faz kapanışında fazın niteliğine göre yeterli kanıt aranır.

Planlama / mapping fazlarında:

- dosya eşleştirme kontrolü
- sistem beklentisi kontrolü
- kayıt karşılığı kontrolü
- risk ayrımı
- kapanış checklist’i

yeterlidir.

Kod etkisi olan fazlarda:

- source review
- boundary review
- typecheck / build gerekiyorsa
- ilgili smoke veya targeted test
- kritik journey etkisi varsa acceptance senaryosu

aranır.

### 8.3 Kritik alanlarda test seviyesi yükselir

Aşağıdaki alanlarda daha güçlü test ve kanıt gerekir:

- payment
- provider callback
- reconciliation
- order creation
- refund
- settlement
- payout
- risk / fraud
- owner boundary
- permission / guard
- critical journey E2E

### 8.4 Test seviyesi faza göre belirlenir

Her faz için test seviyesi ayrı yazılır.

Örnek:

```text
PHASE-00:
- Kod etkisi yok
- Test yok
- Kaynak eşleştirme ve baseline kontrolü var

PHASE-03 Payment / Provider:
- typecheck
- provider callback smoke
- duplicate / idempotency testi
- unknown-result testi
- reconciliation senaryosu
- payment → order handoff testi

PHASE-11 Critical Journey:
- full critical journey acceptance
- fail case kontrolü
- audit / event görünürlüğü
- regression kontrolü
```

---

## 9. Kapsam Dışı İş Üretme Yasağı

Bir faz içinde kapsam dışı yeni iş açılmaz.

Eğer faz sırasında yeni ihtiyaç bulunursa:

- risk olarak kaydedilir
- sonraki faza devredilir
- gerekiyorsa yeni faz veya alt faz önerilir
- mevcut fazın içine sessizce eklenmez

Bu kural scope creep’i önlemek için zorunludur.

---

## 10. Sistem Dosyası ve Kayıt Dosyası Eşleştirme Kuralı

Her sistem için yapılacak değerlendirme şu formatta olmalıdır:

```text
Sistem dosyası:
Sistem beklentisi:
Kayıtlarda yapılanlar:
Ertelenenler:
Eksikler:
Riskler:
Production-readiness durumu:
İlgili faz:
Karar:
```

Bu format dışına çıkılmaz.

---

## 11. Release Blocker Kuralı

Her eksik aynı ağırlıkta değildir.

Eksikler üç sınıfa ayrılır.

### 11.1 Release blocker

Yayına çıkışı engeller.

Örnek:

- canlı ödeme provider doğrulanmadı
- payment succeeded → order handoff yok
- critical journey E2E geçmedi
- deployment rollback planı yok
- production secrets / config gate kapanmadı

### 11.2 Production-readiness debt

Yayına hazırlık için kapanması gerekir, ama doğrudan tek başına blocker olmayabilir.

Örnek:

- bazı dashboard eksikleri
- bazı admin görünürlük eksikleri
- bazı operasyonel rapor eksikleri
- bazı provider retry / worker sertleştirmeleri

### 11.3 Monitored limitation

Bilinçli olarak izlenir.

Yayını tek başına engellemeyebilir; ancak kayıt altında tutulur.

---

## 12. Kayıt Disiplini

Her faz için iki dosya üretilir:

1. Faz plan dosyası
2. Faz kapanış raporu

Örnek:

```text
PHASE-03-PAYMENT-PROVIDER-CALLBACK-READINESS.md
PHASE-03-CLOSURE-REPORT.md
```

Faz kapanış raporu olmadan faz kapanmış sayılmaz.

---

## 13. İlk Çıkarılacak Dosyalar

Bu çalışma setinde ilk üretilecek dosyalar şunlardır:

1. `00-PRODUCTION_READINESS_WORKING_RULES.md`
2. `05-PHASE_FILE_TEMPLATE.md`
3. `06-PHASE_CLOSURE_TEMPLATE.md`
4. `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
5. `02-CURRENT_STATE_BASELINE.md`
6. `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
7. `04-PRODUCTION_READINESS_RISK_REGISTER.md`
8. `09-RELEASE_BLOCKER_REGISTER.md`

Bu sıradan sapılmayacaktır.

---

## 14. Nihai Çalışma Kararı

Bu dosya ile birlikte production-readiness çalışma disiplini başlatılmıştır.

Bundan sonraki tüm fazlar:

- sistem dosyalarına
- kayıt dosyalarına
- owner / guard / permission sınırlarına
- HARDENING-10C10 sonrası payment reconciliation baseline’ına
- risk bazlı test standardına
- faz kapanış raporuna

bağlı yürütülecektir.

Net karar:

```text
GO — Yeni production-readiness roadmap faz bazlı, kanıt kontrollü ve risk bazlı test yaklaşımıyla başlatılabilir.
```
