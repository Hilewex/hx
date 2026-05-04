Bu dosyanın amacı:

61/62 roadmap paket numaraları ile aktif yürütme paket numaralarını eşleştirmek
P32–P41 teknik borç ara hattını resmileştirmek
“P42” gibi numaraların hangi bağlamda kullanıldığını netleştirmek
Bundan sonra her pakette hem Execution Pack hem Roadmap Counterpart bilgisini zorunlu hale getirmek
63/64/65 ile 61/62 arasındaki çakışmayı önlemek

Aşağıdaki içeriği doğrudan oluşturabilirsin.

# ROADMAP_ALIGNMENT_AND_PACKAGE_NUMBERING

## 1. Amaç

Bu dosya, Hedihup uygulama sürecinde stratejik roadmap belgeleri ile fiili yürütme paketleri arasındaki numaralandırma ve kapsam farklarını hizalamak için oluşturulmuştur.

Bu dosyanın amacı:

- `61-FULL_CAPACITY_CODING_ROADMAP.md` ve `62-MASTER_IMPLEMENTATION_PLAN.md` içindeki roadmap paketleri ile fiili yürütme paketlerini eşleştirmek
- P32–P41 arasında açılan teknik borç kapatma hattını resmi ara hat olarak tanımlamak
- P42 ve sonrası paketlerde paket numarası karışıklığını önlemek
- roadmap karşılığı ile aktif execution paketini birlikte göstermeyi standartlaştırmak
- 63/64/65 aktif yürütme dosyalarının stratejik planlarla çelişmeden kullanılmasını sağlamaktır

Net kural:

- 61/62 stratejik roadmap kaynaklarıdır.
- 63/64/65 aktif yürütme kayıtlarıdır.
- Bu dosya, stratejik roadmap ile aktif yürütme arasındaki eşleme katmanıdır.
- Bu dosya yeni roadmap üretmez; mevcut roadmap ile fiili yürütmeyi hizalar.

---

## 2. Neden bu dosyaya ihtiyaç var?

Fiili uygulama sürecinde P01–P31 tamamlandıktan sonra P32 ile kaynak kod denetimi yapıldı. Bu denetim sonucunda aşağıdaki teknik borçlar tespit edildi:

- in-memory owner state borcu
- canlı DB validation eksikliği
- cart/checkout/payment/order/shipment/return/refund persistence eksikleri
- event/audit durability eksikliği
- review/UGC eligibility gerçek veri eksikliği
- search/indexing borcu

Bu nedenle normal roadmap’e doğrudan devam etmek yerine P32–P41 arasında teknik borç kapatma hattı açıldı.

Bu hat, 61/62 roadmap’e aykırı değildir; ancak paket numaralandırmasını fiili olarak değiştirmiştir.

Bu yüzden bundan sonra paketler iki bilgiyle takip edilir:

