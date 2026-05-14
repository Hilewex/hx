FAZ-1 / PAKET-4
FINANCE / SETTLEMENT / PAYOUT / COUPON / REWARD ECONOMY TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platformun finans sistemi klasik “satış oldu → para dağıt” modeli değildir.

Kanonik gerçek:

payment
≠
settlement
≠
payout

Ayrıca:

discount
≠
coupon sponsor
≠
platform loss

ve:

reward point
≠
cash
≠
discount

Bu ayrımlar bozulursa sistem finansal olarak çöker.

2. Finans actor modeli
Actor	Rol
User	ödeme yapan taraf
Platform	merkezi finansal otorite
Creator/Fenomen	hakediş kazanan taraf
Supplier	ürün/hakediş tarafı
Finance Admin	finans operasyonu
Fraud/Risk	blok/review
Payment Provider	payment execution
Payout Provider	payout execution

Kritik:

creator/supplier
financial truth owner değildir

Hakediş alabilirler ama finans sistemini yönetemezler.

3. Payment truth’u

Payment sistemi:

user’dan para tahsil eder
başarılı/başarısız sonucu üretir

Ama:

payment
hakediş üretmez
payout üretmez
settlement finalize etmez

Payment yalnız finansal giriş kapısıdır.

4. Settlement truth’u

Settlement sistemi:

satışın finansal parçalanmasını üretir

Yani:

kim ne kadar hak etti?
kim ne kadar taşıdı?
hangi indirim kimden düştü?
hangi iade kimi etkiledi?

sorularını cevaplar.

Finansal mutabakat sistemi bunu açık tanımlıyor.

5. Settlement lifecycle

Minimum lifecycle:

pending
awaiting_delivery
partially_earned
earned
settled
blocked
reversed
partially_reversed

Kritik ayrım:

payment success
≠
settled earnings

Çünkü:

iade olabilir
fraud olabilir
delivery gerçekleşmeyebilir
shipment kaybolabilir
chargeback olabilir
6. Payout truth’u

Payout sistemi:

settled earnings
→ gerçek ödeme çıkışı

katmanıdır.

Payout sistemi:

batch
threshold
verification
retry
block
audit

yönetir.

Kritik:

settled
≠
paid_out
7. Payout lifecycle

Minimum payout lifecycle:

eligible
batched
processing
paid
failed
retrying
blocked
cancelled

Repo audit kırmızı çizgileri:

direct payout without settlement → P0
manual uncontrolled payout → P0
no audit trail → P0
8. Coupon truth’u

Kupon sistemi:

discount engine değildir
sponsor-aware promotion system’dir

En kritik soru:

indirimi kim taşıyor?

Kupon sistemi bunu özellikle vurguluyor.

9. Coupon sponsor truth’u

Minimum sponsor modelleri:

Model	Sponsor
Platform coupon	platform
Creator coupon	creator
Platform-supported creator coupon	shared
Shared coupon	multiple parties

Kritik:

discount amount
automatic creator loss değildir
10. Coupon application flow

Canonical flow:

cart
→ checkout validation
→ coupon eligibility validation
→ sponsor determination
→ discount calculation
→ financial split calculation
→ order snapshot
→ settlement impact

Kritik:

coupon applied at checkout
not arbitrary UI mutation
11. Campaign vs coupon truth’u

Kampanya:

platform-controlled commercial regime

Kupon:

conditional/sponsored discount mechanism

Aynı şey değiller.

12. Reward economy truth’u

Reward sistemi:

cashback değildir

Reward:

behavior incentive economy

katmanıdır.

İlk fazda reward yalnız:

review contribution
user product story contribution

üzerinden kazanılır.

13. Reward lifecycle

Minimum lifecycle:

pending
confirmed/vested
spendable
spent
cancelled
reversed
negative_balance

Kritik:

reward grant
≠
spendable balance
14. Reward eligibility truth’u

Reward grant için:

Action	Requirement
Review reward	delivered + valid review
Story reward	delivered + product-tagged + moderation-approved

Ek kontroller:

risk checks
duplicate detection
abuse checks
return window checks
15. Reward abuse truth’u

Fraud sistemi şu abuse alanlarını özellikle korumalı:

fake reviews
multi-account farming
fake story uploads
organized reward farming
return-after-reward abuse

Fraud sistemi reward abuse’u first-class risk alanı olarak tanımlıyor.

16. Reward reversal truth’u

Aşağıdaki durumlar reversal tetikleyebilir:

return/refund
fraud detection
moderation removal
duplicate/spam detection
policy violation

Kritik:

reward immutable değildir

Eligibility kaybedilirse geri alınabilir.

17. Reward market truth’u

Puan market:

normal commerce değildir

Ayrı ekonomi alanıdır.

Puan market:

point-based catalog

mantığında çalışır.

Kritik:

cash price
≠
reward market price
18. Reward market eligibility

User:

login
+
enough spendable points
+
active item
+
stock available
+
limit not exceeded

olmadan redemption yapamaz.

Pending puan kullanılamaz.

19. Financial invariants

Bozulmaması gereken kurallar:

payment ≠ settlement
settlement ≠ payout
captured money ≠ earned money
earned money ≠ paid money
coupon ≠ sponsor
reward ≠ cash
reward ≠ spendable immediately
creator/supplier ≠ finance owner
refund ≠ settlement reversal complete
20. Financial risk boundaries

P0 risk alanları:

duplicate payouts
duplicate settlements
payment/order mismatch
refund without correction
coupon sponsor corruption
negative earnings corruption
idempotency failure

HIGH risk alanları:

reward abuse
coupon abuse
creator earning miscalc
supplier earning miscalc
partial return correction failure
21. Financial event flow

Canonical flow:

payment success
→ order snapshot
→ settlement records created
→ delivery milestone
→ earnings progression
→ payout eligibility
→ payout batching
→ payout execution
→ audit recording

Return flow:

return approved
→ refund calculation
→ settlement reversal
→ earning correction
→ reward reevaluation
→ analytics/risk updates
22. Repo audit checklist

Kontrol edilecek kritik alanlar:

1. Payment/order idempotency var mı?
2. Settlement payment’tan ayrı mı?
3. Payout settlement’tan ayrı mı?
4. Coupon sponsor modeli doğru mu?
5. Creator earnings gerçek hesaplanıyor mu?
6. Supplier earnings doğru ayrılıyor mu?
7. Return sonrası correction çalışıyor mu?
8. Reward moderation/risk bağlı mı?
9. Spendable logic doğru mu?
10. Reward reversal var mı?
11. Payout audit trail var mı?
12. Finance admin bypass/direct payout yapabiliyor mu?
23. Canonical financial architecture
PAYMENT
↓
ORDER SNAPSHOT
↓
SETTLEMENT ENGINE
↓
DELIVERY/RETURN/RISK EFFECTS
↓
EARNINGS PROGRESSION
↓
PAYOUT ELIGIBILITY
↓
PAYOUT EXECUTION

Parallel:

REWARD CONTRIBUTION
↓
VALIDATION
↓
PENDING
↓
VESTED
↓
SPENDABLE
↓
REWARD MARKET
24. Bu paketin sonucu

Şu çıktı oluştu:

FINANCE_SETTLEMENT_PAYOUT_REWARD_TRUTH_v0.1

Bu çıktı repo audit sırasında özellikle şu alanlarda kullanılacak:

settlement integrity
coupon sponsor logic
reward lifecycle
payout safety
refund correction
financial idempotency
creator/supplier earnings
reward abuse protection