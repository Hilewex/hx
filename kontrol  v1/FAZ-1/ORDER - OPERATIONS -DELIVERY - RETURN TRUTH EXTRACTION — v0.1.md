FAZ-1 / PAKET-3
ORDER / OPERATIONS / DELIVERY / RETURN TRUTH EXTRACTION — v0.1
1. Ana gerçek

Sipariş oluştuktan sonra sistem artık “catalog commerce” değil:

operational commerce

moduna geçer.

Bu aşamada:

fulfillment
shipment
delivery
support
cancellation
return
settlement
payout
review/story eligibility

birbirine bağlanır.

Kritik gerçek:

sipariş = ticari kayıt
sipariş operasyonu = iç iş akışı
sipariş takip = kullanıcı görünürlüğü
delivery = eligibility tetikleyicisi
return/refund = finansal düzeltme kaynağı
2. Sipariş sonrası actor modeli
Actor	Rol
Platform operations	fulfillment orchestration
Supplier	hazırlama/sevkiyat
Delivery/carrier	fiziksel teslimat
User	teslim alan taraf
Support	problem çözümü
Finance	refund/hakediş düzeltmesi
Risk/Fraud	abuse kontrolü
Admin/Operations Admin	escalation/override

Fenomen burada storefront owner’dır; fulfillment owner değildir.

3. Sipariş operasyon truth’u

Sipariş operasyon sistemi:

siparişi operasyon işine çevirir
supplier/depo ayrıştırması yapar
hazırlama kuyrukları üretir
shipment/paket akışı üretir
problemli akışları ayırır
escalation üretir

Sipariş operasyon sistemi kullanıcı ekranı değildir.
İç operasyon motorudur.

4. Sipariş operasyon lifecycle

Minimum operasyon lifecycle:

accepted_into_operations
split_by_supplier_or_package
awaiting_preparation
preparing
prepared
shipment_created
handover_pending
in_delivery_pipeline
delivery_problem
completed

Kritik ayrım:

internal operation status
≠
user-facing tracking status

Repo audit kırmızı çizgileri:

user raw operation states görüyorsa → HIGH RISK
supplier order truth mutate ediyorsa → DANGEROUS
shipment split yoksa → HIGH RISK
5. Paket / shipment truth’u

Sipariş ile shipment aynı şey değildir.

Kanonik yapı:

1 order
→ N packages/shipments
→ farklı supplier/depo/kargo olabilir

Bu kritik çünkü:

eligibility
delivery
return
review
story
settlement

satır/paket bazında çalışabilir.

Kargo/teslimat sistemi çok paketli yapının first-class citizen olduğunu açıkça söylüyor.

6. Delivery truth’u

Teslimat yalnız lojistik olay değildir.

Delivery:

eligibility trigger’dır
financial milestone’dur
risk boundary’sidir
review/story opening event’idir

Kritik event:

DELIVERED

şunları etkileyebilir:

review eligibility
story eligibility
reward pending
settlement progression
refund window
analytics signals
recommendation trust signals

Teslimat sistemi bu hakkın “ürün satırı bazında” açılabileceğini açıkça söyler.

7. Kullanıcı-facing tracking truth’u

Sipariş takip sistemi:

operational complexity’yi gizler
ama gerçeği saklamaz

Kullanıcıya:

hazırlanıyor
kargoya verildi
dağıtımda
teslim edildi
problem var

gibi anlaşılır state’ler gösterilir.

Ama:

internal queue
supplier routing
retry logic
operation escalation

doğrudan gösterilmez.

8. Cancellation truth’u

İptal her aşamada aynı çalışmaz.

İptal capability:

Stage	İptal davranışı
payment before order	payment rollback
order created/preparing	operational cancel
shipment created	restricted
delivered	artık return domain

Kritik kural:

cancel ≠ return

İptal teslimat öncesi ticari rollback’tir.
Return teslimat sonrası lifecycle’dır.

9. Return truth’u

İade sistemi yalnız para geri verme sistemi değildir.

İade:

financial correction
inventory correction
trust signal
review impact
reward reversal
settlement reversal
risk signal

