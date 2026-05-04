# CODING_READINESS_GATE

## 1. Amaç

Bu dosya, platformun kodlamaya başlama kararını sezgisel değil, ölçülebilir ve kanıt tabanlı bir kapı mekanizmasına dönüştürür.

Bu dosyanın amacı:

* önceki aşamalarda üretilen karar, boundary, contract, topology, engineering ve acceptance omurgalarını tek readiness kapısında toplamak
* “artık kod yazmaya başlayabilir miyiz?” sorusuna bağlayıcı ve dürüst cevap vermek
* eksik omurga varken erken kodlama başlamasını önlemek
* tam readiness ile conditional readiness durumlarını birbirinden ayırmaktır

Net kural:

* Kodlamaya başlama kararı hissiyatla verilmez
* Tek bir güçlü doküman bütün readiness’i tek başına sağlamaz
* Kritik anayasal eksik varken coding GO verilmez
* Acceptance omurgası yoksa coding GO verilmez
* Known limitation gizlenerek tam GO verilmez

---

## 2. Kapsam

Bu kapı ilk faz için aşağıdaki readiness ailelerini kapsar:

1. anayasal karar readiness’i
2. domain / owner / permission readiness’i
3. state / transition readiness’i
4. data / contract readiness’i
5. integration / provider readiness’i
6. topology / environment readiness’i
7. repo / engineering readiness’i
8. journey / acceptance readiness’i
9. test / kanıt readiness’i
10. final go / no-go / conditional go kararı

Bu dosya aşağıdaki alanları exact sprint planlama veya resourcing seviyesinde açmaz:

* ekip kişi dağılımı
* kaç geliştirici hangi modüle girecek
* teslim tarihi tahmini
* sprint backlog sıralaması

---

## 3. Temel ilkeler

### CG-001 — Coding readiness, mimari readiness’in sonucudur

**Binding Rule:** Kod yazmaya başlama kararı; owner boundary, transition, contract, topology ve engineering standardları sabitlenmeden verilmez.

### CG-002 — Ready olmayan alanlar görünür yazılır

**Binding Rule:** Eksik veya sınırlı alanlar saklanmaz; Go kararı bunları dürüstçe içerir.

### CG-003 — Conditional Go, tam Go değildir

**Binding Rule:** Bazı limitasyonlarla başlama kararı veriliyorsa bu açıkça `CONDITIONAL GO` olarak yazılır; tam readiness gibi sunulmaz.

### CG-004 — Journey acceptance readiness’in çekirdeğidir

**Binding Rule:** Kritik journey checklist ve acceptance pack olmadan “başlayalım, detayları sonra çözeriz” yaklaşımı kabul edilmez.

### CG-005 — Repo ve engineering standardı olmadan paralel kodlama açılmaz

**Binding Rule:** Çok modüllü geliştirme başlamadan önce repo blueprint, engineering standard, branch/release ve DoR/DoD omurgası mevcut olmalıdır.

---

## 4. Readiness karar seviyeleri

### G0 — NOT READY

Kritik anayasal veya acceptance eksikleri vardır. Kodlamaya başlanmaz.

### G1 — CONDITIONALLY READY

Ana omurga büyük ölçüde kurulmuştur; sınırlamalar kayıt altındadır. Kodlamaya kontrollü başlanabilir.

### G2 — READY / GO

Kritik anayasal, teknik, acceptance ve engineering omurgası tamamlanmıştır. Kodlamaya güvenli biçimde başlanabilir.

Net kural:

* Kritik domain projelerde hedef seviye `G2`’dir
* `G1` yalnız limitasyonlar açıkça kabul edildiğinde meşrudur

---

## 5. Kapı değerlendirme standardı

Her readiness ailesi şu mantıkla değerlendirilir:

* **Durum:** `PASS` / `PARTIAL` / `FAIL`
* **Gerekçe:** neden bu durumda olduğu
* **Risk:** eksikse neyi riske atıyor
* **Karar Etkisi:** Go kararını nasıl etkiliyor

Net kural:

* Gerekçesiz PASS verilmez
* FAIL alanı görmezden gelinerek tam GO verilmez

