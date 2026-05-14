FAZ-1 / PAKET-7
MODERATION / FRAUD / TRUST / SAFETY / ADMIN GOVERNANCE TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platformda trust & safety sistemi “yan ekip” değildir.

Kanonik gerçek:

trust layer
=
commerce integrity layer

Çünkü:

fake engagement
fake reviews
coupon abuse
reward farming
fraud orders
spam creators

yalnız topluluğu değil:

conversion
recommendation quality
financial safety
brand trust
platform survivability

etkiler.

2. Trust actor modeli
Actor	Rol
Moderation	içerik/görünürlük enforcement
Fraud/Risk	davranışsal risk enforcement
Admin	governance authority
Finance Admin	finansal exception authority
Operations Admin	operasyonel escalation
User	report source
Creator	moderated publisher
Supplier	operational risk source
3. Moderation truth’u

Moderation sistemi:

visibility authority

katmanıdır.

Moderation:

hide
restrict
review
remove
strike
suspend
escalate

aksiyonları uygulayabilir.

Ama:

moderation
commerce truth owner değildir
4. Moderation scope truth’u

Moderation minimum şu yüzeyleri kapsar:

reviews
Q&A
stories
posts
creator content
user stories
profile/store identity
campaign media
5. Visibility state truth’u

İçerik lifecycle minimum:

active
under_review
restricted
hidden
removed
appealed
restored

Kritik:

removed content
recommendation/search candidate olamaz
6. Fraud/Risk truth’u

Fraud sistemi:

punishment engine değildir

Kanonik gerçek:

risk systems
signal → score → action

mantığında çalışır.

7. Risk lifecycle truth’u

Minimum risk flow:

signal_detected
↓
risk_scored
↓
watch
↓
restricted
↓
blocked/review
↓
resolved/escalated

Kritik:

every anomaly ≠ fraud
8. Risk domain’leri

Minimum risk aileleri:

Domain	Risk
Account	multi-account/fake signup
Coupon	coupon abuse
Reward	farming
Engagement	fake likes/follows
Commerce	fake orders
Return	abuse loops
Creator	manipulation
Supplier	quality fraud
Finance	payout abuse

Fraud sistemi bunları explicit tanımlıyor.

9. Multi-account truth’u

Platform:

identity abuse aware

olmalıdır.

Risk sinyalleri:

same device
same IP clusters
behavior similarity
coupon loops
reward farming
rapid account creation
10. Engagement fraud truth’u

Interaction sistemine güven:

unfiltered raw engagement

üzerinden kurulamaz.

Şunlar filtrelenmelidir:

bot likes
fake saves
engagement rings
follow spam
story farms
11. Commerce fraud truth’u

Risk sistemi commerce tarafında şunları izlemeli:

fake orders
refund abuse
coupon loops
creator earning manipulation
supplier manipulation
12. Reward fraud truth’u

Reward sistemi en kritik abuse yüzeylerinden biridir.

Risk alanları:

review spam
story farming
delivery-return exploitation
multi-account rewards
fake engagement for rewards

Kritik:

reward grant
must be risk-aware
13. Payout risk truth’u

Payout:

risk gated

olmalıdır.

Fraud sistemi şunları bloklayabilir:

suspicious creator payouts
supplier fraud payouts
abnormal earning spikes
identity verification failures
14. Admin governance truth’u

Admin sistemi:

god-mode panel değildir

Admin sistemi:

governed control layer

olarak çalışmalıdır.

15. Admin role separation truth’u

Admin tek rol değildir.

Minimum ayrımlar:

Role	Scope
Support Admin	support/tickets
Moderation Admin	content moderation
Commerce Admin	products/pricing
Finance Admin	settlement/payout
Operations Admin	shipment/ops
Risk Admin	fraud/risk
Super Admin	governance
16. Permission truth’u

Permission sistemi:

view permission
≠
action permission

ayrımı taşımalıdır.

Örnek:

can_view_payouts
≠
can_execute_payouts
17. Audit truth’u

Kritik admin aksiyonları audit log üretmelidir.

Minimum audit alanları:

actor
action
target
timestamp
reason
before_state
after_state
source

Kritik:

critical admin actions
must be reconstructable
18. Escalation truth’u

Escalation sistemi:

cross-domain safety bridge

olarak çalışır.

Örnek:

support
→ finance escalation

moderation
→ risk escalation

operations
→ fraud escalation
19. Governance boundary truth’u

Kritik boundary:

admin convenience
cannot bypass canonical truth

Örnek:

manual payout
manual delivery
manual settlement correction

kontrollü/auditli olmalıdır.

20. Soft vs hard enforcement truth’u

Platform:

graduated enforcement

kullanmalıdır.

Örnek:

Risk	Action
Low	watch
Medium	restriction
High	temporary block
Critical	suspension/escalation
21. Trust invariants

Bozulmaması gereken kurallar:

moderation ≠ commerce owner
fraud ≠ automatic punishment
hidden content ≠ searchable
risk signals ≠ ignored
reward ≠ trustless
payout ≠ ungated
admin ≠ unrestricted
critical actions ≠ unaudited
22. Trust risk boundaries

P0/P1 alanları:

unaudited payouts
admin bypass
hidden content leakage
reward farming
coupon abuse
fake engagement amplification
manual settlement corruption
risk-ignored payouts
23. Canonical trust architecture

Moderation flow:

content
→ moderation review
→ visibility decision
→ discovery eligibility

Fraud flow:

behavior signals
→ risk scoring
→ restrictions/escalation
→ downstream system effects

Governance flow:

admin action
→ permission validation
→ audit log
→ controlled execution
24. Repo audit checklist

Kontrol edilecek kritik alanlar:

1. Hidden content search/recommendation’da çıkıyor mu?
2. Reward sistemi risk-aware mı?
3. Coupon abuse detection var mı?
4. Multi-account detection var mı?
5. Admin direct DB write yapıyor mu?
6. Audit log kritik aksiyonları tutuyor mu?
7. Role separation var mı?
8. Permission/action ayrımı var mı?
9. Payout risk gate var mı?
10. Escalation flow’ları var mı?
11. Fake engagement filtering var mı?
12. Moderation visibility authority enforced mı?
25. Canonical trust & governance architecture
USER / CREATOR / SUPPLIER ACTIONS
↓
ANALYTICS + RISK SIGNALS
↓
FRAUD / MODERATION FILTERING
↓
VISIBILITY / RESTRICTION DECISIONS
↓
DISCOVERY / FINANCE / REWARD EFFECTS

Parallel:

ADMIN ACTION
↓
PERMISSION VALIDATION
↓
AUDIT LOGGING
↓
CONTROLLED EXECUTION
26. Bu paketin sonucu

Şu çıktı oluştu:

MODERATION_FRAUD_TRUST_GOVERNANCE_TRUTH_v0.1

Bu çıktı repo audit sırasında şu alanlarda kullanılacak:

auditability
permission integrity
risk-aware systems
moderation enforcement
fraud detection
reward protection
coupon abuse prevention
admin governance safety

Bir sonraki paket: