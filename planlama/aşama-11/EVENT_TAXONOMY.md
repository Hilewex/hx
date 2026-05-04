# EVENT_TAXONOMY

## 1. Amaç

Bu dosya, platformun ölçümleme, audit, ranking, fraud, operasyon ve ürün geliştirme ihtiyaçlarını besleyecek event dilini tek doğrulu, uygulanabilir ve çakışmasız taksonomiye dönüştürür.

Bu dosyanın amacı:

* platform genelinde canonical event isimlendirmesini sabitlemek
* raw event, normalized event, derived metric ve decision signal katmanlarını sert biçimde ayırmak
* surface, actor, object, context, correlation ve result alanlarını standartlaştırmak
* search, retrieval, ranking, commerce, UGC, moderation, risk ve finance alanlarında aynı event dilini kurmaktır

Net kural:

* Event truth owner değildir
* Event domain mutation yerine geçmez
* Her davranış canonical event olmak zorunda değildir
* Her event audit değildir
* Her event metric değildir
* Her event decision signal değildir
* Unknown-result, duplicate ve replay first-class event kalite durumlarıdır

---

## 2. Kapsam

Bu taksonomi ilk fazda aşağıdaki event ailelerini kapsar:

1. navigation / discovery eventleri
2. search / retrieval / ranking eventleri
3. product / store / PDP eventleri
4. social interaction eventleri
5. story / video / content consumption eventleri
6. cart / checkout / payment / order eventleri
7. shipment / delivery / return eventleri
8. review / Q&A / user product story eventleri
9. coupon / reward / point market eventleri
10. notification / support giriş eventleri
11. moderation / risk / suppression eventleri
12. finance / settlement / payout eventleri
13. identity / session / bind eventleri

Bu dosya aşağıdaki alanları bilinçli olarak detaylandırmaz:

* metric formülleri
* audit severity / retention kuralları
* risk skor ağırlıkları
* ranking feature ağırlıkları
* tüm provider payload şemaları

Bunlar ilgili Aşama 11 dosyalarında detaylandırılır.

---

## 3. Event katman modeli

### ET-001 — Raw event

Gerçekleşen davranışın veya sistem olayının ilk kaydıdır.

Örnek:

* `search_submitted`
* `product_card_clicked`
* `checkout_started`
* `payment_callback_received`

### ET-002 — Normalized event

Ham event’in canonical şemaya çevrilmiş, tekilleştirilmiş ve bağlamlandırılmış halidir.

Amaç:

* farklı istemcilerden gelen davranışı ortak dilde toplamak
* actor, surface, object, context ve result alanlarını standartlaştırmak
* duplicate / late / replay sınıflarını görünür kılmak

### ET-003 — Derived metric

Event akışından hesaplanan oran, süre, dağılım veya sayaç metriktir.

Örnek:

* `search_to_pdp_rate`
* `story_completion_rate`
* `payment_success_rate`

### ET-004 — Decision signal

Başka sistemlerin kararını besleyen anlamlı sinyal katmanıdır.

Örnek:

* `product_interest_signal`
* `creator_quality_signal`
* `fraud_coupon_abuse_signal`

Net kural:

* Raw event metric değildir
* Normalized event decision signal değildir
* Metric ile signal aynı veri türü değildir
* Decision signal doğrudan UI event’i değildir

---

## 4. Temel ilkeler

### EV-001 — Event truth owner değildir

**Binding Rule:** Event, owner truth mutation sonrası veya gözlemsel davranış olarak üretilir; tek başına domain state finalize etmez.

### EV-002 — Event ile command aynı şey değildir

**Binding Rule:** UI intent, API command, owner mutation ve sonradan üretilen event ayrı aşamalardır; tek kayıt altında ezilmez.

### EV-003 — Event ile audit aynı şey değildir

**Binding Rule:** Aynı aksiyon hem event hem audit üretebilir; ama audit resmi denetim izi olarak ayrıca ele alınır.

### EV-004 — Event ile decision signal aynı şey değildir

**Binding Rule:** Gözlemsel event akışı ile ranking/risk/admin kararını besleyen sinyal ayrı katmandadır.

### EV-005 — Context’siz event canonical kabul edilmez

**Binding Rule:** Surface, actor, object veya minimal result bağlamı olmayan kayıtlar canonical normalized event sayılmaz.

