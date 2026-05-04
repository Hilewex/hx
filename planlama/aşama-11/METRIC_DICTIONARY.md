# METRIC_DICTIONARY

## 1. Amaç

Bu dosya, platform genelinde kullanılan ölçüm, KPI ve decision signal dilini tek doğrulu, uygulanabilir ve çakışmasız sözlüğe dönüştürür.

Bu dosyanın amacı:

* hangi ölçümün resmi metric sayılacağını sabitlemek
* raw count, derived metric, quality metric ve decision signal katmanlarını sert biçimde ayırmak
* surface, funnel, kalite, operasyon, güven ve finans metriklerini ortak canonical dilde toplamak
* analytics, ranking, risk, admin ve ürün kararlarında aynı metric sözlüğünü kullandırmaktır

Net kural:

* Her sayaç karar metriği değildir
* Her KPI decision signal değildir
* Metric bağlamsız ham event sayımı değildir
* Preview state ile final outcome aynı metriğe yazılmaz
* Unknown-result, duplicate ve correction etkileri başarı metriklerine sessizce karışmaz

---

## 2. Kapsam

Bu sözlük ilk fazda aşağıdaki metric ailelerini kapsar:

1. acquisition / navigation metrikleri
2. search / retrieval / ranking metrikleri
3. content consumption metrikleri
4. PDP ve trust metrikleri
5. commerce funnel metrikleri
6. shipment / delivery / return metrikleri
7. UGC ve contribution metrikleri
8. creator / store kalite metrikleri
9. supplier / operasyon kalite metrikleri
10. coupon / reward / point market metrikleri
11. moderation / risk metrikleri
12. finance / settlement / payout metrikleri
13. decision signal sözlüğü

Bu dosya aşağıdaki alanları bilinçli olarak detaylandırmaz:

* dashboard layout
* alert threshold matrisi
* model training feature store şeması
* A/B test deney isimlendirme standardı

---

## 3. Metric katman modeli

### MT-001 — Raw count metric

Ham event sayımı veya en basit aggregation’dır.

Örnek:

* `search_submit_count`
* `pdp_open_count`
* `add_to_cart_count`

### MT-002 — Derived ratio / duration metric

Ham event’lerden türetilen oran, süre veya dağılım metriğidir.

Örnek:

* `search_to_pdp_rate`
* `story_completion_rate`
* `payment_success_rate`
* `time_to_delivered`

### MT-003 — Quality metric

Bir alanın güvenilirlik, kalite veya operasyonel düzgünlük görünümünü verir.

Örnek:

* `supplier_on_time_ship_rate`
* `review_verified_ratio`
* `moderation_approval_rate`

### MT-004 — Decision signal

Ranking, fraud, moderation, admin veya diğer karar sistemlerini besleyen anlamlı sinyal katmanıdır.

Örnek:

* `product_interest_signal`
* `creator_quality_signal`
* `fraud_coupon_abuse_signal`

Net kural:

* Raw count metric KPI olmak zorunda değildir
* Derived metric dashboard metriği olabilir ama signal olmak zorunda değildir
* Signal ile business KPI aynı kavram değildir

---

## 4. Temel ilkeler

### MD-001 — Metric bağlamlı olmalıdır

**Binding Rule:** Surface, actor, object, zaman penceresi veya funnel bağlamı olmayan ölçüm canonical metric sayılmaz.

### MD-002 — Event count ile derived metric ayrıdır

**Binding Rule:** Impression sayısı ham ölçüdür; CTR, completion rate ve conversion rate derived metric’tir.

### MD-003 — Derived metric ile decision signal ayrıdır

**Binding Rule:** `story_completion_rate` metric’tir; `content_quality_signal` karar sistemini besleyen signal’dır.

### MD-004 — Rate metric’lerinde numerator ve denominator zorunludur

**Binding Rule:** Oran metrikleri pay ve payda açık olmadan canonical kabul edilmez.

### MD-005 — Preview ve final outcome aynı metric’e karışmaz

**Binding Rule:** Coupon preview, optimistic interaction veya cart preview sonucu ile checkout/order final sonucu ayrı ölçülür.

### MD-006 — Unknown-result first-class metric caveat’ıdır

