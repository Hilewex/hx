# RELIABILITY_TARGETS

Bu dosya, platformun güvenilirlik hedeflerini tanımlar.

Amaç:
- platformun ne kadar erişilebilir, ne kadar dayanıklı ve ne kadar toparlanabilir olması gerektiğini yazılı hale getirmek
- kritik commerce zincirleri için availability ve recovery hedeflerini netleştirmek
- unknown_result, reconciliation, duplicate-safe işleme ve manual intervention alanlarını güvenilirlik kapsamına almak
- operasyonel kabul kriteri oluşturmak

Net kural:
- reliability yalnız uptime değildir
- truth güvenliği, duplicate koruması, veri dayanıklılığı ve toparlanabilirlik reliability kapsamındadır
- degraded çalışma, bazı yüzeylerde tam kapanmadan daha doğrudur
- critical commerce akışlarında sessiz veri kaybı kabul edilmez
- external provider başarısızlığı owner truth’u bozacak şekilde yayılmamalıdır

---

## 1. KAPSAM

Bu hedefler ilk fazda şu alanları kapsar:

- Public storefront read surfaces
- Checkout / payment / order zinciri
- Shipment / delivery ve tracking
- Eligibility / reward propagation
- Notification orchestration
- Panel read ve protected actions
- Settlement / payout
- Event ingestion ve async workers
- Medya/story yüzeyleri

---

## 2. RELIABILITY ILKELERI

## 2.1 Doğruluk önce gelir
Sistem hızlı ama yanlış çalışmamalıdır.
Özellikle:
- payment
- order
- shipment
- refund
- settlement
- payout
alanlarında sessiz yanlışlık kabul edilmez.

## 2.2 Degraded çalışma kabul edilir
Bazı read yüzeyleri tam kapanmak yerine dürüst degrade çalışabilir.
Ama:
- checkout
- payment
- order create
gibi çekirdek mutation zincirlerinde degrade, yanlış truth üretme pahasına kullanılamaz.

## 2.3 Unknown-result first-class durumdur
Timeout veya provider belirsizliği şu anlama gelmez:
- otomatik başarısız
- otomatik başarılı

Bu durumlar reliability kapsamına alınır ve reconciliation ile kapatılır.

## 2.4 Duplicate-safe davranış reliability konusudur
Aşağıdaki alanlarda duplicate-safe davranış güvenilirlik hedefidir:
- payment callback
- shipment callback
- payout result
- retry edilen internal command’ler

---

## 3. AVAILABILITY SINIFLARI

### R-A — Çekirdek commerce availability
En yüksek öncelikli alanlar

### R-B — Kritik ama çekirdek olmayan yüzey
Yüksek önemlidir ama commerce core kadar kritik değildir

### R-C — Operasyonel / iç araç / destekleyici alan
Daha toleranslı olabilir

---

## 4. YUZEY BAZLI AVAILABILITY HEDEFLERI

---

## 4.1 Public storefront read surfaces

Kapsam:
- home
- discover
- category
- search
- PDP
- public storefront

Sınıf:
- R-B

Hedef:
- yüksek erişilebilirlik
- dependency sorunu varsa dürüst degrade veya güvenli fail

Yorum:
Bu yüzeyler kritik görünürlük taşır ama çekirdek mutation zinciri değildir.

---

## 4.2 Checkout / payment / order zinciri

Kapsam:
- checkout review
- payment initiate
- callback/capture işleme
- order create

Sınıf:
- R-A

Hedef:
- çok yüksek güvenilirlik
- duplicate-safe finalization
- provider belirsizliği altında kontrollü kapanış

Yorum:
Bu alan platformun en kritik zinciridir.
Burada erişilebilirlik kadar correctness ve recoverability de esastır.

---

## 4.3 Shipment / delivery

Kapsam:
- shipment create
- delivery event ingestion
- tracking projection

Sınıf:
- shipment/delivery truth: R-A
- tracking projection: R-B

Yorum:
Shipment truth ile tracking projection aynı reliability sınıfında düşünülmez.
Projection bozulabilir; truth kaybolamaz.

