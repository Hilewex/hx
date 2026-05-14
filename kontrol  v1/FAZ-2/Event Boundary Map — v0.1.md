FAZ-2 / BÖLÜM-4
Event Boundary Map — v0.1

Bu bölümün amacı:

“Sistemde hangi olay neyi tetikler?”

Çünkü büyük platformlarda sistemler birbirine direkt bağlanmaz.

Onun yerine:

bir şey olur
→ event oluşur
→ ilgili sistemler tepki verir

Ama çok kritik:

her event herkesin her şeyi değiştirmesi anlamına gelmez
1. Basit mantık

Örnek:

ödeme başarılı oldu

Bu bir olaydır.

Sonra:

order sistemi sipariş oluşturur
finance settlement başlatır
analytics event kaydeder
notification bilgilendirme hazırlar

Ama:

recommendation sistemi order oluşturmaz
search sistemi payout hesaplamaz
2. Event türleri

Basitçe iki tür event vardır:

Tür	Anlam
Bilgi event’i	“bir şey oldu”
İş tetikleyici event	başka sistem aksiyon başlatır
3. En kritik commerce event’leri
PAYMENT_SUCCESS

Ne demek?

para başarıyla alındı

Kim tepki verir?

Sistem	Tepki
Order	sipariş oluşturur
Settlement	hakediş kaydı açar
Analytics	conversion event
Notification	sipariş bilgilendirme
Risk	fraud scoring

Kim tepki vermez?

search
taxonomy
creator storefront
ORDER_CREATED

Ne demek?

resmi sipariş oluştu

Kim tepki verir?

Sistem	Tepki
Operations	operasyon intake
Shipment	paketleme akışı
Analytics	commerce metrics
Reward	future eligibility preparation
Support	ticket context
DELIVERED

EN KRİTİK EVENT’LERDEN.

Ne açar?

Sistem	Tepki
Review	review eligibility
Story	user story eligibility
Reward	pending reward flow
Settlement	earnings progression
Analytics	successful fulfillment
Recommendation	trust signal

Ama:

delivery event
doğrudan spendable reward yazmamalı

Önce:

moderation
risk
validation

gerekebilir.

RETURN_APPROVED

Ne tetikler?

Sistem	Tepki
Refund	refund processing
Settlement	earning reversal
Reward	reward reevaluation
Inventory	stock correction
Analytics	return metrics
Risk	abuse scoring
MODERATION_HIDDEN

Ne tetikler?

Sistem	Tepki
Search	index removal
Recommendation	candidate removal
Feed	visibility stop
Analytics	moderation metrics

Ama:

moderation
product/order/payment truth’unu değiştirmez
RISK_BLOCKED

Ne tetikler?

Sistem	Tepki
Reward	freeze
Payout	hold
Moderation	escalation
Support	review case
4. Event sınırı kuralı

Bir sistem event aldı diye owner olmaz.

Örnek:

PaymentSucceeded event geldi

Bu:

Order sistemi order oluşturabilir

demek.

Ama:

Analytics sistemi order truth mutate edemez
5. Event vs command farkı

Çok önemli.

Event
bir şey oldu

Örnek:

PaymentSucceeded
OrderDelivered
ReviewPublished
Command
şunu yap

Örnek:

CreateOrder
GrantReward
ExecutePayout

Kural:

event bilgi verir
command aksiyon ister
6. Yanlış event mimarisi

Tehlikeli örnek:

PaymentSucceeded
→ 8 farklı sistem kendi order kaydını yaratıyor

Sonuç:

duplicate truth
corruption
inconsistency
7. Doğru event mimarisi

Doğru model:

PaymentSucceeded
→ Order owner order oluşturur
→ OrderCreated event yayınlanır
→ diğerleri projection/signal günceller
8. Event idempotency

Bazı event’ler tekrar gelebilir.

Özellikle:

payment callbacks
shipment updates
retry queues

Bu yüzden:

aynı event tekrar geldi diye
aynı order tekrar oluşmamalı
aynı payout tekrar çıkmamalı
aynı reward tekrar verilmemeli
9. Async boundary

Her şey senkron olmamalı.

Doğru:

Payment success
→ hızlı ACK
→ async downstream processing

Yanlış:

payment response içinde
10 sistem çalıştırmak
10. Event ownership
Event	Owner
PaymentSucceeded	Payment
OrderCreated	Order
ShipmentCreated	Operations
Delivered	Delivery
ReturnApproved	Return
RefundCompleted	Finance
RewardGranted	Reward
PayoutExecuted	Payout
ModerationHidden	Moderation
RiskBlocked	Risk
11. Event projection ilişkisi

Projection’lar event dinleyebilir.

Örnek:

ProductUpdated
→ search index update
→ product card projection refresh
→ recommendation candidate refresh

Ama:

search index
product owner değildir
12. Event replay kuralı

Bazı event’ler yeniden oynatılabilir.

Özellikle:

analytics rebuild
search reindex
projection rebuild

Bu yüzden:

event consumer replay-safe olmalı
13. Event riskleri

Repo audit’te arayacağımız riskler:

aynı event duplicate side effect üretiyor mu?
event kaybolunca sistem çöküyor mu?
cron workaround event yerine mi kullanılmış?
event consumer owner gibi davranıyor mu?
event replay duplicate payout/reward/order üretiyor mu?
14. Basit örnek zincir

Doğru commerce flow:

PaymentSucceeded
→ CreateOrder
→ OrderCreated
→ ShipmentPreparationStarted
→ ShipmentCreated
→ Delivered
→ ReviewEligibilityOpened
→ RewardPending
→ SettlementProgressed
15. Moderation event zinciri
StoryPublished
→ ModerationReviewStarted
→ StoryApproved
→ RecommendationEligible

veya:

StoryHidden
→ SearchRemoval
→ FeedRemoval
→ RecommendationRemoval
16. Risk event zinciri
AbnormalRewardPatternDetected
→ RiskScored
→ RewardFrozen
→ ManualReviewRequired
→ PayoutBlocked
17. Event boundary özeti
Event = bilgi
Command = aksiyon
Owner = gerçek değişikliği yapan
Projection = event sonrası güncellenen görünüm
18. Repo audit’te nasıl kullanılacak?

Şunlara bakacağız:

hangi event’ler var?
kim publish ediyor?
kim consume ediyor?
kim owner gibi davranıyor?
hangi event duplicate risk taşıyor?
event yerine sync hack kullanılmış mı?
cron ile sahte lifecycle kurulmuş mu?
19. FAZ-2 Bölüm-4 sonucu

Bu çıktı oluştu:

EVENT_BOUNDARY_MAP_v0.1