**Binding Rule:** Payment, payout ve benzeri alanlarda unknown-result başarı metriklerine sessizce karışmaz; ayrı oran veya exclusion olarak izlenir.

### MD-007 — Duplicate ve correction etkileri metric’te görünür olmalıdır

**Binding Rule:** Duplicate_ignored, reconciled veya corrected akışlar başarı metriğine ham biçimde ikinci kez yazılmaz.

---

## 5. Canonical metric şeması

Her metric en az şu alanları taşır:

* `metric_name`
* `metric_family`
* `metric_type` (`count`, `rate`, `duration`, `distribution`, `score`, `signal`)
* `definition`
* `numerator` gerekiyorsa
* `denominator` gerekiyorsa
* `aggregation_window`
* `grain`
* `source_events`
* `exclusions_or_caveats`
* `owner_consumer`

Net kural:

* Tanımı olmayan metric canonical değildir
* Grain belirtilmeden karşılaştırma yapılmaz
* Aynı isim farklı anlam taşıyamaz
* KPI, metric adının kendisi değil kullanım bağlamıdır

---

## 6. Acquisition / navigation metric ailesi

### MD-010 — `surface_open_count`

**Family:** navigation
**Type:** count
**Definition:** Belirli surface’in açılma sayısı.
**Grain:** surface / day / platform
**Source events:** `home_opened`, `discover_opened`, `category_opened`, `store_surface_opened`, `pdp_opened`

### MD-011 — `surface_return_rate`

**Family:** navigation
**Type:** rate
**Definition:** Belirli pencere içinde aynı surface’e geri dönen actor/session oranı.
**Numerator:** tekrar açılış yapan benzersiz actor/session
**Denominator:** surface’i en az 1 kez açan benzersiz actor/session

### MD-012 — `surface_degraded_render_rate`

**Family:** navigation
**Type:** rate
**Definition:** Belirli surface’in degraded durumda render edilme oranı.
**Source events:** `surface_degraded_rendered`

### MD-013 — `store_entry_rate_from_surface`

**Family:** navigation
**Type:** rate
**Definition:** Belirli surface’ten store surface’e geçiş oranı.

---

## 7. Search / retrieval / ranking metric ailesi

### MD-020 — `search_submit_count`

**Family:** search
**Type:** count
**Definition:** Belirli search mode’da submit edilen arama sayısı.
**Source events:** `search_submitted`

### MD-021 — `search_result_click_rate`

**Family:** search
**Type:** rate
**Definition:** Sonuç dönen aramalarda en az bir result click üreten arama oranı.
**Numerator:** result click üreten search session
**Denominator:** sonuç dönen search session

### MD-022 — `search_to_pdp_rate`

**Family:** search
**Type:** rate
**Definition:** Search submit sonrası PDP açılışına dönen arama oranı.
**Source events:** `search_submitted`, `search_result_clicked`, `pdp_opened`

### MD-023 — `search_no_result_rate`

**Family:** search
**Type:** rate
**Definition:** No-result dönen arama oranı.
**Source events:** `search_no_result_returned`

### MD-024 — `search_degraded_rate`

**Family:** search
**Type:** rate
**Definition:** Degraded sonuç dönen arama oranı.
**Source events:** `search_degraded_returned`

### MD-025 — `retrieval_candidate_count`

**Family:** retrieval
**Type:** distribution
**Definition:** Query başına üretilen candidate set büyüklüğü.
**Source events:** `retrieval_candidates_generated`

### MD-026 — `facet_generation_success_rate`

**Family:** retrieval
**Type:** rate
**Definition:** Facet beklenen aramalarda canonical facet üretim başarısı.

### MD-027 — `ranking_applied_rate`

**Family:** ranking
**Type:** rate
**Definition:** Candidate dönen isteklerde final ranking uygulanan oran.

### MD-028 — `fallback_ranking_rate`

**Family:** ranking
**Type:** rate
**Definition:** Standart ranking yerine fallback ranking uygulanan istek oranı.

### MD-029 — `search_result_conversion_rate`

**Family:** search_commerce
**Type:** rate
**Definition:** Search kaynaklı PDP/result click’ten order_created’a dönen oran.
**Caveat:** unknown_result payment order_created içine sayılmaz