### EV-006 — Duplicate-safe işleme zorunludur

**Binding Rule:** Özellikle callback, async completion, refund, payout ve entitlement alanlarında aynı niyet ikinci kez yeni etki üretemez.

### EV-007 — Unknown-result first-class event sonucudur

**Binding Rule:** Timeout, provider ambiguity veya half-confirmed sonuçlar success/failure’a zorlanmadan ayrı tutulur.

### EV-008 — Accepted ile completed event sonucu aynı değildir

**Binding Rule:** Bir işlemin kabul edilmiş olması tamamlandığı anlamına gelmez; özellikle payment, order, moderation ve payout alanlarında bu ayrım korunur.

---

## 5. Canonical event şeması

Her normalized event en az şu alan ailesini taşır:

### 5.1 Kimlik alanları

* `event_id`
* `event_name`
* `event_version`
* `event_family`
* `occurred_at`
* `received_at`
* `data_quality_state`

### 5.2 Actor alanları

* `actor_type`
* `actor_id` nullable olabilir
* `auth_state`
* `session_id`
* `identity_bind_state` gerekiyorsa

### 5.3 Surface alanları

* `surface`
* `surface_mode` gerekiyorsa
* `platform`
* `entry_context`

### 5.4 Object alanları

* `object_type`
* `object_id`
* `secondary_object_type` gerekiyorsa
* `secondary_object_id` gerekiyorsa

### 5.5 Commerce / lifecycle bağlamı

* `store_context_id` gerekiyorsa
* `category_context_id` gerekiyorsa
* `checkout_id` gerekiyorsa
* `payment_attempt_id` gerekiyorsa
* `order_id` gerekiyorsa
* `order_line_id` gerekiyorsa
* `package_id` gerekiyorsa
* `shipment_id` gerekiyorsa

### 5.6 Result alanları

* `result_state`
* `blocked_reason` gerekiyorsa
* `error_code` gerekiyorsa
* `degraded_state` gerekiyorsa
* `source_mode` gerekiyorsa

### 5.7 Correlation alanları

* `request_id` gerekiyorsa
* `correlation_id` gerekiyorsa
* `idempotency_key` gerekiyorsa
* `provider_ref` gerekiyorsa
* `reconciliation_ref` gerekiyorsa

Net kural:

* Event payload tam entity dump’ı değildir
* Event payload karar üretmeye yetecek minimum bağlamı taşır
* Gereksiz PII event içine dökülmez
* Correlation eksik kritik async event canonical kabul edilmez

---

## 6. İsimlendirme standardı

### EV-010 — Event adı fiil + sonuç veya fiil + aşama standardı taşır

Örnek:

* `search_submitted`
* `product_card_clicked`
* `checkout_started`
* `coupon_apply_rejected`
* `payment_callback_received`

### EV-011 — UI intent ile owner completion ayrılır

Örnek:

* `checkout_start_clicked`
* `checkout_started`
* `payment_start_requested`
* `payment_initiated`
* `order_create_requested`
* `order_created`

### EV-012 — Result suffix standardı korunur

Canonical aile:

* `_requested`
* `_started`
* `_received`
* `_accepted`
* `_completed`
* `_confirmed`
* `_rejected`
* `_blocked`
* `_failed`
* `_expired`
* `_reconciled`

### EV-013 — Family alanı zorunludur

Canonical family:

* `navigation`
* `search`
* `retrieval`
* `ranking`
* `content_consumption`
* `interaction`
* `commerce`
* `logistics`
* `ugc`
* `moderation`
* `risk`
* `finance`
* `identity`

Net kural:

* Search, retrieval ve ranking tek family altında ezilmez
* Moderation ve risk tek family altında ezilmez
* Commerce ve finance tek family altında ezilmez

---

## 7. Surface standardı

İlk faz canonical surface ailesi:

* `home`
* `discover`
* `search_global`
* `search_discover`
* `search_catalog`
* `search_store`
* `category_plp`
* `pdp`
* `storefront_store`
* `follow`
* `favorites`
* `saved`
* `cart`
* `checkout`
* `payment`
* `order_detail`
* `tracking`
* `cancel_return_entry`
* `notification_center`
* `support_entry`
* `admin_panel`
* `creator_panel`
* `supplier_panel`
* `order_ops_panel`
* `support_ops_panel`
* `backend_async`

Net kural:

