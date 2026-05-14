FAZ-1 / PAKET-8
MEDIA / INFRASTRUCTURE / ASSET PROCESSING / PLATFORM OPERABILITY TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platformda medya sistemi yalnız “dosya yükleme” değildir.

Kanonik gerçek:

media
=
platform infrastructure layer

Çünkü platform:

story
video cards
creator posts
product visuals
UGC
campaign media
store identity

üzerine kurulu.

Bu nedenle medya:

commerce critical infrastructure

olarak ele alınmalıdır.

2. Media actor modeli
Actor	Rol
Supplier	resmi ürün medyası kaynağı
Creator	mağaza/context medyası
User	verified UGC
Platform	processing + moderation authority
Media pipeline	transformation/distribution
Moderation	visibility eligibility
Retrieval/recommendation	media-aware discovery
3. Media truth’u

Media sistemi:

raw file storage değildir

Media pipeline:

validation
processing
transformation
optimization
distribution
lifecycle management

yapar.

4. Media ownership truth’u

Kritik ayrım:

Media Type	Owner
Official product media	platform/pool truth
Creator store media	creator context
User story media	user-generated verified layer
Campaign media	platform
Review media	verified contribution
5. Global vs contextual media truth’u

En kritik mimari ayrımlardan biri:

global media truth
≠
creator contextual media

Örnek:

same product
different creator videos

olabilir.

Ama:

official product media
canonical truth’tur

Media sistemi bunu explicit tanımlıyor.

6. Media processing truth’u

Her yüklenen medya:

publish-ready değildir

Pipeline:

validation
→ transformation
→ optimization
→ moderation eligibility
→ distribution

şeklinde çalışır.

7. Validation truth’u

Minimum validation alanları:

file type
codec
resolution
duration
size
corruption
security scan
policy validation
8. Transformation truth’u

Pipeline şunları üretebilir:

thumbnails
preview clips
compressed versions
mobile variants
streamable variants
different aspect ratios

Kritik:

surfaces consume derivatives
not raw uploads
9. Surface-aware media truth’u

Farklı yüzeyler farklı medya davranışı ister:

Surface	Media Need
Story	vertical/fast-loading
PDP	detail/high-quality
Product card	lightweight preview
Explore/video feed	streaming optimized
Store cover	branding optimized

Bu yüzden:

single media output
≠
all surfaces
10. Video truth’u

Video sistemi:

first-class discovery object

olarak çalışır.

Video:

engagement
commerce conversion
recommendation signals
creator identity

üretir.

11. Story media truth’u

Story medya:

ephemeral + high-distribution

karakterlidir.

Bu yüzden:

latency
compression
mobile optimization

kritik hale gelir.

12. Moderation linkage truth’u

Media:

moderation-gated

olmalıdır.

Örnek riskler:

copyright
illegal products
NSFW
spam
off-platform promotion
fake creator content
13. Media lifecycle truth’u

Minimum lifecycle:

uploaded
processing
validated
moderation_review
active
restricted
deleted
archived

Kritik:

uploaded
≠
active
14. Asset identity truth’u

Her media asset:

stable identity

taşımalıdır.

Minimum metadata:

asset_id
owner_type
owner_id
media_type
source
processing_status
visibility_status
variants
timestamps
15. Media & recommendation linkage

Recommendation sistemi medya-aware çalışmalıdır.

Örnek sinyaller:

video completion
story completion
rewatch
tap-through
save-after-watch
product-click-after-watch
16. Media & analytics truth’u

Analytics sistemi medya için şunları ölçmeli:

play
completion
drop-off
tap-through
share
save
conversion after watch

Kritik:

view count alone
≠
quality signal
17. Media & retrieval truth’u

Retrieval sistemi:

media-aware indexing

desteklemelidir.

Örnek:

video-enabled products
story-active creators
rich-media products
18. Infrastructure truth’u

Platform operability:

first-class architecture concern

olmalıdır.

Yani:

queues
retries
dead letters
idempotency
observability
monitoring

tasarımın parçası olmalı.

19. Idempotency truth’u

Kritik sistemler:

payment
settlement
reward
shipment
media processing
notification

idempotent çalışmalıdır.

20. Queue/retry truth’u

Async sistemlerde:

retry-safe

tasarım gerekir.

Kritik:

retry
≠
duplicate side effects
21. Observability truth’u

Platform:

observable

olmalıdır.

Minimum:

metrics
logs
traces
audit logs
risk signals
queue visibility
processing failures
22. Operational reliability truth’u

Kritik commerce/social event’ler:

payment success
delivery
reward grant
settlement updates
moderation actions

izlenebilir olmalıdır.

23. Reliability invariants

Bozulmaması gereken kurallar:

uploaded media ≠ active media
raw upload ≠ distributed asset
creator media ≠ official product media
single derivative ≠ all surfaces
async retry ≠ duplicate effects
video ≠ cosmetic feature
observability ≠ optional
24. Infrastructure risk boundaries

P0/P1 risk alanları:

duplicate async processing
broken idempotency
media leakage
unmoderated media distribution
processing deadlocks
missing observability
queue loss
retry corruption
25. Canonical media architecture
UPLOAD
↓
VALIDATION
↓
PROCESSING
↓
DERIVATIVE GENERATION
↓
MODERATION ELIGIBILITY
↓
DISTRIBUTION
↓
ANALYTICS + RECOMMENDATION SIGNALS

Infrastructure layer:

EVENTS
↓
QUEUES
↓
RETRY/IDEMPOTENCY
↓
OBSERVABILITY
↓
AUDITABILITY
26. Repo audit checklist

Kontrol edilecek kritik alanlar:

1. Global vs creator media ayrılmış mı?
2. Raw upload doğrudan yayınlanıyor mu?
3. Media moderation var mı?
4. Surface-specific derivatives var mı?
5. Video pipeline gerçek mi?
6. Async jobs idempotent mi?
7. Retry duplicate side effect üretiyor mu?
8. Queue visibility var mı?
9. Observability stack var mı?
10. Media analytics ölçülüyor mu?
11. Media recommendation signals üretiyor mu?
12. Uploaded ≠ active lifecycle korunuyor mu?
27. Bu paketin sonucu

Şu çıktı oluştu:

MEDIA_INFRASTRUCTURE_OPERABILITY_TRUTH_v0.1

Bu çıktı repo audit sırasında şu alanlarda kullanılacak:

media ownership
asset lifecycle
async reliability
idempotency
queue safety
observability
media processing integrity
distribution correctness
28. FAZ-1 DURUMU

Şu an canonical truth extraction kapsamında:

✅ Core foundations
✅ Commerce core
✅ Operations/delivery/return
✅ Finance/settlement/reward
✅ Social/creator/content
✅ Search/recommendation/analytics
✅ Moderation/fraud/governance
✅ Media/infrastructure

çıkarılmış durumda.