### MD-030 — `ranking_quality_signal`

**Family:** ranking_signal
**Type:** signal
**Definition:** CTR, conversion, return penalty, stock fit ve suppression etkilerinden türetilen ranking karar sinyali.
**Owner consumer:** ranking / reranking systems

Net kural:

* Search metric ile retrieval metric aynı family altında ezilmez
* Retrieval metric ile ranking metric aynı owner consumer varsayımına dayanmaz

---

## 8. Content consumption metric ailesi

### MD-040 — `story_open_count`

**Family:** content_consumption
**Type:** count
**Definition:** Story açılma sayısı.

### MD-041 — `story_completion_rate`

**Family:** content_consumption
**Type:** rate
**Definition:** Açılan story’lerde tamamlanan story oranı.
**Numerator:** `story_completed`
**Denominator:** `story_opened`

### MD-042 — `story_early_exit_rate`

**Family:** content_consumption
**Type:** rate
**Definition:** Story tamamlanmadan erken kapanan oturum oranı.

### MD-043 — `story_to_pdp_click_rate`

**Family:** content_commerce
**Type:** rate
**Definition:** Story consumption sonrası PDP tıklama oranı.

### MD-044 — `video_play_start_rate`

**Family:** content_consumption
**Type:** rate
**Definition:** Impression alan video kartlarda oynatma başlayan oran.

### MD-045 — `video_completion_rate`

**Family:** content_consumption
**Type:** rate
**Definition:** Başlayan videolarda completion oranı.

### MD-046 — `video_to_pdp_click_rate`

**Family:** content_commerce
**Type:** rate
**Definition:** Video consumption sonrası PDP geçiş oranı.

### MD-047 — `post_to_store_rate`

**Family:** content_store
**Type:** rate
**Definition:** Post impression/click sonrası store ziyareti oranı.

### MD-048 — `content_quality_signal`

**Family:** content_signal
**Type:** signal
**Definition:** Completion, engagement, PDP/store conversion, report rate ve moderation-safe oranından türetilen içerik kalite sinyali.

---

## 9. PDP ve trust metric ailesi

### MD-050 — `pdp_open_count`

**Family:** pdp
**Type:** count
**Definition:** PDP açılış sayısı.

### MD-051 — `variant_selection_rate`

**Family:** pdp_commerce
**Type:** rate
**Definition:** PDP açılışlarında varyant seçimine geçen oran.

### MD-052 — `pdp_to_add_to_cart_rate`

**Family:** pdp_commerce
**Type:** rate
**Definition:** PDP açılışlarından add_to_cart_completed oranı.

### MD-053 — `review_block_open_rate`

**Family:** pdp_trust
**Type:** rate
**Definition:** PDP’de review katmanını açan oturum oranı.

### MD-054 — `qa_block_open_rate`

**Family:** pdp_trust
**Type:** rate
**Definition:** PDP’de Q&A katmanını açan oturum oranı.

### MD-055 — `user_story_block_open_rate`

**Family:** pdp_trust
**Type:** rate
**Definition:** PDP’de user product story strip etkileşimi oranı.

### MD-056 — `review_verified_ratio`

**Family:** trust
**Type:** rate
**Definition:** Görünür review’ler içinde verified purchase trust bağlamı taşıyan oran.

### MD-057 — `trust_content_engagement_rate`

**Family:** trust
**Type:** rate
**Definition:** Review/Q&A/user story katmanlarına etkileşim veren PDP oturumu oranı.

---

## 10. Commerce funnel metric ailesi

### MD-060 — `product_impression_to_pdp_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Product impression sonrası PDP enter oranı.

### MD-061 — `pdp_to_add_to_cart_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** PDP enter sonrası add_to_cart_completed oranı.

### MD-062 — `add_to_cart_to_checkout_start_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Add_to_cart sonrası checkout_started oranı.

### MD-063 — `checkout_address_completion_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Checkout_started akışlarında address_completed oranı.

### MD-064 — `checkout_ready_for_payment_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Checkout_started akışlarında ready_for_payment üretme oranı.

