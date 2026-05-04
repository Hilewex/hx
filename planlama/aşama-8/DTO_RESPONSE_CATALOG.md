# DTO_RESPONSE_CATALOG

## 1. Amaç

Bu dosya, Aşama 8 kapsamında storefront, app ve panel yüzeylerinin beklediği response şekillerini kataloglar.

Bu dosyanın amacı:

* ekranların hangi veri aileleriyle beslendiğini sabitlemek,
* truth entity ile UI response DTO’sunu birbirine karıştırmamak,
* summary / detail / projection / action-result ayrımını netleştirmek,
* storefront ve panel yüzeyleri için ortak ama kontrollü response dili kurmak,
* state, block, degraded ve permission bağlamının response katmanında nasıl taşınacağını sabitlemektir.

Net kural:

* DTO truth entity değildir.
* DTO, owner source truth’un veya projection’ın ekran için taşınan görünüm sözleşmesidir.
* Aynı domain verisi farklı yüzeylerde farklı DTO ile taşınabilir.
* UI ihtiyacı diye owner boundary bozulmaz.

---

## 2. Kapsam

Bu katalog şu yüzey ailelerini kapsar:

### Storefront / app response aileleri

* Home
* Discover
* Search
* Category / PLP
* PDP
* Cart
* Checkout
* Payment
* Order detail
* Order tracking
* Cancel / return entry
* Notification center
* Support entry

### Panel response aileleri

* Admin
* Creator panel
* Supplier panel
* Order operations
* Support ticket operations

Not:
Bu dosya endpoint listesini değil, ekran besleme response ailesini kataloglar.
Endpoint ve request/response sözleşmesinin API seviyesi tanımı Aşama 5 OpenAPI dosyalarında yer alır.

---

## 3. Temel DTO ilkeleri

### 3.1 Truth ve DTO ayrımı

* Order truth ile order detail DTO aynı şey değildir.
* Shipment truth ile tracking DTO aynı şey değildir.
* Settlement line truth ile finance dashboard summary DTO aynı şey değildir.

### 3.2 Summary ve detail ayrımı

* Liste / kart / blok ekranları summary DTO kullanır.
* Ayrıntılı karar ekranları detail DTO kullanır.
* Aynı nesnenin summary ve detail görünümü aynı alan setini taşımak zorunda değildir.

### 3.3 Projection ve command-result ayrımı

* Projection DTO ekrana görünür veri taşır.
* Command-result DTO aksiyon sonucunu taşır.
* Aynı response içinde ikisi karıştırılabilir; ama semantik ayrım görünür olmalıdır.

### 3.4 Stateful response ilkesi

Ekranların yalnız veri değil, davranış kararını taşıyacak sınırlı state alanlarına da ihtiyacı vardır.
Örnek:

* `availability_state`
* `interaction_state`
* `eligibility_state`
* `payment_state_summary`
* `tracking_state_summary`
* `moderation_visibility_state`

### 3.5 Honest degradation ilkesi

Bazı response’larda kısmi bozulma / gecikme açıkça taşınmalıdır.
Örnek:

* `degraded: true`
* `partial_data: true`
* `unavailable_reason`
* `blocked_reason`

---

## 4. Ortak response zarfı

Aşağıdaki üst seviye alan ailesi, ihtiyaç halinde tüm yüzeylerde kullanılabilir:

* `data`
* `meta`
* `state`
* `actions`
* `errors`

### 4.1 `data`

Ekranın temel gösterim verisi.

### 4.2 `meta`

Pagination, cursor, source mode, freshness, last_updated gibi yardımcı alanlar.

### 4.3 `state`

Blocked / degraded / eligibility / interaction / lifecycle summary alanları.

### 4.4 `actions`

Bu ekranda UI’nin hangi aksiyonları render edeceği veya disable edeceğiyle ilgili görünür karar seti.

### 4.5 `errors`

Tam ekran veya alt blok hata / unavailable bilgisi.

Net kural:
Ekran, yalnız ham veri listesi alıp davranışı kendi kafasına göre türetmemelidir.
Kritik davranış için state ve actions alanları gerekiyorsa response içinde taşınmalıdır.

---

## 5. Ortak state alanları kataloğu

Aşağıdaki state alanları katalog düzeyinde ortaklaşabilir:

* `visibility_state`
* `availability_state`
* `interaction_state`
* `eligibility_state`
* `fulfillment_state_summary`
* `payment_state_summary`
* `tracking_state_summary`
* `moderation_state_summary`
* `risk_state_summary`
* `notification_priority`
* `degraded_state`

Not:
Tüm DTO’lar tüm state alanlarını taşımaz. Alan seçimi yüzeye göre yapılır.

---

## 6. ORTAK ATOMİK DTO AİLELERİ

Bu bölüm, ekranların birleşik response’larını kurarken kullanılacak atomik DTO ailelerini sabitler.

### 6.1 MoneySummaryDTO

Amaç:

* fiyat, toplam, indirim, kupon, kampanya ve para birimi gösterimleri için ortak atomik para yapısı

Minimum alanlar:

* `amount`
* `currency`
* `formatted`

Opsiyonel alanlar:

* `previous_amount`
* `discount_amount`
* `discount_label`

### 6.2 PricePresentationDTO

Amaç:

* ürün veya sipariş satırı fiyat sunumu

Minimum alanlar:

* `current_price: MoneySummaryDTO`
* `previous_price?: MoneySummaryDTO`
* `campaign_badge?: string`
* `coupon_effect_label?: string`
* `price_state`

### 6.3 StoreSummaryDTO

Amaç:

* mağaza summary kartları ve mağaza bağlam alanları

Minimum alanlar:

* `store_id`
* `store_name`
* `store_slug`
* `profile_image_url`
* `badge_set`
* `follow_state`
* `store_visibility_state`

### 6.4 MediaAssetDTO

Amaç:

* görsel/video türetilmiş medya kullanımı

Minimum alanlar:

* `asset_id`
* `asset_type`
* `display_url`
* `thumbnail_url?`
* `preview_url?`
* `aspect_ratio`
* `media_readiness_state`

### 6.5 InteractionSummaryDTO

Amaç:

* beğeni / kaydetme / paylaşma ortak etkileşim özeti

Minimum alanlar:

* `like_count?`
* `save_count?`
* `share_count?`
* `viewer_like_state?`
* `viewer_save_state?`
* `interaction_availability_state`

### 6.6 BlockStateDTO

Amaç:

* ekran veya blok bazlı yükleme / empty / degraded / blocked görünürlüğü

Minimum alanlar:

* `status`
* `reason?`
* `message?`

Örnek `status` aileleri:

* `loading`
* `ready`
* `empty`
* `blocked`
* `degraded`
* `error`

### 6.7 ActionAvailabilityDTO

Amaç:

* bir aksiyonun render/enable/disable durumunu taşımak

Minimum alanlar:

* `action_key`
* `visible`
* `enabled`
* `blocked_reason?`
* `requires_login?`
* `requires_eligibility?`

---

## 7. STOREFRONT / APP RESPONSE AİLELERİ

## 7.1 HomeScreenResponseDTO

Amaç:

* ana sayfa blok-temelli response ailesi

Yapı:

* `header`
* `category_strip`
* `store_story_strip`
* `hero_blocks`
* `video_blocks`
* `product_blocks`
* `trust_blocks`
* `meta`

Kritik state alanları:

* blok bazlı `BlockStateDTO`
* `degraded_state`

Not:
Ana sayfa tek feed değildir; block-based response ailesi olmalıdır.

---

## 7.2 DiscoverFeedResponseDTO

Amaç:

* keşfet akışı için video ağırlıklı response ailesi

Yapı:

* `story_strip`
* `feed_items`
* `cursor`
* `meta`

`feed_items` destekleyebilir:

* `video_product_card`
* `classic_product_card`
* ileride kontrollü discovery item türleri

Kritik state alanları:

* `feed_state`
* `story_strip_state`
* `partial_availability`

Not:
Keşfet karar tamamlama değil, ilgi akışıdır; response bunun hafif ve akıcı davranışını korumalıdır.

---

## 7.3 SearchSurfaceResponseDTO

Amaç:

* arama yüzeyleri için ortak response ailesi