---

## 4.4 Eligibility / reward propagation

Kapsam:
- verified purchase
- review eligibility
- story eligibility
- reward impact

Sınıf:
- R-B

Yorum:
Bu alanlar async olabilir ama yanlış veya kalıcı bozuk kalmamalıdır.
Gecikme kabul edilir, sessiz kayıp kabul edilmez.

---

## 4.5 Notification orchestration

Sınıf:
- R-C

Yorum:
Bildirim ana truth değildir.
Gönderim gecikmesi veya sınırlı kanal arızası core commerce zincirini durdurmamalıdır.
Ama intent kaybolmamalıdır.

---

## 4.6 Panel surfaces

Panel read:
- R-C

Panel protected actions:
- R-B

Yorum:
Panel action’larda availability kadar auditability ve guard correctness önemlidir.

---

## 4.7 Settlement / payout

Settlement:
- R-A

Payout:
- R-B / R-A arası, finansal kritiklik nedeniyle yüksek dikkat alanı

Yorum:
İlk fazda gerçek payout provider aktif olmayabilir.
Buna rağmen payout batch ve result modelinin güvenilirlik hedefi tanımlı olmalıdır.

---

## 5. ERROR BUDGET YAKLASIMI

Bu aşamada kesin yüzde yerine sınıf bazlı error budget yaklaşımı tanımlanır.

### E-A — Çok dar error budget
Çekirdek commerce zinciri

### E-B — Orta sıkılıkta error budget
Read yüzeyleri, eligibility propagation

### E-C — Daha toleranslı error budget
Notification, bazı panel listeleri, bazı medya yüzeyleri

Net kural:
- checkout/payment/order için error budget en sıkı sınıfta olmalıdır
- notification için daha toleranslı olunabilir
- event duplicate kaybı error budget konusu değil, correctness konusu olarak ele alınır

---

## 6. RECOVERY HEDEFLERI

## 6.1 RTO yaklaşımı
RTO = servis veya kritik akış bozulduğunda ne kadar sürede kabul edilebilir çalışma durumuna dönüleceği

Sınıflar:
- **T-A:** çok hızlı toparlanması gereken alan
- **T-B:** kısa sürede toparlanması gereken alan
- **T-C:** daha toleranslı toparlanma alanı

Örnek:
- checkout/payment/order = T-A
- shipment/tracking = T-B
- panel analytics / bazı notification yüzeyleri = T-C

## 6.2 RPO yaklaşımı
RPO = veri kaybı açısından ne kadar geriye dönük kayıp kabul edilebilir

Kural:
- payment/order/refund/settlement/payout için sessiz veri kaybı hedefi çok düşük veya fiilen sıfıra yakın olmalıdır
- projection/read model alanlarında daha toleranslı yaklaşım olabilir
- notification delivery log kaybı, financial truth kaybı ile aynı ciddiyette değildir

---

## 7. DATA DURABILITY HEDEFLERI

## 7.1 Truth kayıtları
Aşağıdaki alanlarda durability çok yüksek hedeflenir:
- payment
- order
- shipment
- refund
- settlement
- payout
- critical audit

## 7.2 Geçici bağlam
Aşağıdaki alanlarda durability önemlidir ama truth kadar aynı sınıfta değildir:
- checkout
- price lock
- stock reservation

## 7.3 Projection/read models
Aşağıdaki alanlar yeniden üretilebilir kabul edilebilir:
- discover/home read models
- some dashboard summaries
- notification projections
- some viewer aggregations

Net kural:
Yeniden üretilebilir veri ile financial/commercial truth aynı durability sınıfında düşünülmez.

---

## 8. RECONCILIATION HEDEFLERI

Reconciliation zorunlu alanlar:
- payment unknown_result
- payout unknown_result
- shipment create belirsizliği
- delayed or missing callback
- provider/internal state mismatch

Hedef:
- belirsiz kritik sonuçlar açıkta kalmamalı
- sistem “unknown” durumda takılı kalıp unutulmamalı
- reconciliation backlog izlenebilir olmalı