---

## 6. Anayasal karar readiness’i

### CG-010 — Kanonik kararlar sabit mi?

Beklenen:

* temel mimari kararlar dondurulmuş olmalı
* owner dışı write yasağı net olmalı
* BFF read-only aggregation çizgisi net olmalı
* panel direct write yok kuralı net olmalı
* UI truth üretmez çizgisi net olmalı

**PASS ölçütü:** Bu kararlar yazılı ve çelişkisiz şekilde sabitlenmiş olmalı. fileciteturn17file1

### CG-011 — Faz-1 kapsamı sabit mi?

Beklenen:

* in-scope / out-of-scope ana sınırlar belli olmalı
* first-phase yüzeyleri ve alanları bilinmeli

**PASS ölçütü:** Faz-1 kapsamı genişlemeye açık muğlak liste halinde değil, bağlayıcı plan halinde bulunmalı.

### CG-012 — Terim sözlüğü ve kavramsal ayrımlar sabit mi?

Beklenen:

* approved ≠ active
* captured ≠ order_created
* delivered ≠ review/story written
* settled ≠ payable
* payable ≠ paid_out
* permission ≠ eligibility

**PASS ölçütü:** Bu ayrımlar yazılı ve tekrar eden biçimde korunuyor olmalı. fileciteturn19file0turn17file0turn17file1

---

## 7. Domain / owner / permission readiness’i

### CG-020 — Owner matrisi ve guard matrisi sabit mi?

Beklenen:

* owner family’ler net olmalı
* permission/guard zinciri yazılı olmalı
* actor/scope/role ayrımları belli olmalı

**PASS ölçütü:** Hangi truth’un hangi owner’da mutate edildiği ve hangi actor’ün hangi yüzeye hangi şartta erişeceği belirlenmiş olmalı. fileciteturn17file1turn17file0

### CG-021 — Guest/authenticated/eligible/scope ayrımları hazır mı?

Beklenen:

* guest checkout istisnası net olmalı
* shopper scope ile creator/supplier/panel scope karışmamalı
* social haklar login + eligibility gerektirmeli

**PASS ölçütü:** Bu ayrımlar yolculuk checklist ve acceptance pack’te görünür olmalı. fileciteturn17file0turn17file1

---

## 8. State / transition readiness’i

### CG-030 — State machine’ler ve transition politikaları hazır mı?

Beklenen:

* checkout/payment/order/shipment/return/payout/lifecycle state machine’leri tanımlı olmalı
* transition tetikleyicileri, guard, audit, event ve irreversible/corrective ayrımı yazılı olmalı

**PASS ölçütü:** Transition anayasal omurgası mevcuttur ve journey acceptance ile çelişmez. fileciteturn19file0

### CG-031 — Ara state’ler atlanmıyor mu?

Beklenen:

* approved ≠ active
* captured ≠ order created
* delivered yalnız eligibility eşiği açar
* return approved ≠ refund completed

**PASS ölçütü:** Journey checklist ve acceptance pack bu ayrımları taşıyor olmalı. fileciteturn19file0

---

## 9. Data / contract readiness’i

### CG-040 — Veri modeli ve entity sınırları hazır mı?

Beklenen:

* temel entity katalogu ve logical data model mevcut olmalı
* line-level vs aggregate-level ayrımları bilinmeli

### CG-041 — API / panel / internal contracts hazır mı?

Beklenen:

* public/app/panel/internal yüzeyler için contract omurgası bulunmalı
* screen/panel contracts ve DTO/catalog omurgası mevcut olmalı

### CG-042 — Error contract standardı hazır mı?

Beklenen:

* canonical error family tanımlı olmalı
* transport vs domain vs eligibility vs finance hataları ayrılmış olmalı

**PASS ölçütü:** Error standardı ve API error catalog birlikte okununca fail case’ler acceptance yazmaya yeterli netlik vermeli. fileciteturn19file1

---

## 10. Integration / provider readiness’i

### CG-050 — Third-party integration matrix hazır mı?

Beklenen:

* payment/shipment/email/payout gibi provider alanları tanımlı olmalı
* sandbox/real provider ayrımı bilinmeli