```text
Execution Pack: aktif yürütme paket numarası
Roadmap Counterpart: 61/62 içindeki stratejik karşılık
3. Resmi numaralandırma kuralı

Bundan sonra her yeni paket başlığında şu format kullanılacaktır:

Execution Pack: PXX — Paket Adı
Roadmap Counterpart: 62 Paket YY — Roadmap Paket Adı
Roadmap Phase: 61/62 ilgili faz adı

Örnek:

Execution Pack: P42 — Risk / Fraud Foundation
Roadmap Counterpart: 62 Paket 33 — Risk / Fraud Foundation
Roadmap Phase: FAZ 8 — Support, Moderation, Risk, Ops

Net kural:

P42 aktif yürütme numarasıdır.
62 Paket 42 aynı şey değildir.
62’de Paket 42, Error / Edge / Retry Hardening anlamına gelir.
Bu yüzden bundan sonra yalnız “P42” demek yetmez; ilk açılışta roadmap karşılığı da yazılır.
4. Kaynak dosya rolleri
61-FULL_CAPACITY_CODING_ROADMAP.md

Rolü:

tam kapsamlı uygulama yol haritası
fazlar ve büyük paket sırası
hangi alanın hangi fazda ele alınacağını gösterir
62-MASTER_IMPLEMENTATION_PLAN.md

Rolü:

kodlama başlangıcından release candidate aşamasına kadar bağlayıcı master yürüyüş planı
paket bazlı uygulama sırası
referans setleri
acceptance ve closure disiplini
63-IMPLEMENTATION_PROGRESS_MASTER.md

Rolü:

aktif yürütmenin güncel resmi durum dosyası
şu an nerede olduğumuzu gösterir
64-PACKAGE_EXECUTION_LOG.md

Rolü:

fiili paket kapanış kayıtları
PASS / PARTIAL / FAIL kararları
ana kanıtlar ve kısa sonuçlar
65-ACTIVE_RISKS_AND_DECISIONS.md

Rolü:

aktif riskler
monitored limitations
tekrar tartışılmaması gereken kararlar
66-ROADMAP_ALIGNMENT_AND_PACKAGE_NUMBERING.md

Rolü:

61/62 ile 63/64/65 arasındaki numara ve kapsam eşlemesini tutar
ara teknik borç hattını açıklar
bundan sonraki paketlerde çakışmayı önler
5. Fiili yürütme ile roadmap eşleme özeti
P01–P31

P01–P31 fiili yürütme hattı, 61/62’deki ilk foundation, commerce, shipment, social/content, support ve moderation alanlarını foundation seviyesinde tamamlamıştır.

Bu hat içinde bazı roadmap paketleri daha küçük parçalara ayrılmıştır.

Örnekler:

62’de Payment / Order hattı daha genel tanımlıyken fiili yürütmede:
P13 — Payment Initiation Foundation
P14 — Payment → Order Foundation
P15 — Order Read / Detail Foundation
62’de Return / Refund daha birleşik ele alınırken fiili yürütmede:
P17 — Cancel / Return Foundation
P18 — Refund Foundation

Bu ayrıştırmalar bilinçli yapılmıştır ve kritik state ayrımlarını korumak için doğrudur.

6. P32–P41 teknik borç ara hattı

P32–P41 arası normal roadmap sırasından kontrollü sapma olarak kabul edilir.

Bu hat aşağıdaki borçları foundation seviyesinde kapatmıştır:

Execution Pack	Paket Adı	Amaç
P32	Post-P31 Source Audit & Technical Debt Inventory	P01–P31 sonrası teknik borçları kaynak koddan tespit etmek
P33	Persistence Foundation / Moderation Pilot	@hx/persistence foundation ve moderation pilot
P34	Live DB Runtime Validation	canlı PostgreSQL ve migration runner doğrulama
P35	Cart / Checkout Persistence Foundation	cart/checkout persistence
P36	Payment / Order Persistence Foundation	payment/order persistence, idempotency, unknown-result guard
P37	Shipment / Return / Refund Persistence Foundation	shipment/cancel-return/refund persistence
P38	Event / Audit Durability Foundation	audit_logs ve event_outbox foundation
P39	Eligibility Real Data Hardening	review/UGC eligibility gerçek persisted veriden türetme
P40	Search / OpenSearch Indexing Foundation	OpenSearch product indexing ve candidate retrieval
P41	Technical Debt Closure Gate & Roadmap Re-Alignment	teknik borç hattını kapatma ve roadmap’e dönüş kararı

Resmi hüküm:

P32–P41 teknik borç ara hattı foundation seviyesinde tamamlanmıştır.
Bu hat production-ready anlamına gelmez.
Bu hat normal roadmap’e dönüşü mümkün kılar.
7. P42 ve sonrası için eşleme

Bundan sonraki aktif paket numarası P42’den devam eder. Ancak 61/62 içindeki roadmap karşılığı farklı numaralarda olabilir.

Önerilen eşleme
Execution Pack	Aktif Paket Adı	Roadmap Counterpart	Roadmap Fazı
P42	Risk / Fraud Foundation	62 Paket 33 — Risk / Fraud Foundation	FAZ 8 — Support, Moderation, Risk, Ops
P43	Order Ops Foundation	62 Paket 34 — Order Ops Foundation	FAZ 8 — Support, Moderation, Risk, Ops
P44	Finance Correction Foundation	62 Paket 35 — Finance Correction Foundation	FAZ 9 — Finance, Settlement, Payout
P45	Settlement Foundation	62 Paket 36 — Settlement Foundation	FAZ 9 — Finance, Settlement, Payout
P46	Payout Foundation	62 Paket 37 — Payout Foundation	FAZ 9 — Finance, Settlement, Payout
P47	Notification Provider / Hardening	62 Paket 38 — Notification Foundation	FAZ 10 — Observability, Analytics, Audit, Notification
P48	Metrics / Analytics Foundation	62 Paket 40 — Metrics / Analytics Foundation	FAZ 10 — Observability, Analytics, Audit, Notification
P49	Contract Hardening	62 Paket 41 — Contract Hardening	FAZ 11 — Hardening ve Release Candidate
P50	Error / Edge / Retry Hardening	62 Paket 42 — Error / Edge / Retry Hardening	FAZ 11 — Hardening ve Release Candidate
P51	Acceptance Closure	62 Paket 43 — Acceptance Closure	FAZ 11 — Hardening ve Release Candidate
P52	Release Candidate	62 Paket 44 — Release Candidate	FAZ 11 — Hardening ve Release Candidate

Not:

P38 Event/Audit Foundation fiili olarak P38’de tamamlandığı için 62 Paket 39 tekrar birebir açılmayacaktır.
Eğer event publisher/consumer hardening gerekirse ayrı bir execution package olarak açılır.
Search foundation fiili P40 ile güçlendirildiği için 62’deki search alanı foundation seviyesinde kapalıdır; ranking/recommendation ayrı ihtiyaç olarak kalır.
Provider integration paketleri gerektiğinde bu eşlemeye ara paket olarak eklenebilir.
8. Açık kalan roadmap alanları

P41 sonrası kalan ana alanlar:

Risk / Fraud Foundation
Order Ops Foundation
Finance Correction Foundation
Settlement Foundation
Payout Foundation
Provider hardening paketleri
Notification provider / realtime hardening
Metrics / Analytics Foundation
Contract Hardening
Error / Edge / Retry Hardening
Acceptance Closure
Release Candidate

Ayrıca izlenen production-readiness borçları:

payment provider integration
carrier provider integration
refund provider integration
media storage/CDN integration
transactional outbox hardening
publisher/consumer system
full BFF/API acceptance coverage
migration rollback/recovery
OpenSearch bootstrap/credential hardening
category/storefront search indexing
analytics/metrics/dashboard maturity
9. Bundan sonra paket açılış şablonu

Her yeni paket açılırken başlık şu formatla verilir:

# PXX — Paket Adı

## Roadmap Alignment

- Execution Pack: PXX — Paket Adı
- Roadmap Counterpart: 62 Paket YY — Roadmap Paket Adı
- Roadmap Phase: Faz adı
- Status: NOT STARTED / IN PROGRESS / PASS / PARTIAL / FAIL

## Scope

...

## Out of Scope

...

## Hard Rules

...

## Required Evidence

...

Bu şablon kullanılmadan yeni paket açılmayacaktır.

10. P42 için resmi başlangıç eşlemesi
Execution Pack

P42 — Risk / Fraud Foundation

Roadmap Counterpart

62 Paket 33 — Risk / Fraud Foundation

Roadmap Phase

FAZ 8 — Support, Moderation, Risk, Ops

Kapsam

P42’nin amacı risk/fraud alanını cezalandırma sistemi olarak değil, signal, flag, hold, review ve abuse protection foundation olarak başlatmaktır.

Ana sınırlar
Risk sistemi moderation sistemi değildir.
Risk sistemi finance truth owner değildir.
Risk sistemi order/payment/refund truth mutate etmez.
Risk flag/hold/review kararları owner boundary ile uygulanır.
BFF/UI/panel truth üretmez.
Risk kararları audit-ready olmalıdır.
Protected action ve audit/event foundation ile uyumlu olmalıdır.
11. Çakışma önleme kuralları

Bundan sonra aşağıdaki kurallar uygulanır:

Paket numarası yalnız execution context içinde yorumlanır.
61/62 paket numarasıyla karışabilecek her durumda roadmap counterpart yazılır.
P32–P41 teknik borç hattı roadmap sapması olarak değil, resmi ara düzeltme hattı olarak kabul edilir.
“Production-ready” ifadesi kullanılmaz; yalnız “foundation-level closure” denir.
Provider simulation borçları release readiness öncesi ayrıca kapatılmalıdır.
Event/outbox foundation, publisher/consumer sistemiyle karıştırılmaz.
Search indexing, ranking/recommendation sistemiyle karıştırılmaz.
Risk/fraud, moderation ve finance owner alanlarıyla karıştırılmaz.
63 aktif durum dosyasıdır; 64 yürütme logudur; 65 aktif risk/karar dosyasıdır.
Eski detaylar arşiv dosyalarında tutulur; aktif dosyalar tekrar şişirilmez.
12. Son hüküm

P01–P41 fiili yürütme hattı, 61/62’deki temel çalışma disiplinine uyumludur.

Ana sapma, P32–P41 arasında açılan teknik borç kapatma hattı ve buna bağlı paket numaralandırmasıdır.

Bu sapma bilinçli, gerekçeli ve mimari olarak doğru kabul edilir.

Bundan sonra aktif yürütme P42’den devam eder; ancak her paket için roadmap counterpart açıkça yazılır.

Tek cümlelik karar:

P42 ve sonrası paketler execution numarasıyla yürütülecek, ancak 61/62 roadmap karşılığı her paket açılışında zorunlu olarak belirtilecektir.


Benim önerim: Bu dosyayı oluşturup 63/64/65’in yanına koy. Sonra P42’ye geçerken ilk satıra artık şu bilgiyi koyacağız:

```text
Execution Pack: P42 — Risk / Fraud Foundation
Roadmap Counterpart: 62 Paket 33 — Risk / Fraud Foundation