üretir.

İade sistemi sipariş sisteminden ayrı lifecycle taşır.

10. Return lifecycle

Minimum return lifecycle:

requested
under_review
approved
rejected
awaiting_return_shipment
returned_to_warehouse
quality_check
refund_processing
completed
partially_completed

Kritik ayrım:

return approved
≠
refund completed

Repo audit kırmızı çizgileri:

refund immediate/no verification → P0
inventory correction yok → HIGH RISK
settlement reversal yok → P0
reward reversal yok → HIGH RISK
11. Refund truth’u

Refund payment değildir.

Refund:

financial correction execution

katmanıdır.

Refund şunlardan etkilenebilir:

partial return
coupon sponsor logic
platform-funded discounts
creator earnings
supplier earnings
shipping effects

Bu nedenle refund doğrudan settlement sistemine bağlıdır.

12. Review eligibility truth’u

Review yalnız:

login
+
purchased
+
delivered

olunca açılır.

Kritik:

review product-line based çalışmalı

Yani:

multi-package order’da
bir ürün teslim edildiyse
o ürün review açabilir

Tüm order’ın tamamlanması gerekmez.

13. User story eligibility truth’u

User product story:

delivered
+
product tagged
+
moderation approved

olmadan geçerli değildir.

Kritik kurallar:

story = social proof
story = moderated
story = product-bound
story ≠ free social upload

User story sistemi bunu net tanımlıyor.

14. Reward linkage truth’u

Reward sistemi:

delivery
→ review/story eligibility
→ moderation/risk verification
→ pending reward
→ vested/spendable

şeklinde çalışır.

Kritik:

reward immediate değil
eligibility chain dependent
15. Settlement linkage truth’u

Settlement şu event’lerden etkilenir:

payment success
delivery
return
refund
coupon sponsor
creator earnings
supplier earnings
risk blocks

Kritik:

payment captured
≠
earnings settled

Finansal mutabakat sistemi bu ayrımı özellikle kuruyor.

16. Support truth’u

Support:

social messaging değildir

Destek sistemi:

structured case management

mantığında çalışır.

Destek ticket sistemi:

classification
priority
routing
SLA
escalation
resolution tracking

taşır.

17. Support escalation truth’u

Support şu domainlere escalate edebilir:

operations
finance
moderation
risk
payment
shipment
return
supplier issue

Ama support:

truth owner değildir

Sadece vaka yönlendirir.

18. Operational invariants

Bozulmaması gereken kurallar:

order ≠ shipment
shipment ≠ delivery
delivery ≠ settlement
cancel ≠ return
return ≠ refund completion
review only after delivery
story only after delivery + moderation
reward only after valid contribution
support ≠ social messaging
operation status ≠ user-facing status
19. Repo audit checklist

Kontrol edilecek ilk kritik alanlar:

1. Shipment splitting var mı?
2. Multi-package order düzgün çalışıyor mu?
3. Delivery event gerçekten eligibility açıyor mu?
4. Review/story delivery öncesi açılabiliyor mu?
5. Reward moderation öncesi grant ediliyor mu?
6. Return ile refund ayrılmış mı?
7. Settlement reversal var mı?
8. Inventory correction var mı?
9. Tracking states user-safe mi?
10. Support SLA/escalation mantığı var mı?
11. Supplier shipment dışında order truth mutate ediyor mu?
12. Internal operation states kullanıcıya sızıyor mu?
20. Canonical operational flow
payment success
→ order created
→ operation intake
→ package/supplier split
→ preparation
→ shipment creation
→ handover
→ in transit
→ delivered
→ review/story eligibility
→ reward pending
→ settlement progression
→ return/refund if needed
→ correction/reversal if required
21. Bu paketin sonucu

Şu çıktı oluştu:

ORDER_OPERATIONS_DELIVERY_RETURN_TRUTH_v0.1

Bu çıktı repo audit sırasında şu alanlarda kullanılacak:

shipment splitting
delivery triggers
eligibility chains
refund logic
settlement correction
support escalation
operation vs tracking separation
reward gating