FAZ-1 / PAKET-6
SEARCH / RECOMMENDATION / ANALYTICS / RETRIEVAL / TAXONOMY TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platformda discovery sistemi yalnız “arama kutusu” değildir.

Kanonik gerçek:

discovery
=
search
+
retrieval
+
ranking
+
recommendation
+
social signals
+
commerce signals
+
taxonomy
+
analytics

Bu katman:

platform intelligence layer

olarak çalışır.

2. Discovery actor modeli
Actor	Rol
User	intent producer
Creator store	discovery source
Product catalog	retrieval source
Recommendation engine	candidate ranking
Search/retrieval engine	candidate generation
Analytics system	signal producer
Moderation/risk	filtering/safety
Taxonomy system	classification truth
3. Retrieval truth’u

Retrieval sistemi:

candidate generation layer

olarak çalışır.

Amaç:

hangi ürünler/mağazalar/içerikler aday olabilir?

sorusunu cevaplamaktır.

Kritik:

retrieval
≠
ranking
4. Search truth’u

Arama sistemi:

single search box
multiple retrieval strategies

mantığında çalışır.

Örnek:

Intent	Retrieval
Product search	catalog retrieval
Creator/store search	creator retrieval
Explore/video intent	discovery retrieval
Category intent	taxonomy retrieval

Arama dosyası tek search box olsa bile tek retrieval mantığı olmaması gerektiğini açıkça söylüyor.

5. Taxonomy truth’u

Taksonomi sistemi:

catalog classification truth

katmanıdır.

Taksonomi:

category tree
attribute families
filter structures
variant rules
retrieval mappings

üretir.

6. Taxonomy invariant’ları

Bozulmaması gereken kurallar:

category ≠ free text
taxonomy ≠ UI menu
campaign tags ≠ categories
variant rules taxonomy-bound olmalı
filter structure taxonomy-bound olmalı
7. Retrieval index truth’u

İndeks sistemi şunları indeksler:

products
variants
stores
categories
attributes
campaign tags
availability summaries
price summaries
media indicators

Ama:

retrieval truth owner değildir

Sadece:

searchable representation

üretir.

8. Recommendation truth’u

Recommendation sistemi:

candidate reranking + personalization layer

olarak çalışır.

Recommendation:

social signals
commerce signals
behavioral signals
quality signals
risk signals

birleşiminden beslenir.

9. Recommendation candidate sources

Minimum candidate kaynakları:

popular products
followed creators
engaged stores
similar products
taxonomy similarity
behavioral similarity
campaign boosts
video/story engagement
10. Ranking truth’u

Ranking sistemi:

raw popularity sorting değildir

Ranking:

quality
relevance
trust
freshness
inventory
conversion likelihood
engagement quality

sinyallerini birlikte kullanmalıdır.

11. Analytics truth’u

Analytics sistemi:

event garbage collector değildir

Kurallı signal production sistemidir.

Analytics:

behavior measurement
conversion measurement
quality scoring
recommendation signals
operational insights
risk signals

üretir.

12. Analytics katmanları

Canonical analytics layers:

raw events
↓
normalized events
↓
derived metrics
↓
decision signals

Bu ayrım analytics sisteminde explicit tanımlanmış.

13. Event normalization truth’u

Normalize event minimum şunları taşımalı:

event_name
actor_type
actor_id
surface
object_type
object_id
timestamp
session_id
context

Ham click yığını yeterli değildir.

14. Social signal weighting truth’u

Tüm interaction’lar eşit değildir.

Örnek:

Signal	Weight
View	düşük
Like	orta
Save	yüksek
Share	çok yüksek
Purchase	çok yüksek
Delivery	trust
Review quality	trust
Story completion	engagement quality

Kritik:

raw counts
≠
decision-quality signals
15. Risk filtering truth’u

Recommendation/retrieval şu sinyalleri filtrelemeli:

fake engagement
spam stores
abusive creators
fake reviews
reward farming
fraud traffic

Risk sistemi discovery katmanına sinyal üretir.

16. Moderation linkage truth’u

Moderation:

visibility authority

olduğu için:

hidden/restricted content
recommendation/retrieval candidate’ı olmamalı
17. Inventory linkage truth’u

Discovery yalnız relevance değil:

availability-aware

olmalıdır.

Örneğin:

out-of-stock product
high-rank candidate olmamalı
18. Commerce linkage truth’u

Recommendation:

engagement-only system değildir

Şunları optimize eder:

CTR
save rate
cart rate
checkout rate
conversion
retention
creator-store engagement
19. Search/filter truth’u

Facet/filter sistemi taxonomy-bound çalışmalıdır.

Örnek:

dress category
→ size/color/material filters

Ama:

kitchenware
→ volume/material/use-case filters

Bu taxonomy sistemi tarafından belirlenir.

20. Discovery invariants

Bozulmaması gereken kurallar:

retrieval ≠ ranking
ranking ≠ raw popularity
analytics ≠ raw logs
taxonomy ≠ UI labels
recommendation ≠ engagement sorting
moderated content ≠ eligible candidate
fraud signals ≠ ignored
21. Discovery risk boundaries

P0/P1 risk alanları:

recommendation poisoning
fake engagement boosting
spam creator amplification
taxonomy corruption
retrieval inconsistency
out-of-stock recommendation
hidden content leakage
22. Canonical discovery flow

Search flow:

query
→ retrieval
→ candidate generation
→ ranking
→ filtering
→ personalization
→ result rendering

Recommendation flow:

behavior signals
+
commerce signals
+
social signals
+
risk/moderation filters
↓
candidate generation
↓
ranking
↓
surface distribution

Analytics flow:

event
→ normalization
→ metric derivation
→ decision signals
→ recommendation/risk/admin usage
23. Repo audit checklist

Kontrol edilecek kritik alanlar:

1. Retrieval ile ranking ayrılmış mı?
2. Taxonomy canonical truth mu?
3. Filter system taxonomy-bound mı?
4. Recommendation raw likes’a mı bakıyor?
5. Fraud/moderation filtering var mı?
6. Analytics normalized event kullanıyor mu?
7. Hidden/restricted content discovery’ye düşüyor mu?
8. Out-of-stock ürünler rank oluyor mu?
9. Search single index kaosu mu?
10. Candidate generation ile ranking karışmış mı?
11. Store/product retrieval ayrılmış mı?
12. Analytics recommendation/risk sistemlerini besliyor mu?
24. Canonical intelligence architecture
USER BEHAVIOR
↓
ANALYTICS EVENTS
↓
NORMALIZED SIGNALS
↓
RECOMMENDATION / RISK / ADMIN SIGNALS
↓
RETRIEVAL CANDIDATES
↓
RANKING
↓
DISCOVERY SURFACES

Parallel:

TAXONOMY
↓
FILTERS
↓
RETRIEVAL STRUCTURE
↓
SEARCH EXPERIENCE
25. Bu paketin sonucu

Şu çıktı oluştu:

SEARCH_RECOMMENDATION_ANALYTICS_TAXONOMY_TRUTH_v0.1

Bu çıktı repo audit sırasında şu alanlarda kullanılacak:

retrieval/ranking separation
analytics normalization
taxonomy ownership
recommendation quality
fraud filtering
inventory-aware ranking
search architecture
candidate generation integrity