### MD-065 — `payment_initiation_rate`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Ready_for_payment bağlamlarında payment_initiated oranı.

### MD-066 — `payment_success_rate`

**Family:** payment_quality
**Type:** rate
**Definition:** Payment_initiated akışlarında payment_confirmed oranı.
**Exclusions / caveats:** `unknown_result` success’e dahil edilmez; ayrı izlenir

### MD-067 — `payment_unknown_result_rate`

**Family:** payment_quality
**Type:** rate
**Definition:** Payment_initiated akışlarında unknown_result oranı.

### MD-068 — `order_create_rate_after_payment`

**Family:** commerce_funnel
**Type:** rate
**Definition:** Payment_confirmed sonrası order_created oranı.

### MD-069 — `cart_drift_warning_rate`

**Family:** cart_quality
**Type:** rate
**Definition:** Cart/checkout sırasında price, stock veya variant drift uyarısı gören akış oranı.

### MD-070 — `guest_checkout_share`

**Family:** commerce_context
**Type:** rate
**Definition:** Tüm checkout başlangıçları içinde guest context payı.

Net kural:

* `ready_for_payment`, `payment_confirmed` ve `order_created` tek conversion metriğinde ezilmez
* Guest commerce payı ayrı context metriğidir, başarı metriği değildir

---

## 11. Shipment / delivery / return metric ailesi

### MD-080 — `shipment_created_count`

**Family:** logistics
**Type:** count
**Definition:** Oluşturulan shipment sayısı.

### MD-081 — `delivery_success_rate`

**Family:** logistics
**Type:** rate
**Definition:** Shipped/in_transit paketlerde delivered sonuca ulaşma oranı.

### MD-082 — `delivery_failure_rate`

**Family:** logistics
**Type:** rate
**Definition:** Delivery_failed veya eşdeğer problem sonucu oranı.

### MD-083 — `time_to_delivered`

**Family:** logistics
**Type:** duration
**Definition:** Order_created veya shipment_created sonrası delivered süresi.

### MD-084 — `entitlement_open_rate_after_delivery`

**Family:** post_delivery
**Type:** rate
**Definition:** Delivered line’larda review/story entitlement açılma oranı.

### MD-085 — `return_request_rate`

**Family:** post_order
**Type:** rate
**Definition:** Delivered line’lar içinde return_requested oranı.

### MD-086 — `return_approval_rate`

**Family:** post_order
**Type:** rate
**Definition:** Açılan return request’lerde approval oranı.

### MD-087 — `refund_completion_rate`

**Family:** refund
**Type:** rate
**Definition:** Refund_started akışlarında refund_completed oranı.

---

## 12. UGC ve contribution metric ailesi

### MD-090 — `review_create_rate_after_entitlement`

**Family:** ugc
**Type:** rate
**Definition:** Review entitlement açılan line’larda review_created oranı.

### MD-091 — `story_create_rate_after_entitlement`

**Family:** ugc
**Type:** rate
**Definition:** Story entitlement açılan line’larda user_product_story_submitted oranı.

### MD-092 — `review_publish_rate`

**Family:** ugc_quality
**Type:** rate
**Definition:** Review create sonrası visible/published hale geçen oran.

### MD-093 — `story_publish_rate`

**Family:** ugc_quality
**Type:** rate
**Definition:** User product story submit sonrası visible/published hale geçen oran.

### MD-094 — `question_submit_rate`

**Family:** ugc
**Type:** rate
**Definition:** PDP oturumları içinde question_submitted oranı.

### MD-095 — `question_publish_rate`

**Family:** ugc_quality
**Type:** rate
**Definition:** Question submit sonrası published/visible hale geçen oran.

### MD-096 — `ugc_takedown_rate`

**Family:** moderation_ugc
**Type:** rate
**Definition:** Visible UGC içeriğinde sonradan restricted/taken_down hale gelen oran.

### MD-097 — `reward_earning_rate`

**Family:** reward
**Type:** rate
**Definition:** Eligible UGC katkılarında reward_pending_created oranı.

### MD-098 — `reward_spendable_conversion_rate`

**Family:** reward
**Type:** rate
**Definition:** Pending/vested reward kayıtlarında spendable’a dönen oran.

