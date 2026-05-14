# ACTIVE_RISKS_AND_DECISIONS

## 1. Amaç

Bu dosya, uygulama sürecinde aktif kalan riskleri, bilinçli alınmış kararları ve tekrar açılmaması gereken netleşmiş yönleri kısa ve izlenebilir biçimde kayda geçirir.

Bu dosyanın amacı:

* canlı riskleri tek yerde toplamak
* bilinçli bırakılan sınırlamaları görünür tutmak
* geçmişte alınmış kritik kararların yeniden tartışılmasını azaltmak
* yeni sohbete geçildiğinde “neden böyle ilerliyoruz?” sorusuna kısa ama resmi cevap verebilmektir

Net kural:

* Bu dosya ayrıntılı analiz raporu değildir
* Bu dosya canlı risk ve karar defteridir
* Buradaki kayıtlar kısa, net ve yürütme odaklı olmalıdır
* Kapanan riskler işaretlenmeli, aktif olmayanlar sonsuza kadar açık bırakılmamalıdır

---

## 2. Kayıt formatı

Her kayıt şu alanları taşır:

* Kayıt Kodu
* Tür (`RISK` / `DECISION` / `LIMITATION`)
* Başlık
* Durum (`ACTIVE` / `MONITORED` / `CLOSED`)
* Kısa Açıklama
* Etkilediği Alan
* Gerekli Aksiyon
* Not

Net kural:

* Kayıt kısa ama belirsiz olmayacak
* Her aktif risk için en az bir sonraki aksiyon görülebilir olmalı

---

## 3. Aktif kayıtlar

### ARD-001

**Tür:** DECISION
**Başlık:** Ana yürütme dosyası kullanılır
**Durum:** ACTIVE

**Kısa Açıklama:**
Uygulama sürecinde tek resmi aktif durum kaynağı `63-IMPLEMENTATION_PROGRESS_MASTER.md` olacaktır.

**Etkilediği Alan:**
Genel yürütme disiplini

**Gerekli Aksiyon:**
Her paket kapanışında 63 ve 64 numaralı dosyalar güncellenecek.

**Not:**
Plan belgeleri anayasa olarak kalır; aktif durum 63 numaralı dosyada tutulur.

---

### ARD-002

**Tür:** DECISION
**Başlık:** Paket bazlı ilerleme zorunludur
**Durum:** ACTIVE

**Kısa Açıklama:**
Kodlama kontrolsüz modül bazlı değil, paket bazlı yürütülecektir.

**Etkilediği Alan:**
Kodlama yöntemi

**Gerekli Aksiyon:**
Aktif paket dışına feature yayılımı yapılmayacak.

**Not:**
Her paket için referans seti açılmadan çalışma başlatılmayacaktır.

---

### ARD-003

**Tür:** DECISION
**Başlık:** Owner boundary anayasal olarak sabittir
**Durum:** ACTIVE

**Kısa Açıklama:**
Aşağıdaki kararlar sabittir:

* owner dışı write yok
* BFF read-only aggregation
* panel direct write yok
* UI truth üretmez
* projection truth değildir

**Etkilediği Alan:**
Tüm uygulama paketi ve mimari

**Gerekli Aksiyon:**
Her paket kapanışında boundary kontrolü yapılacak.

**Not:**
Bu kararlar yeniden tartışılmayacak; yalnız ihlal riski varsa kayda işlenecek.

---

### ARD-004

**Tür:** DECISION
**Başlık:** Kritik state ayrımları sabittir
**Durum:** ACTIVE

**Kısa Açıklama:**
Aşağıdaki ayrımlar değişmez kabul edilir:

* approved ≠ active
* captured ≠ order_created
* delivered ≠ review/story written
* settled ≠ payable
* payable ≠ paid_out
* return_approved ≠ refund_completed

**Etkilediği Alan:**
Commerce, lifecycle, payout, post-delivery

**Gerekli Aksiyon:**
Transition-sensitive paketlerde ilgili state machine ve transition politikaları açık tutulacak.

**Not:**
Bu ayrımlar ihlal edilirse paket kapanışı verilmez.

---

### ARD-005

**Tür:** RISK
**Başlık:** `planlama/` klasörünün kalıcı standardı net değil
**Durum:** ACTIVE

**Kısa Açıklama:**
Tüm plan ve referans belgeleri şu an `planlama/` altında tutuluyor. Bu yapı şu an çalışıyor; ancak uzun vadede kalıcı standart mı yoksa `docs/plan` ile yeniden düzenlenecek mi kararı henüz resmi olarak kapanmadı.

**Etkilediği Alan:**
Belge yolları, prompt yazımı, uzun vadeli repo temizliği

**Gerekli Aksiyon:**
P05–P07 aralığında karar verilmeli: `planlama/` kalıcı mı, geçici mi?

**Not:**
Şu an kapanış engeli değil; ama ileride path standardı netleşmeli.

---

### ARD-006

**Tür:** LIMITATION
**Başlık:** Web ve Panel entrypoint’ler framework öncesi foundation seviyesinde
**Durum:** MONITORED

**Kısa Açıklama:**
`apps/web/src/index.ts` ve `apps/panel/src/index.ts` şu an framework öncesi foundation entrypoint’tir. Nihai Next.js / Vite / gerçek UI runtime girişine daha sonra evrilecektir.

**Etkilediği Alan:**
Web / Panel shell

**Gerekli Aksiyon:**
Gerçek framework entegrasyonu başladığında bu kayıt güncellenecek.

**Not:**
Paket 4 kapanışında bilinçli olarak kabul edilmiştir.

---

### ARD-007

**Tür:** LIMITATION
**Başlık:** Observability stack local foundation seviyesinde
**Durum:** MONITORED

**Kısa Açıklama:**
Grafana, Loki, Tempo ve diğer local runtime servisleri foundation seviyesinde ayağa kaldırılmıştır. Bu kurulum production-grade observability tuning anlamına gelmez.

**Etkilediği Alan:**
Infra, observability, local runtime

**Gerekli Aksiyon:**
İleri paketlerde gerçek telemetry wiring ve dashboard/alert standardı geliştirilecek.

**Not:**
Paket 2 kapanışında bilinçli kabul edilmiştir.

---

### ARD-008

**Tür:** RISK
**Başlık:** Shared-kernel büyüme riski
**Durum:** ACTIVE

**Kısa Açıklama:**
`packages/shared-kernel` minimal foundation olarak başladı. İlerleyen paketlerde gereksiz utility/orchestration/business logic yığılması riski vardır.

**Etkilediği Alan:**
Shared package disiplini

**Gerekli Aksiyon:**
Her shared package değişikliğinde boundary review yapılacak.

**Not:**
Özellikle auth, cart, checkout, payment paketlerinden itibaren dikkat gerektirir.

---

### ARD-009

**Tür:** RISK
**Başlık:** Config package decision-engine’e dönüşme riski
**Durum:** ACTIVE

**Kısa Açıklama:**
`packages/config` parse/validation amacıyla kuruldu. Sonraki paketlerde runtime karar veya business branching taşımaya kayma riski vardır.

**Etkilediği Alan:**
Config, env, startup disiplini

**Gerekli Aksiyon:**
Config değişiklikleri parse/schema/validation sınırında tutulacak.

**Not:**
Dağınık `process.env` kullanımına geri dönüş kabul edilmeyecek.

---

### ARD-010

**Tür:** DECISION
**Başlık:** Runtime ve build kanıtı olmadan paket kapanmaz
**Durum:** ACTIVE

**Kısa Açıklama:**
Sadece “oluşturuldu” raporu artık yeterli kabul edilmeyecek. Dosya kanıtı, komut kanıtı ve gerekiyorsa runtime kanıtı zorunludur.

**Etkilediği Alan:**
Tüm paket kapanış disiplini

**Gerekli Aksiyon:**
Her paket PASS kararı öncesi gerçek kanıt üretecek.

**Not:**
P01–P04 denetim sürecinden çıkan temel çalışma kuralıdır.

---

### ARD-011

**Tür:** RISK
**Başlık:** Auth/access başlamadan protected surface’e feature sızması
**Durum:** ACTIVE

**Kısa Açıklama:**
P05–P07 paketleri kapanmadan protected surface’lere veya role-sensitive feature’lara girilirse scope/permission kaosu oluşabilir.

**Etkilediği Alan:**
Panel, support, moderation, creator/supplier surfaces, social actions

**Gerekli Aksiyon:**
P05–P07 tamamlanmadan protected feature paketleri açılmayacak.

**Not:**
Sıradaki paket sırasına uyum kritik.

---

### ARD-012

**Tür:** DECISION
**Başlık:** BFF health şu an foundation health’tir
**Durum:** MONITORED

**Kısa Açıklama:**
`/health` endpoint şu an minimal runtime alive kontrolüdür. Gerçek dependency-aware health değildir.

**Etkilediği Alan:**
BFF shell, observability, runtime

**Gerekli Aksiyon:**
İleri paketlerde dependency health ve degraded status modeli eklenecek.

**Not:**
Paket 4 kapanışında bilinçli kabul edilmiştir.

---

### ARD-013

**Tür:** LIMITATION
**Başlık:** Event ve error foundation ilk versiyondadır
**Durum:** MONITORED

**Kısa Açıklama:**
Shared package düzeyinde canonical event envelope ve base error foundation kuruldu. Domain genişledikçe kontrollü genişleme gerekecek.

**Etkilediği Alan:**
Shared packages, contracts, downstream services

**Gerekli Aksiyon:**
Yeni paketlerde ayrı error/event dili icat edilmemeli; bu foundation genişletilmelidir.

**Not:**
Kapanış engeli değil; genişleme disiplini gerektirir.
### ARD-014
**Tür:** DECISION
**Başlık:** Auth ile permission ayrımı sabittir
**Durum:** ACTIVE

**Kısa Açıklama:**
Authentication ve session foundation, permission/authorization ile aynı katmanda çözülmeyecektir.

**Etkilediği Alan:**
Auth, access, panel/web shell, BFF context

**Gerekli Aksiyon:**
Yeni paketlerde auth sonucu ile permission sonucu aynı hata/karar sınıfına indirgenmeyecek.

**Not:**
P05 kapanışında sabitlenmiştir.

---

### ARD-015
**Tür:** DECISION
**Başlık:** Permission ile eligibility ayrımı sabittir
**Durum:** ACTIVE

**Kısa Açıklama:**
Bir actor’ün giriş yapmış veya role/scope sahibi olması, domain eligibility kararını otomatik olarak sağlamaz.

**Etkilediği Alan:**
Commerce, review/story, reward, creator/supplier, protected surfaces

**Gerekli Aksiyon:**
P06 ve sonrası paketlerde access denied ile eligibility denied ayrı tutulacak.

**Not:**
P05–P06 kapanışlarında sabitlenmiştir.

---

### ARD-016
**Tür:** DECISION
**Başlık:** Protected action initiated ile executed aynı şey değildir
**Durum:** ACTIVE

**Kısa Açıklama:**
Protected action başlatılması, gerçek domain execution veya outcome oluştuğu anlamına gelmez.

**Etkilediği Alan:**
Moderation, support, risk, finance, payout, admin override, supplier/creator management

**Gerekli Aksiyon:**
Yeni operasyon paketlerinde `accepted`, `pending`, `executed`, `failed` ayrımı korunacak.

**Not:**
P07 kapanışında sabitlenmiştir.

---

### ARD-017
**Tür:** DECISION
**Başlık:** BFF protected action gateway’dir, owner execution yapmaz
**Durum:** ACTIVE

**Kısa Açıklama:**
BFF protected action request’i validate edebilir, reason kontrolü yapabilir ve accepted/rejected sonucu dönebilir; ancak gerçek owner execution üstlenmez.

**Etkilediği Alan:**
BFF, panel command flows, operasyon paketleri

**Gerekli Aksiyon:**
BFF’e domain action side-effect veya owner execution logic sızdırılmayacak.

**Not:**
P07 kapanışında sabitlenmiştir.

---

### ARD-018
**Tür:** LIMITATION
**Başlık:** Auth/session çözümü foundation seviyesindedir
**Durum:** MONITORED

**Kısa Açıklama:**
Auth/session omurgası gerçek foundation seviyesinde kurulmuştur; ancak gerçek session persistence, provider entegrasyonu ve daha ileri user identity çözümü henüz dışarıdadır.

**Etkilediği Alan:**
Auth, BFF request context, web/panel shell

**Gerekli Aksiyon:**
İleri auth paketlerinde session persistence ve provider entegrasyonu kontrollü genişletilecek.

**Not:**
P05 kapanışında bilinçli kabul edilmiştir.

---

### ARD-019
**Tür:** LIMITATION
**Başlık:** Access foundation role/scope seviyesindedir
**Durum:** MONITORED

**Kısa Açıklama:**
Role/scope/permission foundation kurulmuştur; ancak ownership, domain command authorization ve ileri policy kararları henüz dışarıdadır.

**Etkilediği Alan:**
Panel, support, moderation, creator/supplier, commerce actions

**Gerekli Aksiyon:**
İleri operasyon ve commerce paketlerinde ownership/business authorization katmanları dikkatle eklenecek.