Başarı kriteri:
- kritik unknown_result vakaları kontrolsüz birikmemeli
- belli eşik aşıldığında alert/incident doğmalıdır

---

## 9. DUPLICATE VE IDEMPOTENCY HEDEFLERI

Reliability hedefi olarak:
- aynı callback ikinci kez truth mutation üretmemeli
- aynı command ikinci kez final side effect üretmemeli
- duplicate-safe davranış istisna değil, varsayılan tasarım hedefidir

Kritik alanlar:
- payment callback
- shipment/delivery callback
- payout result
- return/refund create
- settlement adjustment
- panel protected actions

---

## 10. MANUAL INTERVENTION HEDEFLERI

Aşağıdaki alanlarda manuel müdahale desteklenmelidir:
- payment unknown_result uzun sürüyorsa
- shipment/delivery sonucu çelişkiliyse
- payout sonucu belirsizse
- provider success var ama internal finalization başarısızsa
- duplicate/state mismatch açığa çıkmışsa

Net kural:
Manual intervention istisna akışıdır ama resmi olarak tasarlanmalıdır.

Başarı kriteri:
- kritik vakalar “loglarda kaybolmuş” halde kalmamalı
- support/ops/finance uygun düzeyde görünürlük alabilmeli

---

## 11. OBSERVABILITY VE ALERTING HEDEFLERI

Kritik reliability alanlarında şu izler zorunlu kabul edilir:
- request_id
- command_id
- event_id
- provider_reference
- previous_state
- next_state
- retry_count
- final_resolution

Alert önceliği yüksek alanlar:
- checkout/payment/order zinciri
- shipment delivered ingest
- payout result mismatch
- reconciliation backlog
- duplicate callback anomalileri

---

## 12. DAYANIKLI DEGRADE HEDEFLERI

Aşağıdaki yüzeylerde dayanıklı degrade kabul edilir:
- home
- discover
- search
- category
- PDP’nin bazı sosyal/yardımcı katmanları
- bazı panel listeleri

Aşağıdaki yüzeylerde degrade, yanlış truth üretecek şekilde kullanılamaz:
- checkout review
- payment finalization
- order create
- refund create/finalize
- settlement adjustment
- payout result finalization

---

## 13. RELIABILITY KABUL KRITERLERI

Bir alan “yeterince güvenilir” sayılmadan önce:

1. Duplicate-safe davranışı tanımlanmış olmalı
2. Unknown-result yönetimi tanımlanmış olmalı
3. Recovery / manual intervention yaklaşımı yazılmış olmalı
4. Audit/trace görünürlüğü olmalı
5. Truth ve projection ayrımı korunmalı
6. Gerekli yerde degrade davranış kuralları bulunmalı

---

## 14. IMPLEMENTASYON ICIN NET KARARLAR

1. Reliability yalnız uptime olarak ölçülmez
2. Checkout/payment/order zinciri en sıkı reliability sınıfındadır
3. Shipment truth ile tracking projection ayrı reliability hedefleri taşır
4. Eligibility/reward propagation gecikebilir ama kaybolamaz
5. Notification intent kaybı kabul edilmez; delivery gecikmesi kabul edilebilir
6. Unknown-result vakaları resmi operasyon konusu kabul edilir
7. Duplicate-safe işleme reliability hedefinin parçasıdır
8. Financial/commercial truth durability en yüksek sınıftadır
9. Manual intervention kritik belirsizlikler için resmi akıştır
10. Read yüzeylerde dürüst degrade, yanlış kesinlikten daha doğrudur

---

## 15. KISA OZET

Bu platformun reliability yaklaşımı şudur:

- kritik commerce truth’ları çok yüksek güvenilirlik hedefi taşır
- read yüzeyler daha esnek olabilir ama yalan söylemez
- duplicate-safe ve reconciliation tasarımı reliability’nin merkezindedir
- unknown-result alanları resmi state olarak yönetilir
- financial/commercial truth ile projection aynı dayanıklılık sınıfında değildir
- manual intervention istisna ama zorunlu tasarım parçasıdır