Yapı:

* `query`
* `search_mode`
* `suggestions?`
* `result_groups`
* `applied_filters?`
* `sort_options?`
* `cursor?`
* `meta`

`search_mode` örnekleri:

* `platform`
* `discover`
* `catalog`
* `store`

`result_groups` örnekleri:

* `products`
* `stores`
* `categories`
* `discover_candidates`

Not:
Tek arama kutusu olsa da response modu yüzeye göre değişebilmelidir.

---

## 7.4 CategoryPLPResponseDTO

Amaç:

* kategori / PLP için karar öncesi ürün tarama response ailesi

Yapı:

* `category_identity`
* `subcategory_options`
* `applied_filters`
* `available_facets`
* `sort_options`
* `product_list`
* `supporting_video_row?`
* `result_summary`
* `meta`

Kritik state alanları:

* `facet_state`
* `list_state`
* `degraded_state`

---

## 7.5 PDPResponseDTO

Amaç:

* PDP’nin çok katmanlı veri sözleşmesini taşımak

Yapı:

* `product_core`
* `commercial_decision`
* `purchase_actions`
* `interaction_summary`
* `store_context`
* `review_summary`
* `question_answer_summary`
* `social_proof_blocks`
* `meta`

### 7.5.1 ProductCoreDTO

Minimum alanlar:

* `product_id`
* `title`
* `brand`
* `category_path`
* `media_gallery`
* `feature_groups`
* `variant_options`
* `content_state`

### 7.5.2 CommercialDecisionDTO

Minimum alanlar:

* `price_presentation`
* `stock_summary`
* `delivery_summary`
* `return_summary`
* `variant_price_diffs?`
* `variant_stock_diffs?`
* `commercial_state`

### 7.5.3 PurchaseActionsDTO

Minimum alanlar:

* `selected_variant_state`
* `quantity_rules`
* `add_to_cart_action`
* `buy_now_action`
* `action_state`

### 7.5.4 ReviewSummaryDTO

Minimum alanlar:

* `rating_average`
* `rating_count`
* `viewer_review_eligibility_state`
* `review_visibility_state`

### 7.5.5 QuestionAnswerSummaryDTO

Minimum alanlar:

* `question_count`
* `viewer_question_action_state`
* `qa_visibility_state`

Not:
PDP mağaza bağlamında açılır; ancak yorum ve soru-cevap ürün bazlı ortak davranabilir.

---

## 7.6 CartResponseDTO

Amaç:

* sepet görünürlüğü ve düzenleme response ailesi

Yapı:

* `cart_items`
* `cart_summary`
* `cart_actions`
* `warnings`
* `meta`

### CartLineDTO

Minimum alanlar:

* `cart_line_id`
* `product_summary`
* `store_summary`
* `variant_summary`
* `quantity`
* `line_price`
* `availability_state`
* `line_warnings?`

### CartSummaryDTO

Minimum alanlar:

* `subtotal`
* `discount_total?`
* `estimated_delivery_info?`
* `cart_state`

Not:
Sepet final truth değil; warning ve drift bilgisi taşıyabilir.

---

## 7.7 CheckoutResponseDTO

Amaç:

* checkout final doğrulama yüzeyi response ailesi

Yapı:

* `checkout_identity`
* `checkout_state_summary`
* `address_section`
* `line_items_section`
* `pricing_section`
* `coupon_section`
* `delivery_section`
* `payment_readiness`
* `actions`
* `meta`

### CheckoutStateSummaryDTO

Minimum alanlar:

* `checkout_id`
* `checkout_actor_type` (guest veya registered bağlamını taşır)
* `status`
* `expires_at?`
* `invalid_reasons?`
* `readiness_state`

### AddressSectionDTO

Minimum alanlar:

* `address_mode` (saved_address veya guest_one_time_address olduğunu belirtir)
* `selected_address_summary?`
* `address_options?`
* `address_action_state`
* `delivery_eligibility_state`

### PaymentReadinessDTO

Minimum alanlar:

* `ready_for_payment`
* `blocking_reasons?`
* `review_timestamp`

Not:
Checkout response’u yalnız fiyat değil; address, delivery, coupon, validity ve readiness taşımalıdır.

