FAZ-1 / PAKET-5
SOCIAL / CREATOR / CONTENT / INTERACTION TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platformda sosyal katman “ek özellik” değildir.

Kanonik gerçek:

social layer
commerce conversion engine’dir

Yani:

story
video
creator store
interaction
follow
review
UGC

yalnız engagement üretmez:

trust
discovery
conversion
retention

üretir.

Bu nedenle sosyal sistemler second-class feature değildir.

2. Social actor modeli
Actor	Rol
User	tüketici + katkıcı
Creator/Fenomen	storefront + content producer
Platform	moderation + visibility authority
Recommendation engine	dağıtım/sıralama
Moderation	policy enforcement
Risk/Fraud	fake engagement kontrolü
3. Creator storefront truth’u

Fenomen mağazası:

catalog page değildir

Creator storefront:

commerce
+
identity
+
content
+
social proof
+
relationship surface

birleşimidir.

Bu yüzden mağaza:

story
post
featured products
interaction
follow graph
store personality

taşır.

4. Store context truth’u

Aynı ürün:

different creator context’lerde
farklı dönüşüm davranışı gösterebilir

Ama:

product truth değişmez

Bu kritik ayrım.

Mağaza:

context layer

ürün ise:

commerce truth layer
5. Follow graph truth’u

Takip sistemi:

social graph infrastructure

katmanıdır.

Takip:

story distribution
feed relevance
notification eligibility
engagement weighting
recommendation signals

üretir.

Kritik:

follow ≠ friendship

Bu creator-centric graph’tır.

6. Interaction truth’u

Interaction sistemi:

like
save
share
view
click
completion

gibi sinyalleri taşır.

Ama bunlar yalnız sayaç değildir.

Interaction:

recommendation signals
quality signals
trust signals
commercial intent signals

üretir.

7. Like/save/share ayrımı
Interaction	Anlam
Like	düşük maliyetli ilgi
Save	yüksek intent
Share	dağıtım/virality
Product click	ticari niyet
Story completion	içerik kalitesi
Follow	uzun dönem ilişki

Kritik:

all engagement signals are not equal
8. Story truth’u

Story sistemi:

ephemeral commerce + social proof surface

olarak çalışır.

Story:

creator stories
product stories
user product stories

olarak ayrılır.

9. Creator story truth’u

Creator story:

store/identity/content amplification

amaçlıdır.

Destekleyebilir:

product tagging
store linking
campaign linking
swipe/click-through

Ama:

story global product truth’u değiştirmez
10. User product story truth’u

User product story:

verified social proof

katmanıdır.

Şartlar:

purchased
+
delivered
+
product tagged
+
moderation approved

User story sistemi bunu explicit tanımlıyor.

11. Story moderation truth’u

Story:

free upload değildir

Moderation gerekir.

Risk alanları:

copyright
spam
fake reviews
illegal promotion
abuse
NSFW
off-platform selling
12. Post system truth’u

Post sistemi:

longer-lived creator content surface

olarak çalışır.

Post:

store updates
recommendations
curation
education
promotion
community building

amaçlı olabilir.

13. Review truth’u

Review sistemi:

verified purchase social proof

katmanıdır.

Review:

rating
comment
quality feedback
conversion trust

üretir.

Kritik:

review eligibility delivery-based’tir
14. Q&A truth’u

Soru-cevap sistemi:

structured commerce information layer

olarak çalışır.

Q&A:

discussion forum değildir

Amaç:

product clarification
purchase confidence
structured information

üretmektir.

15. Creator authority boundary

Creator şunları yapabilir:

story
post
curation
recommendation
store arrangement
community interaction

Creator şunları yapamaz:

official product truth mutation
stock mutation
shipment authority
payment authority
review deletion
moderation bypass
16. Moderation truth’u

Moderation sistemi:

visibility authority

katmanıdır.

Moderation:

hide
restrict
remove
review
escalate
strike
suspend

yapabilir.

Ama:

moderation commerce truth owner değildir
17. Engagement abuse truth’u

Risk sistemi özellikle şunları korumalı:

fake followers
bot likes
engagement rings
fake saves
spam comments
story farming
fake creator engagement

Fraud/risk sistemi bunları ayrı risk ailesi olarak tanımlıyor.

18. Recommendation linkage truth’u

Social signals recommendation engine’i besler:

follow
save
share
story completion
product click
review quality
store engagement

Ama:

raw engagement
≠
ranking eligibility

Kalite/risk filtreleri gerekir.

19. Notification linkage truth’u

Takip ve interaction şunları tetikleyebilir:

new story
new post
campaign
product drop
delivery/review eligibility
reward updates

Ama:

notification
spam channel değildir
20. Social graph invariants

Bozulmaması gereken kurallar:

creator store ≠ catalog page
story ≠ free media upload
review ≠ anonymous comment
follow ≠ friendship graph
interaction ≠ simple counters
creator ≠ commerce truth owner
moderation ≠ commerce owner
user story ≠ unverified upload
engagement ≠ ranking truth directly
21. Social risk boundaries

P0/P1 risk alanları:

fake reviews
fake creator engagement
story abuse
off-platform selling
moderation bypass
review spam
engagement manipulation
reward farming
22. Canonical social flow

Creator flow:

creator approved
→ store active
→ products curated
→ stories/posts published
→ followers engage
→ recommendation signals generated
→ commerce conversion

User contribution flow:

purchase
→ delivery
→ review/story eligibility
→ moderation/risk checks
→ publication
→ engagement/recommendation effects
→ reward progression
23. Repo audit checklist

Kontrol edilecek kritik alanlar:

1. Creator store catalog page’e indirgenmiş mi?
2. Product truth ile store context ayrılmış mı?
3. Story moderation var mı?
4. User story verified purchase bağlı mı?
5. Review delivery sonrası mı açılıyor?
6. Q&A structured mı?
7. Creator official product truth mutate edebiliyor mu?
8. Fake engagement protection var mı?
9. Recommendation raw counters’a mı bakıyor?
10. Moderation visibility authority çalışıyor mu?
11. Follow graph recommendation’a bağlı mı?
12. Interaction analytics/recommendation sinyali üretiyor mu?
24. Canonical social architecture
CREATOR STORE
↓
CONTENT SURFACES
(story/post/video)
↓
FOLLOW + INTERACTION GRAPH
↓
ENGAGEMENT SIGNALS
↓
RECOMMENDATION / DISCOVERY
↓
COMMERCE CONVERSION

Parallel:

PURCHASE
↓
DELIVERY
↓
VERIFIED REVIEW/STORY
↓
SOCIAL PROOF
↓
TRUST SIGNALS
↓
CONVERSION EFFECT
25. Bu paketin sonucu

Şu çıktı oluştu:

SOCIAL_CREATOR_CONTENT_INTERACTION_TRUTH_v0.1

Bu çıktı repo audit sırasında şu alanlarda kullanılacak:

creator/store boundaries
story/review eligibility
social proof integrity
interaction quality
recommendation inputs
moderation enforcement
fake engagement protection
verified contribution flows