* Tek search kutusu var diye tek search surface yoktur
* Discover search ile catalog search aynı surface değildir
* PDP ve store surface ayrımı korunur

---

## 8. Actor standardı

Canonical actor tipi:

* `guest_user`
* `authenticated_user`
* `creator`
* `supplier`
* `admin`
* `system`
* `provider`

Net kural:

* Guest ve authenticated user aynı actor sınıfında ezilmez
* Admin event’i user event’i değildir
* Provider callback’leri system/provider actor olarak ayrı ele alınır

---

## 9. Object standardı

İlk faz canonical object ailesi:

* `product`
* `product_variant`
* `store`
* `category`
* `story`
* `video_product_card`
* `post`
* `review`
* `question`
* `answer`
* `cart`
* `cart_line`
* `checkout`
* `payment_attempt`
* `order`
* `order_line`
* `package`
* `shipment`
* `coupon`
* `reward_entry`
* `point_market_item`
* `notification`
* `support_topic`
* `support_ticket`
* `moderation_item`
* `risk_case`
* `settlement_line`
* `payout_batch`

---

## 10. Navigation / discovery event ailesi

### EV-020 — Surface open canonical event’tir

Örnek:

* `home_opened`
* `discover_opened`
* `category_opened`
* `store_surface_opened`
* `pdp_opened`
* `follow_opened`

### EV-021 — Blocked ve degraded render ayrı event’tir

Örnek:

* `surface_blocked_rendered`
* `surface_degraded_rendered`

### EV-022 — Navigation ile ranking ayrılır

**Binding Rule:** Bir yüzeyin açılması ile o yüzeye hangi adayların hangi skorla geldiği ayrı event ailelerinde izlenir.

---

## 11. Search / retrieval / ranking event ailesi

### EV-030 — Search submit canonical event’tir

Örnek:

* `search_submitted`

Bağlam:

* query_text veya sanitized form
* search_mode
* surface
* actor_type

### EV-031 — Suggestion click ve result click ayrıdır

Örnek:

* `search_suggestion_clicked`
* `search_result_clicked`

### EV-032 — Search mode first-class context’tir

Canonical mode:

* `global`
* `discover`
* `catalog`
* `store`

### EV-033 — Retrieval candidate generation ayrı family’dir

Örnek:

* `retrieval_candidates_generated`
* `retrieval_facets_generated`
* `retrieval_no_result_returned`

### EV-034 — Final ranking ayrı family’dir

Örnek:

* `ranking_applied`
* `rerank_applied`
* `fallback_ranking_applied`
* `suppression_applied`

### EV-035 — Search intent owner ile final ranking owner ayrılır

**Binding Rule:** Query parsing / intent / candidate path retrieval alanıdır; final ordering ranking alanıdır.

### EV-036 — No-result ile degraded aynı metric ve event ailesine karışmaz

Örnek:

* `search_no_result_returned`
* `search_degraded_returned`

---

## 12. Product / store / PDP event ailesi

### EV-040 — Impression ve click ayrıdır

Örnek:

* `product_card_impression`
* `product_card_clicked`

### EV-041 — Card type context zorunludur

Canonical card type:

* `classic_product_card`
* `video_product_card`
* `store_card`

### EV-042 — PDP open canonical event’tir

Örnek:

* `pdp_opened`

### EV-043 — Store context event’i ayrı tutulur

Örnek:

* `store_surface_opened`
* `store_search_submitted`
* `store_product_clicked`

### EV-044 — PDP alt blok etkileşimi ayrı event olabilir

Örnek:

* `pdp_review_block_opened`
* `pdp_qa_block_opened`
* `pdp_user_story_block_opened`

---

## 13. Story / video / content consumption event ailesi

### EV-050 — Story open / complete / skip / early close ayrıdır

Örnek:

* `story_opened`
* `story_completed`
* `story_skipped`
* `story_closed_early`

### EV-051 — Story context zorunludur

Canonical context:

* `home_story_strip`
* `discover_story_strip`
* `store_story_strip`
* `pdp_user_story_strip`

### EV-052 — User product story ile creator story ayrılır

**Binding Rule:** `story_type` first-class context alanıdır.

Canonical story_type:

* `creator_store_intro_story`
* `creator_product_promo_story`
* `user_product_story`

### EV-053 — Video product card consumption ayrı ailede tutulur

Örnek:

* `video_card_impression`
* `video_started`
* `video_completed`
* `video_muted`
* `video_unmuted`
* `video_to_pdp_clicked`

### EV-054 — Post consumption ayrı ailede tutulur

Örnek:

* `post_impression`
* `post_clicked`
* `post_to_store_clicked`

---

## 14. Social interaction event ailesi

### EV-060 — Like / save / share / follow ayrı canonical event’tir

Örnek:

* `like_requested`
* `like_completed`
* `save_requested`
* `save_completed`
* `share_requested`
* `share_completed`
* `follow_requested`
* `follow_completed`

### EV-061 — Login gate ve eligibility gate ayrı event’tir

Örnek:

* `interaction_login_gate_triggered`
* `interaction_eligibility_gate_triggered`
* `interaction_blocked`

### EV-062 — Optimistic UI ile owner completion ayrıdır

**Binding Rule:** UI toggle davranışı ile canonical domain completion aynı event adı altında ezilmez.

---

## 15. Commerce funnel event ailesi

### EV-070 — Canonical commerce funnel eventleri

En az şu aile korunur:

* `variant_selected`
* `add_to_cart_requested`
* `add_to_cart_completed`
* `cart_opened`
* `cart_line_updated`
* `checkout_started`
* `checkout_address_completed`
* `checkout_ready_for_payment`
* `payment_start_requested`
* `payment_initiated`
* `payment_callback_received`
* `payment_confirmed`
* `order_created`

### EV-071 — Checkout readiness, payment success ve order create ayrı tutulur

**Binding Rule:** `ready_for_payment != payment_confirmed != order_created` ayrımı event seviyesinde korunur.

### EV-072 — Coupon apply event ailesi ayrıdır

Örnek:

* `coupon_apply_requested`
* `coupon_apply_completed`
* `coupon_apply_rejected`
* `coupon_removed`

### EV-073 — Unknown-result payment event’i first-class’tır

Örnek:

* `payment_unknown_result_detected`
* `payment_reconciliation_started`
* `payment_reconciled`

### EV-074 — Guest commerce context event payload’da korunur

**Binding Rule:** Guest ve authenticated commerce event’leri aynı auth_state altında ezilmez.

---

## 16. Shipment / delivery / return event ailesi

### EV-080 — Shipment ve delivery event’leri ayrıdır

Örnek:

* `shipment_created`
* `shipment_marked_shipped`
* `shipment_in_transit`
* `delivery_marked_delivered`
* `delivery_failed`

### EV-081 — Package-level ve line-level bağlam korunur

**Binding Rule:** Çok paketli sipariş ve line-level entitlement etkisi event bağlamında taşınmalıdır.

### EV-082 — Delivered entitlement trigger ayrı event ailesidir

Örnek:

* `delivery_entitlement_opened`
* `review_entitlement_opened`
* `story_entitlement_opened`

### EV-083 — Return / refund event ailesi ayrıdır

Örnek:

* `return_requested`
* `return_approved`
* `return_rejected`
* `refund_started`
* `refund_completed`
* `entitlement_recomputed_after_return`

---

## 17. UGC event ailesi

### EV-090 — Review eventleri

Örnek:

* `review_create_requested`
* `review_created`
* `review_updated`
* `review_deleted`
* `review_taken_down`

### EV-091 — Question / answer eventleri

Örnek:

* `question_submitted`
* `question_published`
* `question_rejected`
* `answer_published`
* `answer_taken_down`

### EV-092 — User product story eventleri

Örnek:

* `user_product_story_submitted`
* `user_product_story_published`
* `user_product_story_rejected`
* `user_product_story_archived`
* `user_product_story_taken_down`

### EV-093 — Reward bağlantılı UGC eventleri ayrıdır

Örnek:

* `review_reward_pending_created`
* `story_reward_pending_created`
* `reward_made_spendable`
* `reward_revoked_after_return`

---

## 18. Moderation / risk event ailesi

### EV-100 — Moderation eventleri içerik görünürlüğü odaklıdır

Örnek:

* `moderation_item_created`
* `moderation_review_started`
* `moderation_approved`
* `moderation_rejected`
* `moderation_restricted`
* `moderation_taken_down`

### EV-101 — Risk eventleri abuse/anomaly odaklıdır

Örnek:

* `risk_signal_detected`
* `risk_case_opened`
* `risk_hold_applied`
* `risk_hold_released`
* `suppression_applied`