Net kural:

* Create ile publish aynı metric değildir
* Publish ile visible-safe aynı metric değildir gerektiğinde ayrılaştırılabilir
* Reward earning ile reward spend aynı metric değildir

---

## 13. Creator / store kalite metric ailesi

### MD-110 — `store_visit_count`

**Family:** creator_store
**Type:** count
**Definition:** Store visit sayısı.

### MD-111 — `store_to_pdp_rate`

**Family:** creator_store
**Type:** rate
**Definition:** Store visit sonrası PDP geçiş oranı.

### MD-112 — `store_to_follow_rate`

**Family:** creator_store
**Type:** rate
**Definition:** Store visit sonrası follow_completed oranı.

### MD-113 — `store_to_order_rate`

**Family:** creator_store
**Type:** rate
**Definition:** Store kaynaklı akışlarda order_created oranı.

### MD-114 — `creator_coupon_conversion_rate`

**Family:** creator_commerce
**Type:** rate
**Definition:** Creator coupon apply success sonrası order_created oranı.

### MD-115 — `creator_quality_signal`

**Family:** creator_signal
**Type:** signal
**Definition:** Conversion, return penalty, moderation-safe oranı, trust content kalitesi ve risk sinyallerinden türetilen creator kalite sinyali.

---

## 14. Supplier / operasyon kalite metric ailesi

### MD-120 — `supplier_acceptance_rate`

**Family:** supplier_quality
**Type:** rate
**Definition:** Supplier ürün girişlerinde kabul oranı.

### MD-121 — `supplier_stock_reliability_rate`

**Family:** supplier_quality
**Type:** rate
**Definition:** Listed availability ile checkout/order anı availability uyumu oranı.

### MD-122 — `supplier_on_time_ship_rate`

**Family:** supplier_quality
**Type:** rate
**Definition:** Beklenen zaman penceresinde shipped olan operasyon oranı.

### MD-123 — `supplier_return_problem_rate`

**Family:** supplier_quality
**Type:** rate
**Definition:** Supplier kaynaklı problem/return oranı.

### MD-124 — `supplier_reliability_signal`

**Family:** supplier_signal
**Type:** signal
**Definition:** Acceptance, stock reliability, ship performance ve return penalty’den türetilen supplier güvenilirlik sinyali.

---

## 15. Coupon / reward / point market metric ailesi

### MD-130 — `coupon_apply_success_rate`

**Family:** promotion
**Type:** rate
**Definition:** Coupon apply denemelerinde success oranı.

### MD-131 — `coupon_reject_rate`

**Family:** promotion
**Type:** rate
**Definition:** Coupon apply denemelerinde reject oranı.

### MD-132 — `coupon_to_order_rate`

**Family:** promotion_commerce
**Type:** rate
**Definition:** Coupon apply success sonrası order_created oranı.

### MD-133 — `campaign_uplift_rate`

**Family:** promotion_effect
**Type:** rate
**Definition:** Campaign-active bağlamın uygun baseline’a göre conversion uplift oranı.
**Caveat:** controlled comparison context gerektirir

### MD-134 — `point_market_redemption_rate`

**Family:** point_market
**Type:** rate
**Definition:** Eligible spend context’lerde redemption completion oranı.

### MD-135 — `reward_revocation_rate_after_return`

**Family:** reward_quality
**Type:** rate
**Definition:** Return/refund sonrası reward revoke veya recompute oranı.

---

## 16. Moderation / risk metric ailesi

### MD-140 — `moderation_approval_rate`

**Family:** moderation
**Type:** rate
**Definition:** Moderation queue’ya düşen içeriklerde approval oranı.

### MD-141 — `moderation_reject_rate`

**Family:** moderation
**Type:** rate
**Definition:** Moderation queue’ya düşen içeriklerde reject oranı.

### MD-142 — `time_to_moderation_decision`

**Family:** moderation_ops
**Type:** duration
**Definition:** Moderation item create ile karar verilmesi arası süre.

### MD-143 — `risk_hold_rate`

**Family:** risk
**Type:** rate
**Definition:** İncelenen ilgili akışlar içinde risk hold uygulanan oran.