**Not:**
P06 kapanışında bilinçli kabul edilmiştir.

---

### ARD-020
**Tür:** LIMITATION
**Başlık:** Protected action audit ve event persistence henüz foundation dışındadır
**Durum:** MONITORED

**Kısa Açıklama:**
Protected action paketinde audit-ready metadata shape kurulmuştur; ancak gerçek audit persistence, event emission ve downstream execution zinciri henüz uygulanmamıştır.

**Etkilediği Alan:**
Protected actions, moderation, support, risk, finance/payout

**Gerekli Aksiyon:**
İleri operasyon paketlerinde audit/event/persistence zinciri eklenecek.

**Not:**
P07 kapanışında bilinçli kabul edilmiştir.

### ARD-021

**Tür:** DECISION  
**Başlık:** Paket kapanış kayıt modeli sadeleştirildi  
**Durum:** ACTIVE  

**Kısa Açıklama:**  
Her paket için 63, 64 ve 65 dosyalarının tamamını detaylı güncelleme yöntemi terk edilmiştir. Bundan sonra paket detayları `planlama/PACK_CLOSURES/` altında ayrı closure note dosyalarında tutulacaktır.

**Etkilediği Alan:**  
Yürütme disiplini, paket kapanışı, belge yönetimi

**Gerekli Aksiyon:**  
Her paket kapanışında:
- ilgili closure note oluşturulacak
- `63` sadece aktif durum paneli olarak kısa güncellenecek
- `64` sadece paket index satırı olarak güncellenecek
- `65` yalnız yeni risk, karar veya limitation varsa güncellenecek

**Not:**  
Bu karar tekrar eden dokümantasyon yükünü azaltmak ve çelişkili kayıt riskini düşürmek için alınmıştır.
### ARD-022

**Tür:** LIMITATION  
**Başlık:** P13 Payment Initiation checkout total doğrulamasına bağlı değil  
**Durum:** ACTIVE  

**Kısa Açıklama:**  
P13 — Payment Initiation Foundation kapsamında payment initiation başarıyla kurulmuştur. Ancak payment amount/currency şu an BFF request body üzerinden `InitiatePaymentCommand` içinde gelmektedir. Payment service, checkout service’den doğrulanmış checkout review total bilgisini okumamaktadır.

**Etkilediği Alan:**  
Payment initiation, checkout-payment boundary, P14 Payment → Order geçişi

**Risk:**  
İleri aşamada client/BFF tarafından gönderilen amount veya currency değerine güvenilirse ödeme tutarı ile checkout doğrulanmış toplamı arasında tutarsızlık oluşabilir.

**Gerekli Aksiyon:**  
P14’e geçmeden veya P14 içinde payment initiation, doğrulanmış checkout context ile bağlanmalıdır. Payment service doğrudan cart veya client amount’una güvenmemelidir. Nihai payment amount yalnız checkout’un doğrulanmış `REVIEW_READY / VALID` bağlamından gelmelidir.

**Not:**  
Bu limitation P13 foundation PASS WITH LIMITATION kararını engellemez; ancak P14 acceptance kapısında tekrar kontrol edilecektir.
**Durum:** CLOSED

**Kapanış Notu:**  
P14 kapsamında payment initiation checkout review context’e bağlandı. Payment amount/currency artık client body’den alınmıyor; checkout summary’den türetiliyor. Order creation yalnız payment success + valid checkout context üzerinden yapılacak şekilde düzenlendi.




---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Aşağıdaki kayıtları dosyanın aktif kayıtlar bölümünün sonuna ekleyebilirsin. Kod numaralarını mevcut son ARD numarasına göre artır. Eğer son numara farklıysa `ARD-0XX` değerlerini ona göre değiştir.

```md
---

### ARD-023

**Tür:** LIMITATION  
**Başlık:** Order persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P15 kapsamında order create ve order detail read davranışı `services/order` içindeki in-memory `orderStore` üzerinden sağlanmıştır. Bu, foundation seviyesi için kabul edilmiştir; kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Order service, order detail read, P16 shipment hazırlığı, ilerideki cancel/return/refund zinciri

**Gerekli Aksiyon:**
Kalıcı order persistence, ileride commerce/order persistence veya ilgili data-layer paketinde ele alınmalıdır. P16’ya geçerken shipment create için in-memory limitation açık şekilde dikkate alınmalıdır.

**Not:**
Bu limitation P15 PASS kararını düşürmez; çünkü P15 kapsamı read/detail foundation’dır, kalıcı DB persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Payment contract amount/currency cleanup bekliyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P14 sonrası payment implementation amount/currency bilgisini client body’den değil checkout summary’den okumaktadır. Ancak `InitiatePaymentCommand` contract içinde `amount` ve `currency` opsiyonel alanları hâlâ bulunmaktadır.

**Etkilediği Alan:**
Payment contract, checkout → payment handoff, client/BFF contract netliği

**Gerekli Aksiyon:**
İleride contract cleanup paketi veya payment hardening sırasında `amount` / `currency` alanları kaldırılmalı ya da açıkça deprecated/ignored olarak işaretlenmelidir.

**Not:**
Davranışsal risk şu an kapalıdır; implementation client amount/currency değerini kullanmamaktadır. Bu kayıt contract netliği için izlenmektedir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P15 sonrası shipment/delivery P16’ya bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P15 yalnız Order Read / Order Detail Foundation olarak kapatılmıştır. Shipment create, delivery tracking, carrier integration, cancel/return ve refund bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
Order detail, shipment/delivery foundation, post-order commerce journey

**Gerekli Aksiyon:**
Sıradaki paket `P16 — Shipment / Delivery Foundation` olarak açılmadan önce `17- kargo ve teslimat sistemi.md`, shipment contract/service dosyaları ve order → shipment boundary tekrar doğrulanmalıdır.

**Not:**
P15’te shipment bilgisi uydurulmamış; order detail response içinde shipment state yalnız dürüst şekilde `NOT_AVAILABLE` / `NOT_STARTED` seviyesinde tutulmuştur.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Order service payment dependency public package boundary üzerinden kullanılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P15 source review sırasında `services/order` içinden `services/payment` source dosyasına relative import yapılması boundary ihlali olarak değerlendirilmiştir. Bu düzeltildi ve `getPayment` erişimi `@hx/payment` public package boundary üzerinden sağlandı.

**Etkilediği Alan:**
Order service, payment service, workspace package boundary, owner dependency disiplini

**Gerekli Aksiyon:**
İleride hiçbir service başka bir service’in `src/*` iç dosyasını relative path ile import etmemelidir. Cross-service kullanım public package export üzerinden yapılmalıdır.

**Not:**
P15 kapanış kanıtında `import { getPayment } from '@hx/payment';` doğrulanmıştır.

---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Kod numaralarını dosyadaki son ARD numarasına göre artır. Aşağıda `ARD-0XX` placeholder olarak bırakıldı.

```md
---

### ARD-024

**Tür:** LIMITATION  
**Başlık:** Shipment persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P16 kapsamında shipment create, shipment read/detail ve shipment transition davranışı `services/shipment` içindeki in-memory store üzerinden sağlanmıştır. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Shipment service, delivery tracking foundation, cancel/return hazırlığı, post-delivery eligibility zinciri

**Gerekli Aksiyon:**
Kalıcı shipment persistence ileride data-layer veya shipment hardening paketinde ele alınmalıdır. P17 Cancel / Return Foundation sırasında in-memory limitation açıkça dikkate alınmalıdır.

**Not:**
Bu limitation P16 PASS kararını düşürmez; çünkü P16 kapsamı shipment/delivery foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek carrier integration henüz yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P16 kapsamında shipment state transition foundation kurulmuştur; ancak gerçek kargo firması / carrier entegrasyonu, carrier callback ingestion, provider timeout ve reconciliation davranışı henüz uygulanmamıştır.

**Etkilediği Alan:**
Shipment/delivery lifecycle, delivery proof, carrier tracking, future order tracking surface

**Gerekli Aksiyon:**
Carrier integration, callback idempotency, delivery proof ve reconciliation davranışları ileride shipment hardening veya carrier integration paketinde ele alınmalıdır.

**Not:**
P16’da carrier simulation/foundation kabul edilmiştir. Gerçek carrier entegrasyonu bilinçli olarak kapsam dışıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Delivered eligibility mutation henüz yapılmıyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P16’da `DELIVERED` state’i review/story eligibility için resmi trigger eşiği olarak modellenmiştir. Ancak review eligibility, story eligibility, verified purchase veya reward entitlement mutation yapılmamıştır.

**Etkilediği Alan:**
Delivery sonrası haklar, review/story eligibility, PDP sosyal kanıt katmanı, future reward/verified purchase zinciri

**Gerekli Aksiyon:**
Delivery sonrası eligibility propagation, ilgili content/social/eligibility owner paketlerinde veya post-delivery entitlement paketinde ayrıca ele alınmalıdır.

**Not:**
Bu karar bilinçlidir. P16 shipment foundation paketidir; UGC/review/story hak mutation paketi değildir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Shipment service order dependency public package boundary üzerinden kullanılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P16 kapsamında shipment service, order bilgisini `@hx/order` public package boundary üzerinden okumaktadır. Service iç source path import kullanılmayacaktır.

**Etkilediği Alan:**
Shipment service, order service, workspace dependency disiplini, owner boundary

**Gerekli Aksiyon:**
İleride hiçbir service başka bir service’in `src/*` iç dosyasını relative path ile import etmemelidir. Cross-service kullanım public package export üzerinden yapılmalıdır.

**Not:**
P16 kapanış kanıtında `import { getOrderById } from '@hx/order';` doğrulanmıştır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Shipment state order state’ten ayrı tutulur  
**Durum:** ACTIVE

**Kısa Açıklama:**
P16’da shipment/delivery state machine, order state machine’den ayrı tutulmuştur. Order ticari kayıt truth’unu; shipment ise fiziksel gönderim ve teslimat operasyon truth’unu temsil eder.

**Etkilediği Alan:**
Order detail, shipment/delivery, order tracking, cancel/return, delivery sonrası eligibility

**Gerekli Aksiyon:**
P17 ve sonraki paketlerde order state ile shipment state birbirine merge edilmemelidir. Order tracking gibi yüzeyler projection olarak bu state’leri kullanıcı diline çevirebilir, ancak truth üretmez.

**Not:**
Örnek ayrım: `order = CREATED`, `shipment = IN_TRANSIT` olabilir; bu iki state aynı lifecycle değildir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P16 sonrası Cancel / Return P17’ye bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P16 yalnız Shipment / Delivery Foundation olarak kapatılmıştır. Cancel, return, refund, settlement/payout, notification ve panel operasyonları bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
Post-order commerce journey, cancel/return lifecycle, refund/finance zinciri

**Gerekli Aksiyon:**
Sıradaki paket `P17 — Cancel / Return Foundation` olarak açılmadan önce cancel/return sistem dosyaları, shipment/delivery state etkisi, order state etkisi ve refund boundary ayrıca doğrulanmalıdır.

**Not:**
P16’da shipment/delivery foundation kuruldu; iade ve refund P17/P18 ayrımıyla ele alınmalıdır.

---

---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Kod numaralarını dosyadaki son ARD numarasına göre artır. `ARD-0XX` placeholder’dır.

```md
---

### ARD-025

**Tür:** LIMITATION  
**Başlık:** Cancel-return persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P17 kapsamında cancel ve return request kayıtları `services/cancel-return` içindeki in-memory / `globalThis` singleton store üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Cancel-return lifecycle, request detail/read, P18 refund foundation, ileride support/operations/panel akışları

**Gerekli Aksiyon:**
Kalıcı cancel-return persistence ileride data-layer, order operations veya cancel-return hardening paketinde ele alınmalıdır.

**Not:**
Bu limitation P17 PASS kararını düşürmez; çünkü P17 kapsamı cancel/return foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Refund execution P18’e bırakıldı  
**Durum:** MONITORED

**Kısa Açıklama:**
P17 kapsamında cancel ve return request’leri refund ihtiyacını `refundImpactSummary` ile modellemiştir. Gerçek refund execution, payment provider refund, finance adjustment, settlement/payout etkisi uygulanmamıştır.

**Etkilediği Alan:**
Cancel-return, payment, finance, settlement, payout, user refund visibility

**Gerekli Aksiyon:**
P18 — Refund Foundation kapsamında refund execution owner boundary, payment/finance ilişkisi, idempotency, unknown-result ve reconciliation davranışları ayrıca tasarlanmalıdır.

**Not:**
P17’de `actualRefundExecutionPerformed: false` kuralı korunmuştur. Return approved veya cancel approved, refund completed anlamına gelmez.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Post-delivery entitlement mutation henüz yapılmıyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P17’de return/cancel etkileri review, story ve verified purchase alanları için yalnız pending impact summary olarak modellenmiştir. Gerçek review/story/verified purchase mutation yapılmamıştır.

**Etkilediği Alan:**
PDP sosyal kanıt katmanı, review eligibility, story eligibility, verified purchase, rating impact

**Gerekli Aksiyon:**
İleride post-delivery entitlement, review/story governance veya UGC hardening paketinde gerçek mutation ve görünürlük etkisi ayrıca ele alınmalıdır.

**Not:**
İade sonrası yorum otomatik silinmez; puan ve verified purchase etkisinin ayrıca yönetilmesi gerekir. P17 bu etkiyi sadece modellemiştir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Cancel ve return type bazlı ayrı lifecycle olarak yönetilecek  
**Durum:** ACTIVE

**Kısa Açıklama:**
P17 kapsamında cancel ve return request’leri ayrı request type ve state lifecycle olarak modellenmiştir. Cancel teslimat öncesi, return teslimat sonrası eksendir.

**Etkilediği Alan:**
Cancel-return service, shipment/delivery state, refund foundation, order detail, user post-order actions

**Gerekli Aksiyon:**
P18 ve sonraki paketlerde cancel ve return aynı lifecycle’a indirgenmemelidir. Refund, bu kararların finansal sonucu olabilir; ancak cancel/return state machine ile aynı şey değildir.

**Not:**
Delivered olmayan satır için return create yasaktır. Delivered satır için cancel create yasaktır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Aktif cancel varken return request açılmayacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P17 source review fix sonrası aynı order line üzerinde aktif cancel request varken return request açılması engellenmiştir. Bu durum `RETURN_NOT_ALLOWED_DUE_TO_ACTIVE_CANCEL` benzeri deterministik hata ile yönetilir.

**Etkilediği Alan:**
Cancel-return lifecycle, duplicate-safe behavior, user post-order actions, refund sequencing

**Gerekli Aksiyon:**
İleride daha gelişmiş policy gerekiyorsa aktif cancel’ın hangi state’lerde return’e dönüşebileceği ayrıca tasarlanmalıdır. İlk foundation’da aktif cancel kapanmadan return açılmaz.

**Not:**
Cancel `REJECTED` veya `CLOSED` hale geldikten sonra delivered line için return request oluşturulabilir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Cancel-return service order ve shipment dependency public package boundary üzerinden kullanılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P17 kapsamında cancel-return service, order ve shipment/delivery verilerini yalnız public package boundary üzerinden okur.

**Etkilediği Alan:**
Cancel-return service, order service, shipment service, workspace dependency disiplini, owner boundary

**Gerekli Aksiyon:**
İleride hiçbir service başka bir service’in `src/*` iç dosyasını relative path ile import etmemelidir. Cross-service kullanım public package export üzerinden yapılmalıdır.

**Not:**
P17’de `@hx/order` ve `@hx/shipment` import sınırı korunmuştur.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P17 sonrası Refund Foundation P18’e bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P17 yalnız Cancel / Return Foundation olarak kapatılmıştır. Refund execution, payment provider refund, finance correction, settlement/payout etkisi ve reconciliation davranışları bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
Payment, finance, settlement, payout, cancel-return, user refund visibility

**Gerekli Aksiyon:**
Sıradaki paket `P18 — Refund Foundation` olarak açılmadan önce ödeme sistemi, finansal mutabakat/hakediş sistemi, payout sistemi, refund acceptance ve payment/finance owner boundary tekrar doğrulanmalıdır.

**Not:**
Return approved ≠ refund completed. Refund completed ≠ settlement/payout completed.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** P17 temporary verification script kaldırıldı  
**Durum:** CLOSED

**Kısa Açıklama:**
P17 sırasında root dizinde oluşturulan `p17-verification.js` dosyasının geçici manuel doğrulama scripti olduğu tespit edilmiştir. Kalıcı package script, README veya test runner referansı bulunmadığı için repo kökünden silinmiştir.

**Etkilediği Alan:**
Repo hygiene, acceptance verification, test organization

**Gerekli Aksiyon:**
Gelecekte kalıcı acceptance testleri root dizine değil `tests/acceptance` veya ilgili test standardına uygun konuma eklenmelidir.

**Not:**
Silme sonrası `pnpm run typecheck` ve `pnpm run build` PASS kalmıştır.

---

---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Kod numaralarını dosyadaki son ARD numarasına göre artır. `ARD-0XX` placeholder’dır.

```md
---

### ARD-026

**Tür:** LIMITATION  
**Başlık:** Refund persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P18 kapsamında refund kayıtları `services/refund` içindeki in-memory / `globalThis` singleton store üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Refund lifecycle, refund detail/read, reconciliation, future finance/payout/notification entegrasyonları

**Gerekli Aksiyon:**
Kalıcı refund persistence ileride data-layer, finance hardening veya refund reconciliation paketinde ele alınmalıdır.

**Not:**
Bu limitation P18 PASS kararını düşürmez; çünkü P18 kapsamı Refund Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek provider refund entegrasyonu yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P18 kapsamında provider/banka/POS refund gerçek icrası yapılmamıştır. `services/payment` içinde yalnız simulation-only `simulateProviderRefund` helper’ı eklenmiştir.

**Etkilediği Alan:**
Payment, refund execution, reconciliation, user refund visibility, finance operations

**Gerekli Aksiyon:**
Gerçek provider refund entegrasyonu, callback handling, unknown-result reconciliation ve retry/review akışları ileri refund hardening paketinde ele alınmalıdır.

**Not:**
P18’de `actualProviderRefundPerformed: false` kuralı korunmuştur.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Refund source payment reference eksikliği reconciliation gerektiriyor  
**Durum:** MONITORED

**Kısa Açıklama:**
Cancel-return response mevcut haliyle refund için doğrudan payment reference taşımamaktadır. Bu nedenle bazı refund process denemelerinde uydurma payment reference üretilmemiş, refund `RECONCILIATION_REQUIRED` state’e alınmıştır.

**Etkilediği Alan:**
Refund processing, payment linkage, order/payment/cancel-return traceability, reconciliation

**Gerekli Aksiyon:**
İleride order/payment reference propagation veya refund source enrichment tasarlanmalıdır. Cancel-return → order → payment bağlantısı owner boundary bozulmadan okunabilir hale getirilmelidir.

**Not:**
Bu limitation P18 PASS kararını düşürmez; aksine uydurma payment reference üretilmediği için boundary doğru korunmuştur.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Refund amount source henüz yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P18’de refund line amount değerleri için kesin finansal source henüz mevcut değildir. Sistem uydurma amount üretmemiş, `REFUND_AMOUNT_SOURCE_NOT_AVAILABLE` warning’iyle dürüst modelleme yapmıştır.

**Etkilediği Alan:**
Refund amount calculation, partial refund, finance/settlement, user refund visibility

**Gerekli Aksiyon:**
Refund amount source ileride order line financial snapshot, payment capture amount, settlement line veya finance ledger üzerinden netleştirilmelidir.

**Not:**
P18 foundation lifecycle’ı kurmuştur; kesin refund amount calculation ileri finance/refund hardening kapsamındadır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Refund ayrı lifecycle olarak yönetilecek, payment state içine eritilmeyecek  
**Durum:** ACTIVE

**Kısa Açıklama:**
P18 kapsamında refund ayrı contract, service ve state machine olarak kurulmuştur. Payment state doğrudan `REFUNDED` yapılmamıştır.

**Etkilediği Alan:**
Payment service, refund service, cancel-return, finance, settlement, payout

**Gerekli Aksiyon:**
İleride refund execution genişletilirken payment state ile refund state birbirine merge edilmemelidir. Payment finansal işlem referansını taşır; refund ters finansal lifecycle’dır.

**Not:**
Cancel approved veya return approved, refund completed anlamına gelmez. Refund completed da settlement/payout completed anlamına gelmez.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Refund duplicate guard iki katmanlı uygulanacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P18’de refund create için hem `cancelReturnRequestId` bazlı hem de `idempotencyKey` bazlı duplicate guard uygulanmıştır.

**Etkilediği Alan:**
Refund service, idempotency, retry behavior, BFF refund endpoints

**Gerekli Aksiyon:**
İleri refund hardening paketlerinde bu idempotency davranışı kalıcı persistence veya Redis/DB unique constraint ile desteklenmelidir.

**Not:**
Aynı cancel-return request için ikinci refund oluşturulmaz; aynı idempotency key ile tekrar eden istek mevcut refund’u döndürür.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Settlement ve payout mutation P18 kapsamında yapılmayacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P18’de refund sonrası settlement ve payout etkileri yalnız impact summary olarak modellenmiştir. Gerçek settlement adjustment, payout reversal veya finance ledger mutation yapılmamıştır.

**Etkilediği Alan:**
Finance, settlement, payout, refund, reporting, reconciliation

**Gerekli Aksiyon:**
Settlement/payout etkileri ileride finansal mutabakat veya payout hardening paketlerinde ele alınmalıdır.

**Not:**
Refund completed ≠ settlement adjusted. Refund completed ≠ payout reversed.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P18 sonrası Notification Foundation P19’a bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P18 yalnız Refund Foundation olarak kapatılmıştır. Notification/event publish, user notification center, provider callback notification ve operational alerts bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
Refund visibility, cancel-return updates, order/shipment/payment user communication, support escalation

**Gerekli Aksiyon:**
Sıradaki paket `P19 — Notification Foundation` olarak açılmadan önce bildirim sistemi, event taxonomy, notification service mevcut durumu ve BFF/web notification yüzeyi doğrulanmalıdır.

**Not:**
P18’de notification/event publish bilinçli olarak kapsam dışı bırakılmıştır.

* """""""""""""""""""""""""""""""""""""""""""""""""""""""
------

### ARD-027

**Tür:** LIMITATION  
**Başlık:** Notification persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P19 kapsamında notification kayıtları `services/notification` içindeki in-memory / `globalThis` singleton store üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Notification center, unread count, notification history, future provider delivery, support/order/refund visibility

**Gerekli Aksiyon:**
Kalıcı notification persistence ileride notification hardening, notification center veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P19 PASS kararını düşürmez; çünkü P19 kapsamı Notification Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek push/email/sms provider entegrasyonu yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P19 kapsamında PUSH, EMAIL ve SMS gerçek provider delivery yapılmamıştır. Bu kanallar enum/model seviyesinde tanımlanmış, ancak provider delivery yokluğu `PROVIDER_DELIVERY_NOT_CONFIGURED` warning’iyle dürüst şekilde modellenmiştir.

**Etkilediği Alan:**
User notification delivery, critical alerts, marketing/social notification channels, supplier operation alerts

**Gerekli Aksiyon:**
Gerçek push/email/sms provider entegrasyonu ileride notification provider hardening paketinde ele alınmalıdır. Provider callback, delivery status ve retry/reconciliation ayrıca tasarlanmalıdır.

**Not:**
P19 yalnız in-app notification foundation paketidir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Notification preference service henüz yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P19’da notification preference service kurulmamıştır. Mandatory/critical bildirimlerin kapatılamaz olduğu, social/digest bildirimlerin ise preference-overridable olabileceği metadata seviyesinde modellenmiştir.

**Etkilediği Alan:**
Notification settings, user/creator/supplier preferences, marketing/social notification control

**Gerekli Aksiyon:**
Notification preference service ileride ayrı foundation veya hardening paketinde kurulmalıdır. Mandatory/critical kanal tercihi ile social/marketing opt-in/opt-out ayrımı netleştirilmelidir.

**Not:**
P19’da preference truth üretilmemiştir; sadece notification record metadata’sı taşınmıştır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Event bus ve audit storage notification foundation dışında bırakıldı  
**Durum:** MONITORED

**Kısa Açıklama:**
P19 kapsamında notification create/list/read/archive foundation kurulmuştur; ancak event bus publish/consume ve audit storage yapılmamıştır.

**Etkilediği Alan:**
Domain event driven notification, audit trail, support/order/refund event propagation, observability

**Gerekli Aksiyon:**
Event-driven notification ingestion ve audit entegrasyonu ileride event/audit hardening paketlerinde ele alınmalıdır. Event truth owner değildir, audit event değildir ayrımı korunmalıdır.

**Not:**
P19’da notification, event veya audit katmanının yerine geçirilmemiştir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Realtime notification delivery yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P19 kapsamında WebSocket, SSE veya realtime push delivery kurulmamıştır. Notification records yalnız service/BFF üzerinden create/read/list seviyesinde yönetilmektedir.

**Etkilediği Alan:**
Header notification badge, mobile header, notification center refresh, critical alert latency

**Gerekli Aksiyon:**
Realtime delivery veya polling stratejisi ileride notification center / realtime hardening paketinde ele alınmalıdır.

**Not:**
P19 in-app record foundation’dır; realtime channel foundation değildir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Notification truth owner notification service olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P19 kapsamında notification create, list, unread count, mark-read ve archive davranışlarının owner’ı `services/notification` olarak belirlenmiştir.

**Etkilediği Alan:**
Notification service, BFF notification endpoints, web notification center, future provider delivery

**Gerekli Aksiyon:**
BFF veya UI notification truth üretmemelidir. Domain servisleri doğrudan UI notification state yazmamalıdır. Notification state mutation yalnız notification owner service üzerinden yapılmalıdır.

**Not:**
P19’da `unreadCount` service owner içinde hesaplanmıştır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Mandatory ve critical bildirimler preference ile kapatılamaz  
**Durum:** ACTIVE

**Kısa Açıklama:**
P19 kapsamında `MANDATORY` ve `CRITICAL` priority bildirimler `isMandatory: true` ve `preferenceOverridable: false` olarak modellenmiştir.

**Etkilediği Alan:**
Payment/order/shipment/refund/support/security notifications, notification settings, compliance-critical communication

**Gerekli Aksiyon:**
İleride preference service kurulurken mandatory/critical bildirimler tamamen kapatılamaz tutulmalıdır. Sadece kanal tercihi sınırlı yönetilebilir olabilir.

**Not:**
Social, digest ve marketing bildirimleri daha esnek preference davranışına sahip olabilir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Social/digest bildirimler gürültü kontrolüyle ayrı taşınacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P19 kapsamında sosyal ve düşük öncelikli bildirimler işlem/operasyon bildirimleriyle aynı öncelikte ele alınmamıştır. `SOCIAL` ve `DIGEST` bildirimler gürültü kontrolü için digest/aggregated delivery mode ile modellenmiştir.

**Etkilediği Alan:**
Creator notifications, customer social notifications, notification center grouping, future digest engine

**Gerekli Aksiyon:**
İleride sosyal bildirimler tekil push yağmuruna dönüştürülmemelidir. Digest/grouping/panel counter yaklaşımı korunmalıdır.

**Not:**
İşlem ve operasyon bildirimleri sosyal bildirimlerden daha yüksek önceliklidir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P19 sonrası Support / Ticket Foundation P20’ye bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P19 yalnız Notification Foundation olarak kapatılmıştır. Support/ticket lifecycle, resmi destek süreçleri, sosyal mesaj ile destek ayrımı, ticket assignment ve SLA yönetimi bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
Support center, order/refund/shipment issue handling, customer communication, notification-support boundary

**Gerekli Aksiyon:**
Sıradaki paket `P20 — Support / Ticket Foundation` olarak açılmadan önce destek sistemi, ticket state machine, support ownership ve notification-support boundary doğrulanmalıdır.

**Not:**
Bildirim sistemi destek sürecini taşıyabilir; ama destek sistemi değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** P18/P19 temporary verification scriptleri kaldırıldı  
**Durum:** CLOSED

**Kısa Açıklama:**
P18 ve P19 sırasında root dizinde oluşturulan `p18-verification.js`, `p19-verification.ts` ve `p19-verification.js` dosyalarının geçici manuel doğrulama scriptleri olduğu tespit edilmiştir. Kalıcı package script, README/docs veya CI/CD referansı bulunmadığı için repo kökünden silinmiştir.

**Etkilediği Alan:**
Repo hygiene, acceptance verification, test organization

**Gerekli Aksiyon:**
Gelecekte kalıcı acceptance testleri root dizine değil `tests/acceptance` veya ilgili test standardına uygun konuma eklenmelidir.

**Not:**
Silme sonrası `pnpm run typecheck` ve `pnpm run build` PASS kalmıştır.

---
------     *************************************
#####
### ARD-028

**Tür:** LIMITATION  
**Başlık:** Support ticket persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P20 kapsamında support ticket kayıtları `services/support` içindeki in-memory / `globalThis` singleton store üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Support ticket lifecycle, ticket history, support operations, future admin support panel, SLA, audit

**Gerekli Aksiyon:**
Kalıcı support ticket persistence ileride support hardening, support center veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P20 PASS kararını düşürmez; çünkü P20 kapsamı Support / Ticket Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek live chat ve agent assignment yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P20 kapsamında gerçek canlı chat, agent assignment, queue management veya support admin panel UI kurulmamıştır. Sistem yalnız resmi ticket lifecycle foundation seviyesinde kurulmuştur.

**Etkilediği Alan:**
Support operations, customer communication, support admin workflow, escalation management

**Gerekli Aksiyon:**
Live chat, agent assignment ve support operations UI ileride support operations hardening paketinde ele alınmalıdır.

**Not:**
Destek sisteminin ilk katmanı serbest chat değildir; resmi ticket omurgası önceliklidir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** SLA, audit ve event bus support foundation dışında bırakıldı  
**Durum:** MONITORED

**Kısa Açıklama:**
P20’de support ticket lifecycle kurulmuştur; ancak SLA engine, audit storage ve event bus publish/consume yapılmamıştır.

**Etkilediği Alan:**
Support SLA tracking, official support audit trail, operational reporting, event-driven notifications

**Gerekli Aksiyon:**
SLA, audit ve event-driven support lifecycle ileride support hardening veya event/audit paketlerinde ele alınmalıdır.

**Not:**
P20’de support truth event veya audit katmanına taşınmamıştır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Support attachment upload yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P20 kapsamında kullanıcıların ticket içine dosya, görsel, dekont veya hasar kanıtı yüklemesi desteklenmemiştir.

**Etkilediği Alan:**
Payment dispute, delivery damage, defective product claims, support evidence handling

**Gerekli Aksiyon:**
Attachment upload ve evidence handling ileride support evidence hardening paketinde ele alınmalıdır.

**Not:**
Ödeme belirsizliği ve hasarlı teslimat gibi kritik destek konuları ileride attachment gerektirebilir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Support sistemi sosyal mesajlaşma değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
P20 kapsamında support ticket record’ları `socialMessageBoundary: true` ve `officialSupportProcess: true` ile resmi destek süreci olarak modellenmiştir. Fenomen/creator mesaj kutusu resmi support kanalının yerine geçmez.

**Etkilediği Alan:**
Support, creator messaging, order issues, cancel-return, refund, shipment, customer communication

**Gerekli Aksiyon:**
İleride creator/fenomen mesajlaşması geliştirilirken sipariş, ödeme, iade, iptal, teslimat ve şikayet konuları resmi support/ticket hattına yönlendirilmelidir.

**Not:**
Fenomen mağaza sosyal/ilişkisel iletişim kurabilir; resmi support otoritesi platformdadır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Support ticket truth owner support service olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P20 kapsamında support create, list, read, message, open count ve status transition davranışlarının owner’ı `services/support` olarak belirlenmiştir.

**Etkilediği Alan:**
Support service, BFF support endpoints, web support center, future support admin panel

**Gerekli Aksiyon:**
BFF veya UI support truth üretmemelidir. Ticket state mutation yalnız support owner service üzerinden yapılmalıdır.

**Not:**
P20’de `openCount`, priority ve escalation target service owner içinde hesaplanmıştır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Moderation support değildir; support yalnız escalation metadata taşıyabilir  
**Durum:** ACTIVE

**Kısa Açıklama:**
P20 kapsamında store/safety/content complaints support ticket olarak açılabilir ve `MODERATION` escalation target ile taşınabilir. Ancak moderation decision execution P20 kapsamında yapılmamıştır.

**Etkilediği Alan:**
Support, moderation, safety complaints, inappropriate content reports, store complaints

**Gerekli Aksiyon:**
İleride moderation foundation/hardening paketlerinde support ticket kaynaklı moderation intake ayrıca ele alınmalıdır. Support ticket, moderation kararının kendisi değildir.

**Not:**
Şikayet support’tan gelebilir; görünürlük kısıtı/kaldırma kararı moderation owner alanıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Support priority ve escalation target service içinde hesaplanacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P20’de ticket priority ve escalation target BFF/UI tarafından değil, support owner service tarafından belirlenmiştir.

**Etkilediği Alan:**
Support routing, finance escalation, operations escalation, moderation escalation, technical support

**Gerekli Aksiyon:**
İleride routing/SLA genişletilirken bu hesaplama support owner veya ilgili routing owner içinde kalmalıdır. UI priority veya escalation truth üretmemelidir.

**Not:**
Payment critical → finance; shipment/order/cancel-return → operations; technical → technical; safety/store complaint → moderation/safety ekseni korunmalıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P20 sonrası Post / UGC Foundation P21’e bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P20 yalnız Support / Ticket Foundation olarak kapatılmıştır. Post, UGC, kullanıcı ürün story, creator post, moderation queue ve içerik yayın lifecycle bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
UGC, post, user product story, moderation, PDP social/content layers, creator/store content

**Gerekli Aksiyon:**
Sıradaki paket `P21 — Post / UGC Foundation` olarak açılmadan önce UGC/post sistemi, moderasyon sistemi, PDP content/social boundary ve entitlement kuralları doğrulanmalıdır.

**Not:**
Support sistemi içerik yayını veya moderasyon karar motoru değildir.

---


---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Kod numaralarını dosyadaki son ARD numarasına göre artır. `ARD-0XX` placeholder’dır.

```md
---

### ARD-029

**Tür:** LIMITATION  
**Başlık:** Post / UGC content persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P21 kapsamında post ve UGC kayıtları `services/media` içindeki in-memory / `globalThis` singleton store üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Post lifecycle, UGC lifecycle, PDP user story layer, follow feed, store profile content history, moderation queue

**Gerekli Aksiyon:**
Kalıcı content persistence ileride media/content hardening veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P21 PASS kararını düşürmez; çünkü P21 kapsamı Post / UGC Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek media upload/storage ve video processing yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P21 kapsamında gerçek medya yükleme, storage, CDN, video processing veya transcoding yapılmamıştır. Media reference’lar simulation metadata seviyesinde tutulmuştur.

**Etkilediği Alan:**
Store posts, user product story UGC, PDP user story layer, store profile media surfaces, future content moderation

**Gerekli Aksiyon:**
Gerçek media upload/storage, CDN, thumbnail generation ve video processing ileride media infrastructure paketinde ele alınmalıdır.

**Not:**
P21 content lifecycle foundation’dır; medya altyapısı foundation değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Moderation decision engine P21 kapsamı dışında  
**Durum:** MONITORED

**Kısa Açıklama:**
P21’de moderation status ve metadata foundation kurulmuştur; ancak gerçek moderation decision engine, admin moderation panel veya automated policy enforcement yapılmamıştır.

**Etkilediği Alan:**
Post review, UGC review, rejected/hidden content, safety complaints, policy enforcement

**Gerekli Aksiyon:**
Full moderation decision engine ileride moderation foundation/hardening paketinde ele alınmalıdır.

**Not:**
P21 content moderation kararını üretmez; yalnız moderation status ve metadata taşır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Follow relationship verification yapılmıyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P21’de follower actor context ile post listelenebilir; ancak gerçek takip ilişkisi verification yapılmamıştır. Bu durum warning/limitation olarak modellenmiştir.

**Etkilediği Alan:**
Follow feed, followers-only post visibility, creator/store post access

**Gerekli Aksiyon:**
Follow relationship verification ileride follow/feed hardening paketinde veya follow service integration içinde ele alınmalıdır.

**Not:**
P21’de followers-only post visibility modeli kurulmuştur; gerçek access verification henüz yoktur.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** UGC order/shipment eligibility verification yapılmıyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P21’de user product story için product tag zorunludur; ancak gerçek order/shipment delivery verification yapılmamıştır. Eksik bağlamda fake delivered state üretilmemiş, `REQUIRES_CHECK` ve warning ile dürüst modellenmiştir.

**Etkilediği Alan:**
User product story eligibility, PDP user story layer, verified purchase trust metadata, post-delivery entitlement

**Gerekli Aksiyon:**
Order/shipment based UGC eligibility ileride entitlement, order-detail veya media hardening paketinde owner boundary korunarak ele alınmalıdır.

**Not:**
Misafir kullanıcı sosyal/hak bağlı katkı yapamaz; P21’de eligibility doğrulaması gerçek data layer’a bağlanmamıştır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Interaction truth P21 kapsamında üretilmedi  
**Durum:** MONITORED

**Kısa Açıklama:**
P21 modelleri post ve UGC yüzeylerinde beğen/kaydet/paylaş aksiyonlarını taşıyabilecek içerik yüzeyleri oluşturmuştur; ancak like/save/share truth owner logic kurulmamıştır.

**Etkilediği Alan:**
Post interactions, UGC interactions, PDP social proof, follow feed signals, saved/liked pages

**Gerekli Aksiyon:**
Interaction truth owner ileride Interaction Foundation paketinde ele alınmalıdır. BFF/UI interaction truth üretmemelidir.

**Not:**
Beğen/kaydet/paylaş ortak omurga olarak ileride ayrı owner altında kurulmalıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Media service Post / UGC content truth owner olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P21 kapsamında store post ve user product story UGC lifecycle’larının owner’ı `services/media` olarak belirlenmiştir.

**Etkilediği Alan:**
Store posts, UGC, PDP user story layer, follow feed, store profile content, future moderation queue

**Gerekli Aksiyon:**
BFF veya UI content truth üretmemelidir. Post ve UGC state mutation yalnız media/content owner üzerinden yapılmalıdır.

**Not:**
BFF, media service’i `@hx/media` public package boundary üzerinden kullanmalıdır; service iç dosyalarına relative import yasaktır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Store post story/support/Q&A/comment thread değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
P21’de store post modeli şu ayrımlarla kurulmuştur: `socialThreadEnabled: false`, `supportProcess: false`, `qnaProcess: false`, `storyProcess: false`, `officialStoreCommunication: true`.

**Etkilediği Alan:**
Follow feed, store profile, creator/store communication, support, Q&A, story system

**Gerekli Aksiyon:**
İleride post sistemine yorum/thread, resmi support veya Q&A davranışı eklenmemelidir. Bu ihtiyaçlar kendi owner sistemlerinde yönetilmelidir.

**Not:**
Post, takipçiye dönük kısa ve hafif sosyal mağaza iletişimidir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** User product UGC creator post değildir ve return sonrası otomatik silinmez  
**Durum:** ACTIVE

**Kısa Açıklama:**
P21’de user product story UGC modeli `creatorPost: false` ve `autoDeleteOnReturn: false` olarak kurulmuştur. UGC kullanıcı ürün deneyimi/sosyal kanıt katkısıdır; fenomen mağaza postu değildir.

**Etkilediği Alan:**
PDP user story layer, user profile story contribution, verified purchase trust, return trust impact, moderation

**Gerekli Aksiyon:**
İade sonrası UGC otomatik silinmemeli; trust/visibility metadata ve moderation kararlarıyla yönetilmelidir.

**Not:**
İade, kullanıcı story’sini otomatik yok eden mekanizma değildir; ancak güven ve görünürlük durumunu etkileyebilir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** BFF media service’e public package boundary üzerinden erişecek  
**Durum:** ACTIVE

**Kısa Açıklama:**
P21 source review sırasında BFF’nin `services/media/src/media` dosyasını relative path ile import ettiği tespit edilmiş ve boundary ihlali olarak düzeltilmiştir. BFF artık `@hx/media` public package boundary kullanır.

**Etkilediği Alan:**
BFF post endpoints, BFF UGC endpoints, media service ownership, workspace boundary discipline

**Gerekli Aksiyon:**
Gelecekte BFF veya başka servisler media service iç dosyalarını relative path ile import etmemelidir. Public package boundary korunmalıdır.

**Not:**
Bu fix sonrası P21 PASS kabul edilmiştir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P21 sonrası Review / Rating Foundation P22’ye bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P21 yalnız Post / UGC Foundation olarak kapatılmıştır. Ürün yorumu, yıldız puanı, review eligibility, rating aggregation ve iade sonrası puan etkisi bu pakete dahil edilmemiştir.

**Etkilediği Alan:**
PDP review layer, product rating, verified purchase trust, return impact, UGC trust metadata

**Gerekli Aksiyon:**
Sıradaki paket `P22 — Review / Rating Foundation` olarak açılmadan önce PDP yorum/puan sistemi, kullanıcı-müşteri sistemi, iptal/iade etkisi ve post-delivery entitlement kuralları doğrulanmalıdır.

**Not:**
UGC story ile review/rating aynı şey değildir; ayrı owner/lifecycle olarak ele alınmalıdır.

---

---

# `65-ACTIVE_RISKS_AND_DECISIONS.md` içine eklenecek kayıtlar

Kod numaralarını dosyadaki son ARD numarasına göre artır. `ARD-0XX` placeholder’dır.

```md
---

### ARD-029

**Tür:** LIMITATION  
**Başlık:** Review/rating persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P22 kapsamında review/rating kayıtları `services/media` içindeki in-memory / `globalThis.__reviewStore` üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
PDP review layer, product rating summary, review history, moderation queue, rating analytics

**Gerekli Aksiyon:**
Kalıcı review/rating persistence ileride media/content hardening veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P22 PASS kararını düşürmez; çünkü P22 kapsamı Review / Rating Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek order/shipment eligibility verification yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P22’de review eligibility snapshot üzerinden modellenmiştir; gerçek order/shipment teslimat doğrulaması yapılmamıştır. Eksik bağlamda fake delivered state üretilmemiş, `REQUIRES_CHECK` ve warning ile dürüst modellenmiştir.

**Etkilediği Alan:**
Review eligibility, verified purchase trust, product rating integrity, PDP review layer

**Gerekli Aksiyon:**
Order/shipment based review eligibility ileride entitlement, order-detail veya media hardening paketinde owner boundary korunarak ele alınmalıdır.

**Not:**
Yorum hakkı sipariş bazında değil, teslim edilen ürün satırı bazında açılmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Review return impact gerçek event entegrasyonuna bağlı değil  
**Durum:** MONITORED

**Kısa Açıklama:**
P22’de return impact manuel command ile modellenmiştir. Gerçek cancel-return/refund/return event consume veya otomatik review trust update entegrasyonu yapılmamıştır.

**Etkilediği Alan:**
İade sonrası rating impact, verified purchase etiketi, review trust metadata, PDP product rating

**Gerekli Aksiyon:**
İade sonrası review/rating etkisi ileride cancel-return/refund event integration veya entitlement impact paketinde ele alınmalıdır.

**Not:**
P22’de yorum silinmemiş; rating impact ve verified purchase etkisi kaldırılmıştır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Rating projection/cache yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P22’de product rating summary anlık in-memory review store üzerinden hesaplanmaktadır. Kalıcı projection, cache, materialized summary veya DB aggregation yoktur.

**Etkilediği Alan:**
PDP performance, product cards, listing surfaces, search/ranking signals, analytics

**Gerekli Aksiyon:**
Kalıcı rating projection veya cache ileride PDP/performance/data-layer hardening paketinde ele alınmalıdır.

**Not:**
Rating summary BFF/UI tarafından değil media owner service tarafından hesaplanmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Review moderation engine ve admin panel yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P22’de review moderation status ve transition foundation kurulmuştur; ancak full moderation engine, automatic policy checks veya admin review moderation panel kurulmamıştır.

**Etkilediği Alan:**
Review approval, hidden/rejected review management, abuse/spam control, moderation operations

**Gerekli Aksiyon:**
Review moderation decision engine ve admin panel ileride moderation hardening paketinde ele alınmalıdır.

**Not:**
P22 yalnız review lifecycle ve rating foundation paketidir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Görselli/videolu review ve reply thread yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P22’de review text tabanlıdır. Görselli/videolu review, review reply, comment thread veya helpful interaction truth oluşturulmamıştır.

**Etkilediği Alan:**
PDP review UX, review helpfulness, rich review content, seller/platform replies

**Gerekli Aksiyon:**
Rich review media ve helpful/reply interaction ihtiyaçları ileride ayrı paketlerde ele alınmalıdır.

**Not:**
Mevcut kanonik karar gereği ilk fazda yorumlar metin tabanlıdır ve yorumlara cevap verilmez.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek auth-to-actor mapping P22 kapsamı dışında  
**Durum:** MONITORED

**Kısa Açıklama:**
P22 source review fix sonrası BFF actor önceliği `body.actorId || context?.actorId` olarak düzenlenmiştir. Gerçek auth-to-actor mapping ve access-context enforcement P22 kapsamında yapılmamıştır.

**Etkilediği Alan:**
Review create/update/return-impact security, guest review prevention, actor ownership validation

**Gerekli Aksiyon:**
Gerçek auth-to-actor mapping ve access-context enforcement ileride auth/access hardening paketinde ele alınmalıdır.

**Not:**
BFF actor truth üretmemelidir; review owner media service’tir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Review/rating truth owner media service olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P22 kapsamında review create, update, list, transition, return impact ve product rating summary davranışlarının owner’ı `services/media` olarak belirlenmiştir.

**Etkilediği Alan:**
PDP review layer, product rating, review moderation, return impact, rating summary

**Gerekli Aksiyon:**
BFF veya UI review/rating truth üretmemelidir. Rating aggregation yalnız media owner service içinde hesaplanmalıdır.

**Not:**
BFF `@hx/media` public package boundary üzerinden çalışmalıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Review UGC/story/post/Q&A/support değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
P22’de review record şu ayrımları açıkça taşır: `ugcStory: false`, `storePost: false`, `supportProcess: false`, `qnaProcess: false`, `replyThreadEnabled: false`.

**Etkilediği Alan:**
PDP review layer, UGC/story layer, store post layer, Q&A layer, support system

**Gerekli Aksiyon:**
Review sistemi ileride UGC story, store post, Q&A veya support süreçleriyle karıştırılmamalıdır. Her biri kendi owner/lifecycle alanında kalmalıdır.

**Not:**
Review ürün güven ve rating katmanıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Rating yalnız approved/visible/active impact yorumlardan hesaplanacak  
**Durum:** ACTIVE

**Kısa Açıklama:**
P22’de product rating summary yalnız `APPROVED`, `VISIBLE` ve `ratingImpactActive: true` olan yorumlardan hesaplanacak şekilde kurulmuştur.

**Etkilediği Alan:**
PDP product rating, product cards, search/ranking signals, product trust layer

**Gerekli Aksiyon:**
Rejected, hidden, withdrawn, archived veya return impact sonrası rating impact’i kaldırılmış yorumlar rating summary’ye dahil edilmemelidir.

**Not:**
Review görünür kalabilir; rating etkisi ayrı yönetilir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** İade sonrası review silinmez, rating/verified etkisi kaldırılır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P22’de iade etkisi uygulandığında yorum kaydı otomatik silinmez; ancak `ratingImpactActive: false`, `verifiedPurchaseLabelVisible: false` ve `returnedProductTrustImpact: true` yapılır.

**Etkilediği Alan:**
Return impact, PDP review layer, product rating, verified purchase trust metadata

**Gerekli Aksiyon:**
İade sonrası yorumun içerik değeri korunabilir; ancak ürün puanı ve verified purchase güven sinyali dürüst şekilde güncellenmelidir.

**Not:**
Bu karar iptal/iade sistemiyle uyumludur.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P22 sonrası Q&A Foundation P23’e bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P22 yalnız Review / Rating Foundation olarak kapatılmıştır. Ürün soru-cevap, platform/admin cevap otoritesi, Q&A moderation ve PDP Q&A layer P22 kapsamına dahil edilmemiştir.

**Etkilediği Alan:**
PDP Q&A layer, product information trust, platform answer authority, moderation

**Gerekli Aksiyon:**
Sıradaki paket `P23 — Q&A Foundation` olarak açılmadan önce PDP soru-cevap sistemi, moderation sistemi, kullanıcı-müşteri sistemi ve kural/yetki sistemi doğrulanmalıdır.

**Not:**
Review ürün deneyim/güven katmanıdır; Q&A ürün bilgi katmanıdır.

---**********************************************************"""""""""""""""
---

### ARD-030

**Tür:** LIMITATION  
**Başlık:** Q&A persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P23 kapsamında Q&A kayıtları `services/media` içindeki in-memory / `globalThis.__qaStore` üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
PDP Q&A layer, product information trust, answer history, moderation queue, seller/supplier answer management

**Gerekli Aksiyon:**
Kalıcı Q&A persistence ileride media/content hardening veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P23 PASS kararını düşürmez; çünkü P23 kapsamı Q&A Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek supplier/auth answer authorization enforcement yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P23’te customer answer engellenmiş ve answer author type official/authorized rollerle sınırlandırılmıştır. Ancak gerçek supplier/store/product ownership doğrulaması ve auth-to-author mapping yapılmamıştır.

**Etkilediği Alan:**
Q&A answer authority, supplier/admin answer security, PDP product information trust

**Gerekli Aksiyon:**
Gerçek answer authorization enforcement ileride supplier-management, auth/access veya Q&A hardening paketinde ele alınmalıdır.

**Not:**
BFF authorization truth üretmemelidir; gerçek enforcement owner boundary korunarak yapılmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Q&A moderation engine ve admin panel yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P23’te question/answer moderation status ve transition foundation kurulmuştur; ancak full moderation engine, automatic policy checks veya admin Q&A moderation panel kurulmamıştır.

**Etkilediği Alan:**
Q&A approval, hidden/rejected Q&A management, abuse/spam control, moderation operations

**Gerekli Aksiyon:**
Q&A moderation decision engine ve admin panel ileride moderation hardening paketinde ele alınmalıdır.

**Not:**
P23 yalnız Q&A lifecycle ve visibility foundation paketidir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** PDP aggregator Q&A entegrasyonu yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P23’te Q&A service/BFF foundation kurulmuştur; ancak PDP aggregator veya gerçek PDP UI layer entegrasyonu yapılmamıştır.

**Etkilediği Alan:**
PDP Q&A layer, product detail experience, product information trust

**Gerekli Aksiyon:**
PDP Q&A aggregator entegrasyonu ileride PDP hardening veya surface integration paketinde ele alınmalıdır.

**Not:**
P23 Q&A owner foundation’dır, PDP surface integration paketi değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Helpful/vote interaction truth P23 kapsamında yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P23’te Q&A helpful/vote, answer usefulness veya interaction truth oluşturulmamıştır.

**Etkilediği Alan:**
Q&A ordering, product information usefulness, future interaction signals

**Gerekli Aksiyon:**
Helpful/vote interaction ileride Interaction Foundation veya Q&A hardening paketinde ele alınmalıdır.

**Not:**
P23 sadece question/answer lifecycle foundation’dır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Q&A truth owner media service olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P23 kapsamında question create/list/read/transition ve answer create/transition davranışlarının owner’ı `services/media` olarak belirlenmiştir.

**Etkilediği Alan:**
PDP Q&A layer, product information, answer authority, future PDP aggregator

**Gerekli Aksiyon:**
BFF veya UI Q&A truth üretmemelidir. Q&A state mutation yalnız media owner service üzerinden yapılmalıdır.

**Not:**
BFF `@hx/media` public package boundary üzerinden çalışmalıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Q&A review/rating/UGC/post/support/social thread değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
P23’te Q&A record şu ayrımları açıkça taşır: `reviewProcess: false`, `ratingProcess: false`, `ugcStory: false`, `storePost: false`, `supportProcess: false`, `socialThreadEnabled: false`.

**Etkilediği Alan:**
PDP Q&A layer, review layer, UGC/story layer, store post layer, support system, social/comment surfaces

**Gerekli Aksiyon:**
Q&A sistemi ileride review, UGC, post, support veya sosyal comment/thread davranışlarıyla karıştırılmamalıdır.

**Not:**
Q&A ürün bilgi katmanıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Customer answer yasaktır; answer official/authorized modelde kalacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P23’te customer answer `QA_ANSWER_AUTHOR_NOT_ALLOWED` ile engellenmiştir. Answer `officialAnswer: true`, `customerGenerated: false` olarak modellenmiştir.

**Etkilediği Alan:**
PDP Q&A trust, supplier/admin answer authority, product information quality

**Gerekli Aksiyon:**
Cevap alanı serbest kullanıcı yorumuna dönüştürülmemelidir. Kullanıcı katkısı review veya UGC/story sistemleri üzerinden yönetilmelidir.

**Not:**
Q&A answer, platform/supplier/admin gibi yetkili kaynaklardan gelmelidir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P23 sonrası Interaction Foundation P24’e bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P23 yalnız Q&A Foundation olarak kapatılmıştır. Like/save/share/helpful/vote interaction truth, optimistic interaction model ve cross-surface interaction state P23 kapsamına dahil edilmemiştir.

**Etkilediği Alan:**
Post interactions, UGC interactions, review helpful, Q&A helpful, saved/liked pages, PDP social signals

**Gerekli Aksiyon:**
Sıradaki paket `P24 — Interaction Foundation` olarak açılmadan önce beğen/kaydet/paylaş sistemi, PDP/social layer, post/UGC/review/Q&A interaction ihtiyaçları ve owner boundary doğrulanmalıdır.

**Not:**
Q&A helpful/vote interaction P24 veya Q&A hardening içinde ele alınmalıdır.

---""""""""""""""****************************************************""""
---

### ARD-031

**Tür:** LIMITATION  
**Başlık:** Interaction persistence in-memory seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**
P24 kapsamında interaction kayıtları `services/interaction` içindeki in-memory / `globalThis.__interactionStore` üzerinden yönetilmektedir. Kalıcı DB persistence henüz uygulanmamıştır.

**Etkilediği Alan:**
Like, save, share, helpful, vote, saved products, liked products, interaction counters

**Gerekli Aksiyon:**
Kalıcı interaction persistence ileride interaction hardening veya data-layer paketinde ele alınmalıdır.

**Not:**
Bu limitation P24 PASS kararını düşürmez; çünkü P24 kapsamı Interaction Foundation’dır, kalıcı persistence değildir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Content existence verification yapılmıyor  
**Durum:** MONITORED

**Kısa Açıklama:**
P24’te interaction target varlık doğrulaması yapılmamıştır. Service, hedefin gerçekten mevcut olup olmadığını doğrulamaz; bu durum `INTERACTION_TARGET_EXISTENCE_NOT_VERIFIED` warning’iyle dürüst modellenmiştir.

**Etkilediği Alan:**
Product interactions, post interactions, UGC/story interactions, review helpful, Q&A helpful/vote

**Gerekli Aksiyon:**
Target existence verification ileride interaction hardening veya ilgili owner service read-check entegrasyonunda ele alınmalıdır.

**Not:**
Interaction service content truth sahibi değildir; varlık doğrulaması owner boundary korunarak yapılmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Counter cache / projection yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P24’te interaction counter summary anlık in-memory store üzerinden hesaplanmaktadır. Redis, cache, materialized projection veya DB aggregation yoktur.

**Etkilediği Alan:**
PDP counters, post counters, story counters, review helpful count, Q&A vote/helpful count, feed/ranking signals

**Gerekli Aksiyon:**
Counter projection/cache ileride performance/data-layer hardening paketinde ele alınmalıdır.

**Not:**
Counter summary BFF/UI tarafından değil interaction owner service tarafından hesaplanmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Notification ve ranking signal publish yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P24’te interaction oluştuğunda notification, analytics veya ranking event publish yapılmamıştır. `notificationEmitted: false` ile dürüst izole foundation kurulmuştur.

**Etkilediği Alan:**
Notification triggers, ranking signals, discovery personalization, analytics pipeline

**Gerekli Aksiyon:**
Interaction event publishing ileride event/analytics/ranking entegrasyon paketinde ele alınmalıdır.

**Not:**
P24 sadece source-of-truth interaction state foundation’dır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Full saved/liked pages UI yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P24 actor interaction list fonksiyonu sağlanmıştır; ancak kaydedilenler/beğenilenler için gerçek UI sayfaları ve ürün read-model enrichment yapılmamıştır.

**Etkilediği Alan:**
Saved products page, liked products page, product card enrichment, user account surfaces

**Gerekli Aksiyon:**
Saved/liked pages UI ve product enrichment ileride account/profile/surface integration paketinde ele alınmalıdır.

**Not:**
Kaydetme truth interaction service’tedir; ürün fiyat/stok read-model enrichment ilgili product/commerce owner’larından gelmelidir.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Gerçek auth-to-actor mapping P24 kapsamı dışında  
**Durum:** MONITORED

**Kısa Açıklama:**
P24’te BFF body actor önceliği ve context fallback ile çalışmıştır; gerçek auth-to-actor mapping ve access-context enforcement yapılmamıştır.

**Etkilediği Alan:**
Interaction write security, saved list ownership, actor interaction state

**Gerekli Aksiyon:**
Gerçek auth-to-actor mapping ve access-context enforcement ileride auth/access hardening paketinde ele alınmalıdır.

**Not:**
BFF actor truth üretmemelidir; interaction owner service `@hx/interaction` olarak kalmalıdır.

---

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Share external provider entegrasyonu yok  
**Durum:** MONITORED

**Kısa Açıklama:**
P24’te share interaction record üretir; ancak gerçek external/native share provider entegrasyonu yapılmamıştır. Bu durum `SHARE_PROVIDER_NOT_CONFIGURED` warning’iyle modellenmiştir.

**Etkilediği Alan:**
Share UX, social sharing, analytics, conversion tracking

**Gerekli Aksiyon:**
External/native share provider entegrasyonu ileride client/platform integration paketinde ele alınmalıdır.

**Not:**
Share provider yokluğu interaction truth foundation’ı engellemez.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Interaction truth owner ayrı `@hx/interaction` service olacaktır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P24 kapsamında like, save, share, helpful ve vote interaction state/counter davranışlarının owner’ı `services/interaction` olarak belirlenmiştir.

**Etkilediği Alan:**
PDP interactions, post interactions, UGC/story interactions, review helpful, Q&A votes, saved/liked pages

**Gerekli Aksiyon:**
BFF veya UI interaction truth üretmemelidir. Interaction state mutation yalnız `@hx/interaction` owner service üzerinden yapılmalıdır.

**Not:**
Interaction truth content/media owner içine taşınmamalıdır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** Interaction content/review/Q&A truth mutate etmeyecek  
**Durum:** ACTIVE

**Kısa Açıklama:**
P24’te interaction record alanları `contentTruthMutated: false`, `ratingTruthMutated: false`, `qaTruthMutated: false`, `supportProcess: false`, `notificationEmitted: false` olarak sabitlenmiştir.

**Etkilediği Alan:**
Media/content owner, review/rating owner, Q&A owner, support, notification

**Gerekli Aksiyon:**
Interaction service content visibility, moderation, rating average, Q&A answer veya support state üzerinde write yapmamalıdır.

**Not:**
Interaction sistemi yalnız interaction truth ve counter summary üretir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** SAVE private, diğer interactionlar aggregate-only olarak modellenecek  
**Durum:** ACTIVE

**Kısa Açıklama:**
P24’te `SAVE` interaction visibility `PRIVATE`; `LIKE`, `SHARE`, `HELPFUL`, `VOTE_UP`, `VOTE_DOWN` ise `PUBLIC_AGGREGATE_ONLY` olarak modellenmiştir.

**Etkilediği Alan:**
Saved products, liked products, counters, privacy, profile/account surfaces

**Gerekli Aksiyon:**
Kaydetme kullanıcıya ait özel niyet listesi olarak korunmalıdır. Public yüzeylerde yalnız aggregate counter/signal kullanılmalıdır.

**Not:**
Kaydedilenler sayfası kişisel ve özel yapıdadır.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** VOTE_UP / VOTE_DOWN mutual exclusion zorunludur  
**Durum:** ACTIVE

**Kısa Açıklama:**
P24’te aynı actor + same target için `VOTE_UP` ve `VOTE_DOWN` aynı anda aktif kalamaz. Biri aktif olduğunda diğeri removed yapılır.

**Etkilediği Alan:**
Q&A helpful/vote, answer usefulness, future ranking signals

**Gerekli Aksiyon:**
Vote state ileride projection/cache veya analytics’e taşınırken mutual exclusion korunmalıdır.

**Not:**
Bu karar Q&A answer quality sinyalinin tutarlı kalması için gereklidir.

---

### ARD-0XX

**Tür:** DECISION  
**Başlık:** P24 sonrası Follow Feed Foundation P25’e bırakıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**
P24 yalnız Interaction Foundation olarak kapatılmıştır. Follow relationship, follow feed ordering, followed store post feed ve feed personalization P24 kapsamına dahil edilmemiştir.

**Etkilediği Alan:**
Follow page, store posts, follow relationship, feed/ranking surfaces

**Gerekli Aksiyon:**
Sıradaki paket `P25 — Follow Feed Foundation` olarak açılmadan önce takip sistemi, post sistemi, interaction sinyalleri ve owner boundary doğrulanmalıdır.

**Not:**
Interaction sinyalleri follow feed için kullanılabilir; ancak follow feed truth ayrı ele alınmalıdır.

---
### ARD-P25-001

**Tür:** DECISION  
**Başlık:** Follow relationship M4 social owner ailesinde tutulur  
**Durum:** ACTIVE

**Kısa Açıklama:**
Takip ilişkisi BFF veya UI tarafından tutulmaz. Follow relationship foundation `@hx/follow` service içinde tutulur ve M4 social owner ailesinin alt-domain’i olarak değerlendirilir.

**Etkilediği Alan:**
Follow, feed, social graph, ranking sinyalleri

**Gerekli Aksiyon:**
İleri paketlerde follow mutation yalnız follow/social owner üzerinden yürütülmelidir.

---

### ARD-P25-002

**Tür:** DECISION  
**Başlık:** Follow feed truth değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Follow feed yalnız takip edilen mağazaların postlarını gösteren read-model/projection’dır. Post truth `@hx/media` içinde kalır.

**Etkilediği Alan:**
Feed, post, BFF, web yüzeyleri

**Gerekli Aksiyon:**
Feed response’ları post truth kopyası veya ayrı içerik owner’ı gibi kullanılmamalıdır.

---

### ARD-P25-003

**Tür:** LIMITATION  
**Başlık:** Follow foundation in-memory seviyededir  
**Durum:** MONITORED

**Kısa Açıklama:**
P25 kapsamında follow store `globalThis.__followStore` ile foundation seviyesinde tutulmuştur. DB persistence, Redis counter/cache, notification ve analytics event entegrasyonu yoktur.

**Etkilediği Alan:**
Follow, feed, ranking sinyalleri, notification, analytics

**Gerekli Aksiyon:**
İleri hardening paketlerinde persistence, eventing ve ranking entegrasyonu ayrıca ele alınmalıdır.
### ARD-P26-001

**Tür:** DECISION  
**Başlık:** Search M9 intent + candidate owner olarak kalır  
**Durum:** ACTIVE

**Kısa Açıklama:**
P26 kapsamında search service query normalization, intent classification ve candidate generation yapar. Final ranking / personalization M8 kapsamındadır.

**Etkilediği Alan:**
Search, category, PLP, discover, storefront, ranking

**Gerekli Aksiyon:**
İleri paketlerde search candidate üretimi ile M8 final ranking ayrımı korunmalıdır.

---

### ARD-P26-002

**Tür:** DECISION  
**Başlık:** Search index projection truth değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Search result ve index projection; product, category veya storefront truth’u değildir. Arama yalnız aranabilir görünüm ve candidate üretir.

**Etkilediği Alan:**
Search, catalog, taxonomy, storefront, BFF, web

**Gerekli Aksiyon:**
Search service product/category/storefront mutation yapmamalıdır.

---

### ARD-P26-003

**Tür:** LIMITATION  
**Başlık:** Search foundation static projection seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**
P26 kapsamında OpenSearch, gerçek indexing pipeline, typo/synonym/NLP engine, analytics/risk/search-quality event entegrasyonu kurulmamıştır.

**Etkilediği Alan:**
Search quality, indexing, retrieval, ranking, analytics

**Gerekli Aksiyon:**
İleri hardening veya search expansion paketlerinde gerçek index pipeline ve ranking entegrasyonu ayrıca ele alınmalıdır.





### ARD-P27-001

**Tür:** DECISION  
**Başlık:** PLP klasik ürün kart omurgasıdır  
**Durum:** ACTIVE

**Kısa Açıklama:**
Kategori / PLP yüzeyi keşfet veya story yüzeyi değildir. Ana omurga klasik ürün kart grid’idir. Video rail destekleyici kalır.

**Etkilediği Alan:**
Category, PLP, product cards, search, ranking

**Gerekli Aksiyon:**
İleri paketlerde PLP keşfet feed’ine veya story yüzeyine dönüştürülmemelidir.

---

### ARD-P27-002

**Tür:** DECISION  
**Başlık:** Klasik ürün kartta paylaş aksiyonu yoktur  
**Durum:** ACTIVE

**Kısa Açıklama:**
Klasik ürün kart projection’ında `canShare=false` kalır. Klasik kart aksiyon seti sepete ekle, beğen ve kaydet ile sınırlıdır.

**Etkilediği Alan:**
Product card, PLP, home product rails, storefront product grid

**Gerekli Aksiyon:**
Paylaş aksiyonu PDP veya uygun medya/post yüzeylerinde kalmalıdır.

---

### ARD-P27-003

**Tür:** LIMITATION  
**Başlık:** Category/PLP foundation static projection seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**
P27 kapsamında category/taxonomy, product, price, stock ve facet verileri static projection/foundation seviyesindedir. Gerçek owner entegrasyonları yoktur.

**Etkilediği Alan:**
Taxonomy, catalog, PLP, price, stock, ranking, facets

**Gerekli Aksiyon:**
İleri paketlerde gerçek taxonomy owner, product/catalog owner, price/stock owner, facet engine ve M8 ranking entegrasyonu ayrıca ele alınmalıdır.

### ARD-P28-001

**Tür:** DECISION  
**Başlık:** Storefront projection yüzeyidir, lifecycle owner değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Storefront foundation, fenomen mağaza kimliği ve mağaza yüzeyini projection olarak sunar. Creator lifecycle truth, kategori yetkisi, askı/kısıt ve başvuru kararları storefront paketi içinde mutate edilmez.

**Etkilediği Alan:**
Storefront, creator lifecycle, creator panel, admin, BFF, web

**Gerekli Aksiyon:**
İleri paketlerde creator lifecycle mutation yalnız ilgili owner sistem üzerinden yürütülmelidir.

---

### ARD-P28-002

**Tür:** DECISION  
**Başlık:** Storefront ürün grid’i klasik product card kuralını korur  
**Durum:** ACTIVE

**Kısa Açıklama:**
Storefront ürün grid’i klasik ürün kart projection omurgasını kullanır. Klasik kartta `canShare=false`, PDP geçişinde `storeContextRequired=true` kalır.

**Etkilediği Alan:**
Storefront, PLP, product cards, PDP

**Gerekli Aksiyon:**
Paylaş aksiyonu klasik ürün kartına eklenmemeli; uygun medya/post/PDP yüzeylerinde kalmalıdır.

---

### ARD-P28-003

**Tür:** DECISION  
**Başlık:** Storefront video rail story değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Storefront video rail mağaza bağlamlı video ürün vitrini olarak kalır. Story truth taşımaz ve discovery feed değildir.

**Etkilediği Alan:**
Storefront, video, story, discover

**Gerekli Aksiyon:**
İleri paketlerde storefront video rail ile story yüzeyleri karıştırılmamalıdır.

---

### ARD-P28-004

**Tür:** LIMITATION  
**Başlık:** Storefront foundation static projection seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**
P28 kapsamında storefront verileri static projection olarak kurulmuştur. Gerçek creator lifecycle, product pool, price/stock, media/story upload pipeline ve M8 ranking entegrasyonları yoktur.

**Etkilediği Alan:**
Storefront, creator lifecycle, product pool, pricing, stock, media, ranking

**Gerekli Aksiyon:**
İleri paketlerde gerçek owner entegrasyonları ve persistence ayrı olarak ele alınmalıdır.
### ARD-P29-001

**Tür:** DECISION  
**Başlık:** Story post, follow feed veya video rail değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Story kısa süreli içerik/dolaşım yüzeyidir. Storefront video rail, mağaza postları, follow feed ve PDP social layer story olarak modellenmez.

**Etkilediği Alan:**
Story, storefront, post, follow feed, PDP, discover

**Gerekli Aksiyon:**
İleri paketlerde story yüzeyleri post/feed/video rail ile birleştirilmemelidir.

---

### ARD-P29-002

**Tür:** DECISION  
**Başlık:** Story yüzey bağlamı korunur  
**Durum:** ACTIVE

**Kısa Açıklama:**
Story tray ve viewer yüzey kuralları aynıdır. HOME/DISCOVER yalnız `STORE_INTRO`, STOREFRONT `STORE_INTRO` + `STORE_PRODUCT`, PDP yalnız `USER_PRODUCT` story döndürür.

**Etkilediği Alan:**
Story tray, story viewer, storefront, PDP, discover

**Gerekli Aksiyon:**
Yeni story türleri eklenirse tray ve viewer surface kuralları birlikte güncellenmelidir.

---

### ARD-P29-003

**Tür:** DECISION  
**Başlık:** Story media ve moderation truth sahibi değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Story service media asset lifecycle veya moderation decision owner değildir. Asset truth media owner’da, moderation truth moderation owner’da kalır.

**Etkilediği Alan:**
Story, media, asset, moderation

**Gerekli Aksiyon:**
Story upload, processing ve moderation workflow ileri paketlerde ilgili owner sistemlerle entegre edilmelidir.

---

### ARD-P29-004

**Tür:** LIMITATION  
**Başlık:** Story foundation static projection seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**
P29 kapsamında story verileri static projection olarak kurulmuştur. Gerçek media processing, moderation workflow, create/upload/publish pipeline ve seen-state persistence yoktur.

**Etkilediği Alan:**
Story, media, moderation, interaction, analytics

**Gerekli Aksiyon:**
İleri paketlerde gerçek story lifecycle, media asset owner entegrasyonu, moderation workflow ve event/analytics entegrasyonu ayrıca ele alınmalıdır.



### ARD-P30-001

**Tür:** DECISION  
**Başlık:** Yüklenen dosya yayına uygun medya değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**
Media asset sistemi, upload edilmiş dosya ile visibility-ready medya varlığını ayırır. Bir dosyanın yüklenmiş olması, onun story, post, PDP, storefront veya ürün kartlarında yayınlanabileceği anlamına gelmez.

**Etkilediği Alan:**
Media, story, post, UGC, PDP, storefront, product card

**Gerekli Aksiyon:**
İleri paketlerde tüm medya kullanan yüzeyler media asset visibility/processing durumuna göre hareket etmelidir.

---

### ARD-P30-002

**Tür:** DECISION  
**Başlık:** Media asset truth @hx/media içinde kalır  
**Durum:** ACTIVE

**Kısa Açıklama:**
Story, Post, UGC, Storefront, PDP ve Product sistemleri media asset lifecycle truth’u mutate etmez. Asset lifecycle yalnız media owner alanında yönetilir.

**Etkilediği Alan:**
Media, story, post, UGC, storefront, PDP, product/catalog

**Gerekli Aksiyon:**
İleri entegrasyonlarda yüzeyler sadece media asset projection/ref kullanmalı; lifecycle mutation media owner’a command olarak gitmelidir.

---

### ARD-P30-003

**Tür:** DECISION  
**Başlık:** Visibility-ready ve moderation-ready ayrı durumlardır  
**Durum:** ACTIVE

**Kısa Açıklama:**
Bir asset teknik olarak işlenmiş ve moderation review’a hazır olabilir; fakat final approval olmadan visibility-ready kabul edilmez.

**Etkilediği Alan:**
Media, moderation, story, post, UGC, PDP

**Gerekli Aksiyon:**
İleri paketlerde moderation owner entegrasyonu eklendiğinde visibility-ready yalnız güvenli onay sonrası açılmalıdır.

---

### ARD-P30-004

**Tür:** LIMITATION  
**Başlık:** Media asset foundation simülasyon seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**
P30 kapsamında media asset store in-memory çalışır. Gerçek storage, CDN, transcoding, image processing, malware scan ve moderation decision engine yoktur.

**Etkilediği Alan:**
Media, infra, moderation, security, story, post, UGC

**Gerekli Aksiyon:**
İleri paketlerde storage provider, CDN, processing worker, malware scan, audit/event pipeline ve moderation owner entegrasyonu ayrıca ele alınmalıdır.

# 65 — Moderation BFF / Web Integration Closure

## Durum
CLOSED / PASS

## Kapsam
Moderation foundation servisinin BFF ve Web simulation katmanlarına bağlanması tamamlandı.

## Oluşturulan Dosyalar
- `apps/bff/src/server/moderation.ts`
- `apps/web/src/bootstrap/moderation.ts`

## Güncellenen Dosyalar
- `apps/bff/package.json`
- `apps/bff/src/server/index.ts`
- `apps/web/src/bootstrap/app.ts`

## Amaç
Moderasyon vakası oluşturma, inceleme, listeleme ve okuma akışlarının BFF üzerinden servis katmanına delegasyonla çalışması sağlandı. Web tarafında foundation simülasyonu eklendi.

## BFF Kararı
BFF moderasyon truth üretmez. Sadece request parse eder, `@hx/moderation` servisine delegasyon yapar ve servis sonucunu taşır.

## Web Kararı
Web state/truth tutmaz. Sadece simülasyon ve response doğrulama görevi görür.

## Boundary Sonucu
- BFF içinde `__moderationStore` yok.
- Web içinde `__moderationStore` yok.
- BFF target domain mutation yapmaz.
- Web target domain mutation yapmaz.
- Moderation route’ları sadece moderation servisine bağlıdır.
- Hedef domain enforcement bu paketin kapsamı dışındadır.

## Bilinçli Limitation
- Gerçek admin moderation console yok.
- Gerçek operasyon kuyruğu yok.
- Gerçek auth/role enforcement sınırlı foundation seviyesindedir.
- Karar sonrası hedef domainlere otomatik enforcement yapılmaz.

## Kanıt
- `apps/bff/package.json` içine `@hx/moderation` bağımlılığı eklendi.
- `apps/bff/src/server/index.ts` içine moderation route bağlantıları eklendi.
- `apps/web/src/bootstrap/app.ts` içine moderation simulation eklendi.
- `pnpm run typecheck`: PASS
- `pnpm run build`: PASS

## Karar
PASS
P32 — Post-P31 Source Audit & Technical Debt Inventory

Durum: PASS

Amaç:
P01–P31 sonrası sistemde biriken teknik borçları kaynak kod üzerinden doğrulamak ve P33 yönünü kanıtla belirlemek.

Yapılan İşler:
- Kritik servislerde in-memory/globalThis/Map tabanlı runtime store kullanımı tarandı.
- Persistence, provider simulation, event/audit, eligibility ve search/indexing gap’leri incelendi.
- BFF handler’larının truth üretmediği ve servis delegasyonu yaptığı non-issue olarak ayrıldı.
- P33 için Persistence Foundation yönü önerildi.

Ana Bulgular:
- Commerce/cart, order, payment, media/review, moderation ve notification gibi kritik owner alanlarında in-memory store kullanımı doğrulandı.
- PostgreSQL client, repository adapter, migration ve transaction boundary eksikleri persistence gap olarak kayda geçti.
- Payment ve shipment provider entegrasyonları simulation/foundation seviyesinde.
- Audit/event tarafında durable audit store, outbox pattern ve persistent event store yok.
- Review/UGC eligibility gerçek order/shipment delivery verisine bağlı değil.
- Search static/in-memory candidate modeliyle çalışıyor; OpenSearch indexing pipeline yok.

Komut Kanıtı:
- pnpm run typecheck: PASS
- pnpm run build: PASS

Limitations:
- Audit, persistence implementation üretmemiştir; yalnız kaynak kod denetimi ve yön belirleme yapmıştır.
- “Tüm servisler” kapsamındaki genelleme sonraki persistence paketlerinde domain bazlı tekrar doğrulanacaktır.

Sonuç:
P32 PASS. P33 yönü Persistence Foundation olarak belirlenmiştir.


####
## 65 — Active Risks için eklenmesi gereken kayıtlar

Bence P32 sonrası 65 içine en az şu 5 kayıt eklenmeli:

ARD — Persistence Debt
Kritik owner truth alanları in-memory.
Restart-safe değil.
Aksiyon: P33 Persistence Foundation.
ARD — Provider Simulation Debt
Payment/shipment/refund/notification/media provider’ları simulation/foundation seviyesinde.
Aksiyon: persistence sonrası sandbox provider paketleri.
ARD — Event/Audit Durability Debt
Audit metadata var ama durable audit/event store yok.
Aksiyon: outbox/event/audit foundation.
ARD — Eligibility Real-Data Dependency
Review/story/UGC eligibility gerçek delivered order/shipment verisine bağlı değil.
Aksiyon: order/shipment persistence sonrası eligibility hardening.
ARD — Search Indexing Debt
Search static/in-memory projection.
Aksiyon: OpenSearch indexing pipeline.

"""""""""""""""""""""**************************"""""""""
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Persistence foundation raw pg + repository pattern ile başlatıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P33 kapsamında ağır ORM kullanılmadan `@hx/persistence` package ve repository pattern ile ilk persistence foundation başlatıldı. Moderation pilot domain olarak seçildi.

**Etkilediği Alan:**  
Persistence, owner services, moderation, future DB-backed services

**Gerekli Aksiyon:**  
Sonraki persistence paketlerinde aynı repository boundary ve config standardı korunacak.

**Not:**  
P33 moderation pilot ile sınırlıdır; tüm servisler kalıcılaşmış sayılmaz.

****************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Postgres mode canlı DB üzerinde henüz doğrulanmadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P33’te PostgreSQL adapter, migration ve config typecheck/build seviyesinde doğrulandı; ancak canlı PostgreSQL instance üzerinde migration + runtime execution yapılmadı.

**Etkilediği Alan:**  
Persistence, local runtime, moderation, future DB rollout

**Gerekli Aksiyon:**  
İlk uygun infra/persistence validation paketinde canlı PostgreSQL ile migration ve repository runtime testi çalıştırılacak.

**Not:**  
P33 kapanış engeli değildir; ancak production readiness için kapatılması gerekir.
************************************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Production’da sessiz in-memory fallback yapılmayacak  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P33-R ile `PERSISTENCE_MODE` standardı getirildi. `postgres` modunda `DATABASE_URL` zorunludur. In-memory fallback yalnız local/foundation/test bağlamında açık tutulabilir.

**Etkilediği Alan:**  
Persistence, config, runtime safety

**Gerekli Aksiyon:**  
Yeni servis persistence paketlerinde mode/config davranışı açık şekilde uygulanacak.

**Not:**  
Redis veya memory owner truth yerine geçmez.
*****************************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Postgres mode canlı DB üzerinde henüz doğrulanmadı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P34 kapsamında local PostgreSQL runtime ayağa kaldırıldı, moderation migration canlı DB’ye uygulandı, schema doğrulandı ve moderation postgres smoke test başarıyla geçti.

**Etkilediği Alan:**  
Persistence, local runtime, moderation

**Gerekli Aksiyon:**  
Kapandı. Sonraki persistence paketlerinde aynı migration + schema verification + smoke test standardı uygulanacak.

**Not:**  
Transactional rollback hardening ayrı teknik borç olarak izlenebilir.
********************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Migration rollback foundation seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P34 ile migration runner idempotent çalışacak hale getirildi; ancak transactional rollback ve gelişmiş migration recovery henüz foundation seviyesindedir.

**Etkilediği Alan:**  
Persistence, DB migration, release safety

**Gerekli Aksiyon:**  
İlerleyen persistence hardening paketlerinde migration rollback/recovery standardı güçlendirilecek.

**Not:**  
P34 kapanış engeli değildir.
*************************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Cart ve Checkout persistence foundation tamamlandı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P35 kapsamında Cart ve Checkout state’leri repository-backed persistence modeline taşındı. Commerce owner boundary korunarak PostgreSQL adapter ve in-memory adapter ayrımı kuruldu.

**Etkilediği Alan:**  
Commerce, cart, checkout, persistence

**Gerekli Aksiyon:**  
Payment/order persistence paketlerinde cart ≠ reservation ve checkout ≠ payment/order ayrımı korunacak.

**Not:**  
P35 payment, order veya stock reservation kapsamına girmemiştir.
**********************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Checkout snapshot foundation seviyesinde JSONB ağırlıklı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P35 kapsamında checkout session persistence foundation seviyesinde JSONB snapshot yaklaşımıyla başlatılmıştır. İleri aşamada normalize model ihtiyacı tekrar değerlendirilecektir.

**Etkilediği Alan:**  
Checkout, persistence, future payment/order handoff

**Gerekli Aksiyon:**  
Payment/order persistence öncesi checkout snapshot alanlarının yeterliliği gözden geçirilecek.

**Not:**  
P35 kapanış engeli değildir.

****************************************************

### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Payment attempt lookup JSONB query üzerinden çalışıyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
P36 kapsamında `getByPaymentAttemptId` PostgreSQL adapter’da JSONB query ile çalışmaktadır. Foundation için kabul edilmiştir; yüksek ölçekte dedicated indexed `payment_attempt_id` kolonu gerekebilir.

**Etkilediği Alan:**  
Payment persistence, performance, future provider integration

**Gerekli Aksiyon:**  
Payment provider sandbox veya payment hardening paketinde dedicated indexed `payment_attempt_id` kolonu değerlendirilmelidir.

**Not:**  
P36 kapanış engeli değildir.

***************************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** In-memory payment/order smoke test service isolation’ı tam yansıtmaz  
**Durum:** MONITORED

**Kısa Açıklama:**  
P36 smoke testinde in-memory mode için payment ve order servisleri arası state paylaşımı workaround ile sağlanmıştır. Ana doğrulama PostgreSQL mode üzerinden yapılmıştır.

**Etkilediği Alan:**  
Testing, payment/order persistence validation

**Gerekli Aksiyon:**  
İleride in-memory test yaklaşımı shared test fixture veya service mock standardıyla iyileştirilecek.

**Not:**  
Production davranışı için ana kabul kanıtı postgres mode testidir.

*****************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Cross-service source import boundary ihlali kapatıldı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P37 sırasında repo-wide typecheck/build, `services/commerce/src/smoke-test.ts` dosyasının `services/checkout/src/checkout.ts` source dosyasını doğrudan import etmesi nedeniyle fail oldu. P37-R ile smoke test source import bağımlılığı kaldırıldı; checkout tarafındaki commerce source import da public package export kullanımına taşındı.

**Etkilediği Alan:**  
Commerce, checkout, workspace boundary, TypeScript project references

**Gerekli Aksiyon:**  
Yeni paketlerde service-to-service `src` import yapılmayacak; public package export veya izinli boundary kullanılacak.

**Not:**  
P37-R sonrası `pnpm run typecheck`, `pnpm run build` ve `p37:smoke` PASS.
********************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** P37 persistence smoke test BFF/API end-to-end değildir  
**Durum:** MONITORED

**Kısa Açıklama:**  
P37 smoke test shipment, cancel-return ve refund repository-level persistence davranışını doğrular. Tam BFF/API journey testi değildir.

**Etkilediği Alan:**  
Shipment, cancel-return, refund, testing, future acceptance

**Gerekli Aksiyon:**  
İleri acceptance paketlerinde BFF/API seviyesinde shipment-return-refund journey doğrulanacak.

**Not:**  
P37 kapanış engeli değildir.
***************************************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Event/audit durability foundation başlatıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P38 kapsamında `audit_logs` ve `event_outbox` tabloları ile kalıcı audit/event foundation başlatıldı. Pilot entegrasyon moderation, payment ve order servisleriyle sınırlı tutuldu.

**Etkilediği Alan:**  
Audit, event, persistence, moderation, payment, order

**Gerekli Aksiyon:**  
İlerleyen paketlerde publisher/consumer, broader service rollout ve transactional outbox hardening ayrıca ele alınacak.

**Not:**  
Event owner state mutation yerine geçmez; önce owner truth yazılır, sonra audit/event kaydı oluşur.
***********************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Audit/outbox append owner write ile transactionally atomic değil  
**Durum:** MONITORED

**Kısa Açıklama:**  
P38 kapsamında audit/outbox append, owner truth write sonrası yapılmaktadır. Mevcut owner service write boundary shared transaction sunmadığı için audit/outbox append owner write ile transactionally atomic değildir.

**Etkilediği Alan:**  
Audit, event outbox, payment, order, moderation, consistency

**Gerekli Aksiyon:**  
İleri hardening paketinde transactional outbox veya shared transaction boundary standardı değerlendirilecek.

**Not:**  
P38 foundation kapanış engeli değildir; ancak production readiness için izlenmelidir.
********************************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Review/UGC eligibility gerçek persisted veriden türetilecek  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P39 kapsamında review, UGC/story ve verified-purchase eligibility kararları request-body snapshot veya manuel `deliveredConfirmed` alanı yerine persisted checkout actor, order, payment, delivered shipment line, cancel-return ve refund truth üzerinden türetilir hale getirildi.

**Etkilediği Alan:**  
Media, review, UGC/story, verified purchase, eligibility, commerce/shipment/refund read boundaries

**Gerekli Aksiyon:**  
Yeni review/story/UGC akışlarında UI/BFF-provided eligibility snapshot truth kabul edilmeyecek.

**Not:**  
Eligibility read-derived karardır; order/shipment/refund/payment truth mutate etmez.
*****************************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Failed persisted order fixture coverage sınırlı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P39’da unsuccessful order/payment guard code-level olarak `ORDER_NOT_SUCCESSFUL` ve `PAYMENT_NOT_SUCCESSFUL` ile uygulanmıştır. Ancak mevcut order service failed order attempts persist etmediği için canlı smoke testte failed persisted order fixture coverage sınırlıdır.

**Etkilediği Alan:**  
Eligibility, order/payment persistence testing, review/UGC validation

**Gerekli Aksiyon:**  
Order/payment hardening veya negative fixture test paketinde failed persisted order/payment scenario coverage güçlendirilecek.

**Not:**  
P39 kapanış engeli değildir.
****************************************************
### ARD-0XX

**Tür:** DECISION  
**Başlık:** Search product indexing OpenSearch foundation seviyesine geçti  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P40 kapsamında search sistemi static/in-memory product candidate modelinden OpenSearch-backed product indexing ve candidate retrieval foundation seviyesine taşındı. Memory backend yalnız explicit foundation/degraded mode olarak tutuldu.

**Etkilediği Alan:**  
Search, product candidate retrieval, OpenSearch, BFF search projection

**Gerekli Aksiyon:**  
İlerleyen paketlerde category/storefront indexing, facet contract genişletmesi ve production search hardening ayrıca ele alınacak.

**Not:**  
P40 ranking/recommendation/personalization üretmez; yalnız search indexing/candidate foundation sağlar.
****************************************************
### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Local OpenSearch credential/bootstrap uyumsuzluğu  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40 canlı OpenSearch smoke sırasında local OpenSearch container HTTPS/self-signed cert bypass gerektirmiş ve container `admin:admin` credential kabul etmiştir. Compose password env ile çalışma credential’ı uyumlu değildir.

**Etkilediği Alan:**  
Search, OpenSearch local runtime, security/config

**Gerekli Aksiyon:**  
Search hardening veya local infra hardening paketinde OpenSearch bootstrap credential/env standardı hizalanacak.

**Not:**  
P40 kapanış engeli değildir; live smoke PASS alınmıştır.
******************************************


### ARD-0XX

**Tür:** LIMITATION  
**Başlık:** Category/storefront search candidates foundation projection seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40 product candidate retrieval için OpenSearch foundation kurmuştur. Category/storefront candidates ise hâlâ foundation projection seviyesindedir ve OpenSearch-indexed document değildir.

**Etkilediği Alan:**  
Search, category, storefront, PLP/search facets

**Gerekli Aksiyon:**  
İlerleyen search expansion paketinde category/storefront document indexing değerlendirilecek.

**Not:**  
P40 product indexing foundation kapsamını kapatır.
**************************************************************



## 4. Kapanan veya izlenen kayıtlar için not

### Kullanım kuralı

* `ACTIVE` = aktif izlenir, aksiyon gerekir
* `MONITORED` = bilinen ve kontrollü sınırlama, şu an blokaj değildir
* `CLOSED` = karar verilmiş ve tekrar açılmasına gerek olmayan risk/konu

Bu dosyada henüz `CLOSED` kayıt tutulmamıştır; ihtiyaç oldukça eklenecektir.

---***************************************

## 5. Güncelleme kuralı

Bu dosya aşağıdaki durumlarda güncellenir:

* yeni aktif risk ortaya çıktığında
* önemli teknik karar verildiğinde
* limitation bilinçli olarak kabul edildiğinde
* risk kapandığında veya etkisi bittiğinde

Net kural:

* Aktif risk kaydı yoksa “risk yok” varsayılmaz
* Bilinçli limitation kaydı yazılmadan unutulmaz

---
*****************************************

## 6. Kısa sonuç

Bu dosya, uygulama sürecindeki canlı riskleri ve kararları tek yerde tutar.

Bu dosya sayesinde şu sorular hızlı cevaplanır:

* hangi riskler aktif?
* hangi sınırlamalar bilinçli kabul edildi?
* hangi kararlar yeniden tartışılmamalı?
* bir sonraki pakette hangi risklere dikkat edilmeli?