---

## 7.8 PaymentResponseDTO

Amaç:

* ödeme ekranı ve ödeme sonucu için response ailesi

Yapı:

* `payment_context_summary`
* `payment_attempt_summary`
* `payment_method_options?`
* `payment_state_summary`
* `retry_options?`
* `result_guidance?`
* `actions`

### PaymentStateSummaryDTO

Minimum alanlar:

* `payment_id?`
* `payment_attempt_id?`
* `payment_actor_type` (guest veya registered)
* `status`
* `provider_status?`
* `unknown_result_flag?`
* `next_step`

Not:
Payment response’unda “captured = order created” gibi tekleştirilmiş yanlış semantik kurulmaz.

---

## 7.9 OrderDetailResponseDTO

Amaç:

* sipariş detay ekranı response ailesi

Yapı:

* `order_identity`
* `order_state_summary`
* `address_summary`
* `line_items`
* `payment_summary`
* `package_summary`
* `post_order_actions`
* `meta`

### OrderStateSummaryDTO

Minimum alanlar:

* `order_id`
* `order_number`
* `order_context_type` (guest sipariş için post-order hesap bazlı aksiyonların kapalı olduğunu yansıtır)
* `status`
* `placed_at`
* `payment_state_summary`
* `post_order_eligibility_summary` (guest bağlamıysa sosyal haklar kapalı döner)

---

## 7.10 OrderTrackingResponseDTO

Amaç:

* kullanıcıya çevrilmiş sipariş takip projection response ailesi

Yapı:

* `tracking_summary`
* `package_cards`
* `milestones`
* `problem_signals?`
* `post_delivery_entitlements?`
* `actions`
* `meta`

### TrackingSummaryDTO

Minimum alanlar:

* `tracking_state_summary`
* `headline_message`
* `latest_visible_event`
* `delivered_flag`
* `problem_flag`

Not:
Tracking response shipment truth’un aynısı değil; kullanıcı diline çevrilmiş projection’dır.

---

## 7.11 CancelReturnEntryResponseDTO

Amaç:

* iptal/iade başlangıç ekranları için response ailesi

Yapı:

* `order_ref`
* `eligible_lines`
* `cancel_options?`
* `return_options?`
* `policy_summary`
* `refund_expectation_summary?`
* `actions`

Not:
İptal ve iade tek akış gibi response’a gömülmez; iki ayrı uygunluk ekseni taşınır.

---

## 7.12 NotificationCenterResponseDTO

Amaç:

* uygulama içi bildirim merkezi response ailesi

Yapı:

* `notification_items`
* `priority_buckets?`
* `unread_count`
* `meta`

### NotificationItemDTO

Minimum alanlar:

* `notification_id`
* `type`
* `priority`
* `headline`
* `body_preview`
* `target_ref?`
* `read_state`
* `created_at`

---

## 7.13 SupportEntryResponseDTO

Amaç:

* destek giriş yüzeyi response ailesi

Yapı:

* `context_summary` (guest order support geçişi için guest_context_id taşıyabilir)
* `topic_options`
* `self_service_suggestions`
* `ticket_entry_actions`
* `meta`

Not:
Destek giriş response’u serbest chat açma response’u değildir; yönlendirme ve konu seçimi odaklıdır.

---

## 8. PANEL RESPONSE AİLELERİ

## 8.1 AdminDashboardResponseDTO

Amaç:

* admin panel üst görünürlük response ailesi

Yapı:

* `kpi_cards`
* `attention_queues`
* `alert_blocks`
* `domain_summaries`
* `actions`
* `meta`

Not:
Admin dashboard dekoratif değil, karar destek response’u olmalıdır.

---

## 8.2 CreatorPanelResponseDTO

Amaç:

* fenomen mağaza yönetim paneli response ailesi

Yapı:

* `store_status_summary`
* `product_selection_summary`
* `content_management_summary`
* `message_summary`
* `follower_summary`
* `performance_summary`
* `warning_blocks`
* `actions`

Not:
Creator response self-service mağaza yönetimini taşır; financial truth veya order truth taşımaz.

---

## 8.3 SupplierPanelResponseDTO