### MD-144 — `fraud_coupon_abuse_signal`

**Family:** risk_signal
**Type:** signal
**Definition:** Coupon retry, multi-account usage, coupon->order->return loop ve benzeri örüntülerden türetilen abuse sinyali.

### MD-145 — `suppression_rate`

**Family:** risk_moderation
**Type:** rate
**Definition:** Ranking/visibility suppression uygulanan candidate veya content oranı.

---

## 17. Finance / settlement / payout metric ailesi

### MD-150 — `gross_merchandise_value`

**Family:** finance
**Type:** distribution
**Definition:** Belirli pencere içinde oluşan brüt satış tutarı.

### MD-151 — `net_sales_value`

**Family:** finance
**Type:** distribution
**Definition:** Campaign/coupon etkileri sonrası net satış tutarı.

### MD-152 — `coupon_sponsor_cost_share`

**Family:** finance_promotion
**Type:** distribution
**Definition:** Sponsor tipine göre taşınan indirim maliyeti dağılımı.

### MD-153 — `settlement_line_adjustment_rate`

**Family:** finance_quality
**Type:** rate
**Definition:** Oluşan settlement line’lar içinde sonradan adjustment gören oran.

### MD-154 — `payable_to_paid_rate`

**Family:** payout
**Type:** rate
**Definition:** Payable duruma gelen bakiyelerde paid_out completion oranı.

### MD-155 — `payout_failure_rate`

**Family:** payout_quality
**Type:** rate
**Definition:** Payout denemelerinde failure oranı.

### MD-156 — `refund_cost_rate`

**Family:** finance_post_order
**Type:** rate
**Definition:** Net satışa göre refund/correction maliyet oranı.

Net kural:

* `settled`, `payable` ve `paid_out` tek başarı metriğinde ezilmez
* Finance correction ayrı kalite metriği gerektirir

---

## 18. Canonical commerce funnel sözlüğü

İlk faz resmi funnel adımları:

1. `impression`
2. `click`
3. `pdp_enter`
4. `variant_selection`
5. `add_to_cart`
6. `cart_review`
7. `checkout_start`
8. `address_complete`
9. `ready_for_payment`
10. `payment_start`
11. `payment_success`
12. `order_created`
13. `delivered`
14. `review_contribution`
15. `story_contribution`

Net kural:

* Yerel UI adları bu resmi adımların yerine geçmez
* Unknown-result `payment_success` içine sessizce katılmaz
* Delivered sonrası contribution metrikleri order_created ile karıştırılmaz

---

## 19. Decision signal sözlüğü

İlk faz referans signal ailesi:

* `product_interest_signal`
* `content_quality_signal`
* `creator_quality_signal`
* `supplier_reliability_signal`
* `fraud_coupon_abuse_signal`
* `ranking_quality_signal`
* `delivery_reliability_signal`

Net kural:

* Signal dashboard KPI olmak zorunda değildir
* Signal model feature veya decision input olarak tüketilebilir
* Signal ismi canonical, hesap mantığı owner katmanda kalır

---

## 20. Faz-1 dışında bırakılan alanlar

* gelişmiş attribution model ailesi
* tam causal uplift metodolojisi
* exhaustive ML feature importance sözlüğü
* tam cohort / retention ailesi
* tüm experimentation metric matrisi

---

## 21. Kısa sonuç

Bu sözlük ile aşağıdaki çekirdek ölçüm kararları sert biçimde sabitlenmiş olur:

* Metric bağlamlı ve tanımlı olmalıdır
* Count, derived metric, quality metric ve decision signal ayrı katmanlardır
* Search, retrieval, ranking, commerce, logistics, UGC, moderation, risk ve finance alanları ortak canonical sözlükte tanımlanır
* Commerce funnel resmi adımlarla ölçülür
* Unknown-result, duplicate ve correction etkileri başarı metriklerine sessizce karışmaz
* Creator/store ve supplier/ops kalitesi ayrı kalite metrikleriyle izlenir
* Reward, coupon, settlement ve payout aileleri finance görünürlüğünde ayrı tutulur

Bu dosya, Aşama 11’in bağlayıcı ve yoruma kapalı metric referansıdır.