### EV-102 — Moderation ve risk event’leri karıştırılmaz

**Binding Rule:** içerik güvenliği ve davranış güvenliği ayrı family altında tutulur.

---

## 19. Finance / settlement / payout event ailesi

### EV-110 — Settlement ve payout ayrı family’dir

Örnek:

* `settlement_line_created`
* `settlement_line_adjusted`
* `settlement_line_settled`
* `payout_batch_created`
* `payout_line_marked_payable`
* `payout_line_paid`
* `payout_line_failed`

### EV-111 — Settled ile paid_out aynı event sonucu değildir

**Binding Rule:** `settled != payable != paid_out` ayrımı event seviyesinde de korunur.

### EV-112 — Sponsor attribution finance event’lerinde görünür olmalıdır

Örnek:

* `coupon_sponsor_attributed`
* `refund_correction_applied`

---

## 20. Identity / session / bind event ailesi

### EV-120 — Anonymous to login bind ayrı family’dir

Örnek:

* `anonymous_session_started`
* `authenticated_session_started`
* `identity_bound_from_guest`
* `cart_merged_after_login`

### EV-121 — Guest ve authenticated stream ayrımı korunur

**Binding Rule:** Aynı journey’de guest’ten auth’a geçiş varsa bind olayı açıkça kaydedilir.

### EV-122 — Identity bind geçmiş history’yi silmez

**Binding Rule:** Bind yeni ilişki üretir; geçmiş raw event history fiziksel silme ile yeniden yazılmaz.

---

## 21. Result state standardı

Canonical result_state ailesi:

* `accepted`
* `completed`
* `rejected`
* `blocked`
* `failed`
* `expired`
* `under_review`
* `degraded`
* `unknown_result`
* `duplicate_ignored`
* `reconciled`

Net kural:

* `accepted` ile `completed` aynı şey değildir
* `blocked` ile `failed` aynı şey değildir
* `unknown_result` ayrı tutulur
* `reconciled` correction sonrası resmi sonucu gösterebilir

---

## 22. Duplicate / replay / ordering ilkeleri

### EV-130 — Correlation kritik async alanlarda zorunludur

**Binding Rule:** Provider_ref, correlation_id, idempotency_key veya eşdeğer bağ olmadan kritik async event canonical kabul edilmez.

### EV-131 — Duplicate-safe işleme sonucu canonical quality state üretir

**Binding Rule:** Duplicate event ikinci kez yeni business veya finance etkisi üretmez; `duplicate_ignored` sınıfı kullanılabilir.

### EV-132 — Late event history’de kalabilir, canonical state’i overwrite etmez

**Binding Rule:** Late arrival analytics/history için saklanabilir; ama truth overwrite aracı değildir.

### EV-133 — Replay ve rebuild ayrı işaretlenir

Örnek:

* `event_replayed`
* `entity_rebuild_started`
* `entity_rebuild_completed`

---

## 23. Faz-1 için minimum zorunlu event zinciri

İlk faz minimum canonical event kapsamı şu zinciri içerir:

1. search submit -> result click -> PDP enter
2. PDP -> variant selection -> add_to_cart
3. cart -> checkout -> payment -> order
4. shipment -> delivery -> entitlement open
5. review / story contribution
6. coupon apply / reject
7. moderation approve / reject
8. risk hold / release
9. settlement create / adjust / settle
10. payout payable / paid / failed

---

## 24. Faz-1 dışında bırakılan alanlar

* detaylı ML feature logging
* tüm debug eventleri
* exhaustively provider-specific callback alanları
* appeal / restore event detay matrisi
* tüm medya telemetry’sinin tam ham şeması

---

## 25. Kısa sonuç

Bu taksonomi ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* Event truth owner değildir
* Raw event, normalized event, derived metric ve decision signal ayrı katmanlardır
* Search, retrieval ve ranking ayrı event aileleridir
* Checkout, payment, order, shipment, return ve payout zinciri ayrı ama bağlanabilir event aileleriyle izlenir
* UGC, moderation ve risk event’leri birbirine karıştırılmaz
* Guest -> auth bind ayrı event ailesidir
* Unknown-result, duplicate ve replay first-class davranışlardır

Bu dosya, Aşama 11’in bağlayıcı ve yoruma kapalı event omurgasıdır.