Amaç:

* tedarikçi paneli response ailesi

Yapı:

* `product_input_summary`
* `review_revision_summary`
* `stock_base_price_summary`
* `fulfillment_queue_summary`
* `quality_summary`
* `warning_blocks`
* `actions`

Not:
Supplier response ticari karar truth’u taşımaz; input ve fulfillment çalışma alanını taşır.

---

## 8.4 OrderOperationsResponseDTO

Amaç:

* sipariş operasyon paneli response ailesi

Yapı:

* `work_queue_summary`
* `preparation_summary`
* `shipment_readiness_summary`
* `delay_problem_summary`
* `escalation_summary`
* `actions`

Not:
Kullanıcı takip state’iyle birebir eşit olmak zorunda değildir.

---

## 8.5 SupportTicketOperationsResponseDTO

Amaç:

* destek ticket operasyon paneli response ailesi

Yapı:

* `ticket_summary_list`
* `triage_state_summary`
* `assignment_summary`
* `sla_summary`
* `escalation_summary`
* `actions`

### TicketSummaryDTO

Minimum alanlar:

* `ticket_id`
* `ticket_type`
* `priority`
* `status`
* `owner_queue`
* `sla_state`
* `linked_subject_refs`

---

## 9. ACTION RESULT DTO AİLELERİ

Bazı ekranlar yalnız projection değil, action sonucu da alır.
Bu katalogta aşağıdaki action-result aileleri sabitlenir.

### 9.1 GenericActionResultDTO

Minimum alanlar:

* `accepted`
* `action_key`
* `result_state`
* `message?`
* `next_visible_state?`

### 9.2 InteractionActionResultDTO

Amaç:

* beğeni / kaydetme / paylaşma sonucu

Minimum alanlar:

* `target_type`
* `target_id`
* `interaction_type`
* `viewer_state`
* `counter_delta?`
* `result_state`

### 9.3 PanelProtectedActionResultDTO

Amaç:

* panel protected action sonucu

Minimum alanlar:

* `accepted`
* `action_key`
* `subject_type`
* `subject_id`
* `result_state`
* `audit_ref?`
* `blocked_reason?`

---

## 10. EMPTY / DEGRADED / BLOCKED RESPONSE KATALOĞU

Aşağıdaki görünür response sınıfları ortaklaşabilir:

### 10.1 EmptyStateDTO

* `empty_type`
* `headline`
* `body`
* `suggested_actions?`

### 10.2 DegradedStateDTO

* `degraded`
* `scope`
* `reason`
* `safe_fallback_behavior`

### 10.3 BlockedStateDTO

* `blocked`
* `reason_code`
* `message`
* `required_next_step?`

### 10.4 ConflictStateDTO

* `conflict_type`
* `message`
* `retryable`
* `required_refresh`

---

## 11. RESPONSE TASARIMINDA YASAKLAR

Aşağıdakiler yapılmamalıdır:

* Truth entity’leri ekrana olduğu gibi dökmek
* Summary ve detail response’ları gereksizce aynılaştırmak
* UI kararını tamamen istemcinin tahminine bırakmak
* Owner truth ile projection state’ini response içinde ayırt etmemek
* Degraded veya blocked davranışı response’tan gizlemek
* Panel response’unda paneli owner gibi göstermek

---

## 12. Aşama 8 kapsamında bu dosyanın kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* storefront ve panel response aileleri tanımlanmışsa,
* atomik DTO yapı taşları sabitlenmişse,
* summary / detail / projection / action-result ayrımı yapılmışsa,
* state taşıyan response alanları kataloglanmışsa,
* empty / degraded / blocked response sınıfları yazılmışsa,
* DTO ile truth entity karışması engellenmişse.

---

## 13. Açık sonraki adım

Bir sonraki dosya `STATEFUL_UI_BEHAVIOR_GUIDE.md` olacaktır.
Orada:

* ekranların state değişiminde nasıl davranacağı,
* login gate ve eligibility gate akışları,
* optimistic / non-optimistic davranışlar,
* error / retry / unknown-result görünürlüğü,
* blocked / degraded / moderation / risk davranışları
  sabitleştirilecektir.