### CG-051 — Timeout/retry/reconciliation politikası hazır mı?

Beklenen:

* timeout = failure değildir ilkesi yazılı olmalı
* retry-safe alanlar belirlenmiş olmalı
* unknown_result ve reconciliation path görünür olmalı

**PASS ölçütü:** Kritik provider davranışları acceptance seviyesinde ifade edilebilir olmalı. fileciteturn19file2

### CG-052 — Kör fallback politikası yok mu?

**PASS ölçütü:** Özellikle payment ve payout alanlarında unknown-result durumunda kör ikinci provider geçişi yasaklanmış olmalı. fileciteturn19file2

---

## 11. Topology / environment readiness’i

### CG-060 — Cloud topology ve environment architecture hazır mı?

Beklenen:

* public edge
* app layer
* gateway
* core services
* async workers
* data layer
* observability
* staging/prod isolation

**PASS ölçütü:** Bu omurga yazılı ve diyagramlı biçimde mevcut olmalı.

### CG-061 — Secrets/config politikası hazır mı?

Beklenen:

* secret vs config ayrımı
* least-privilege dağıtım
* staging/prod isolation
* rotation/revocation ilkeleri

**PASS ölçütü:** Frontend’de privileged secret yok, service-secret scope mantığı yazılı olmalı.

---

## 12. Repo / engineering readiness’i

### CG-070 — Repo blueprint hazır mı?

Beklenen:

* `apps / services / packages / infra / docs / tests` omurgası net olmalı
* BFF, panel, web ve owner services doğru family’de yerleşmeli

### CG-071 — Engineering standards hazır mı?

Beklenen:

* naming
* folder placement
* service katmanı ayrımı
* migration/env standardı
* test ve PR dili

### CG-072 — Branch/release policy hazır mı?

Beklenen:

* `main`, `develop`, `feature/*`, `pack/*`, `release/*`, `hotfix/*`
* merge kalite kapısı
* stabilization/hotfix disiplini

### CG-073 — DoR/DoD hazır mı?

Beklenen:

* başlama kapısı ve bitirme kapısı yazılı olmalı

**PASS ölçütü:** Paralel geliştirme kaosunu önleyecek engineering omurga mevcuttur.

---

## 13. Journey / acceptance readiness’i

### CG-080 — Critical journey checklist hazır mı?

Beklenen:

* kritik journey’ler listelenmiş olmalı
* her journey için success/fail/retry/permission/audit/analytics etkisi görünür olmalı

### CG-081 — Acceptance criteria pack hazır mı?

Beklenen:

* journey acceptance maddeleri ölçülebilir olmalı
* canonical error family ve transition ayrımları acceptance’e bağlanmış olmalı
* duplicate-safe ve unknown-result davranışları acceptance dışı bırakılmamalı

**PASS ölçütü:** Journey checklist ve acceptance pack birlikte kodlamaya başlamadan önce başarı ve başarısızlık ölçüsünü tarif ediyor olmalı.

---

## 14. Test / kanıt readiness’i

### CG-090 — Test stratejisi hazır mı?

Beklenen:

* T0–T4 seviyesi yazılı olmalı
* kritik zincirler tanımlı olmalı
* test kanıtı formatı belli olmalı

**PASS ölçütü:** Hangi değişiklikte hangi seviye test beklendiği readiness sonrası uygulamaya geçebilir düzeyde net olmalı. fileciteturn17file2

### CG-091 — Acceptance kanıt modeli hazır mı?

Beklenen:

* komut
* sonuç özeti
* senaryo doğrulaması
* limitation notu

**PASS ölçütü:** “çalışıyor gibi” dili yerine kanıt standardı bulunmalı. fileciteturn17file2

---

## 15. Coding readiness gate checklist

Tam GO / GO WITH LIMITATIONS / NO-GO kararı vermeden önce aşağıdaki checklist değerlendirilir:

* [ ] Kanonik kararlar sabit
* [ ] Faz-1 kapsamı sabit
* [ ] Owner / permission / guard omurgası hazır
* [ ] State machine ve transition politikaları hazır
* [ ] Veri modeli ve temel contracts hazır
* [ ] Error standardı ve API error catalog hazır
* [ ] Third-party integration ve fallback/retry politikası hazır
* [ ] Cloud topology / environment / secrets omurgası hazır
* [ ] Repo blueprint / engineering standards / branch-release policy hazır
* [ ] DoR / DoD hazır
* [ ] Critical journey checklist hazır
* [ ] Acceptance criteria pack hazır
* [ ] Test strategy ve kanıt standardı hazır
* [ ] Figma/screen/panel handoff izi mevcut

Net kural:

* Kritik maddelerden biri FAIL ise tam GO verilmez

---

## 16. Go / No-Go karar mantığı

### CG-100 — READY / GO

Aşağıdaki durumda verilir:

* checklist kritik maddeleri PASS
* acceptance omurgası hazır
* engineering ve topology omurgası hazır
* known limitation kritik amaca zarar vermiyor

### CG-101 — CONDITIONAL GO

Aşağıdaki durumda verilir:

* ana omurga PASS
* bazı alanlar PARTIAL
* sınırlamalar dürüstçe yazılmış
* coding kontrollü başlatılabilir ama risk notu açıktır

### CG-102 — NO-GO

Aşağıdaki durumda verilir:

* owner boundary belirsiz
* acceptance omurgası eksik
* transition/contract/topology/engineering ailesinde kritik FAIL var
* coding başlamak yeni teknik borç ve mimari çakışma üretecek

---

## 17. İlk faz için örnek karar mantığı

İlk faz için tam GO verilebilmesi adına özellikle şu ayrımların hazır olması zorunludur:

1. BFF read-only ve panel direct-write değil
2. guest checkout sosyal hak açmıyor
3. payment unknown-result explicit yönetiliyor
4. captured ≠ order created
5. delivered ≠ review/story yazıldı
6. return approved ≠ refund completed
7. approved ≠ active
8. payout duplicate-risk ve unknown-result politikası yazılı
9. acceptance pack fail/retry/error family içeriyor
10. repo ve engineering omurgası paralel geliştirmeye uygun

Bu maddelerden biri kritik biçimde eksikse full GO verilmemelidir. fileciteturn17file0turn17file1turn19file0turn19file1turn19file2turn17file2

---

## 18. Known limitation ve gate ilişkisi

### CG-110 — Limitation kayıt altına alınır

Örnek limitation alanları:

* bazı provider’lar sandbox düzeyinde
* payout gerçek provider yok
* bazı observability veya durability alanları tam prod seviyesi değil
* bazı acceptance’ler ilk iteration’da manual proof ile kapanabilir

### CG-111 — Limitasyon kritik amacı kırıyorsa tam GO verilmez

**Binding Rule:** Çekirdek journey veya owner boundary’yi kıran limitasyon varsa karar en fazla `CONDITIONAL GO` olur.

### CG-112 — Limitasyon saklanarak GO verilmez

---

## 19. Faz-1 minimum readiness gate omurgası

İlk fazda aşağıdaki omurga olmadan coding GO verilmez:

1. owner/guard anayasa seti
2. transition policy seti
3. contract + error omurgası
4. integration retry/reconciliation politikası
5. topology + secret/config omurgası
6. repo + engineering + branch/release standardı
7. DoR/DoD
8. critical journey checklist
9. acceptance criteria pack
10. test strategy ve kanıt standardı

---

## 20. Faz-1 dışında bırakılan alanlar

* kesin insan kaynağı planı
* sprint-by-sprint backlog dizilimi
* kesin release takvimi
* tam performans benchmark kapısı

---

## 21. Kısa sonuç

Bu gate ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Coding GO kararı ölçülebilir kapıya dayanır
* Acceptance ve journey omurgası olmadan başlama kararı verilmez
* Owner boundary, transition, error, retry/reconciliation ve topology readiness aynı kapıda birleşir
* Conditional Go ile tam Go açıkça ayrılır
* Known limitation dürüstçe yazılmadan tam readiness kararı verilmez

Bu dosya, Aşama 15’in bağlayıcı kodlamaya başlama kapısı ve final readiness karar mekanizmasıdır.
