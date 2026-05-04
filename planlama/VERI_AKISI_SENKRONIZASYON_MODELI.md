# VERI_AKISI_SENKRONIZASYON_MODELI

Bu dosya, platformdaki sistemler arası veri akışını, senkron / asenkron iletişim sınırlarını, tutarlılık beklentilerini ve gecikme toleranslarını tanımlar.

Amaç:
- hangi sistemin hangi verinin sahibi olduğunu akış bazında netleştirmek
- senkron çağrı ile event-driven akışı birbirine karıştırmamak
- güçlü tutarlılık gereken işlemlerle eventual consistency kabul edilen işlemleri ayırmak
- implementasyon sırasında yanlış coupling, duplicate işlem, yanlış retry ve yanlış truth okuma riskini azaltmak

Net kural:
- owner dışı write yok
- BFF truth owner değildir
- UI truth üretmez
- read model truth değildir
- event, state mutation’ın yerine geçmez
- önce owner truth yazılır, sonra event üretilir

---

## 1. KAPSAM

Bu model ilk fazda şu çekirdek zinciri kapsar:

- Checkout
- Payment
- Order
- Shipment / Delivery
- Cancel / Return
- Refund
- Settlement
- Payout
- Verified Purchase / Review Eligibility / Story Eligibility / Reward Entitlement
- Notification

Bu sürümde ağırlık:
- ticari akış
- finansal akış
- teslimat sonrası hak / güven akışı
üzerindedir.

---

## 2. TEMEL ILKELER

## 2.1 Senkron çağrı ne zaman kullanılır
Aşağıdaki durumlarda senkron iletişim tercih edilir:
- kullanıcı yanıtı doğrudan bu sonuca bağlıysa
- işlem bir sonraki adıma geçmeden önce doğrulanmak zorundaysa
- state transition anında kesin cevap gerekiyorsa

Örnek:
- checkout review
- payment başlatma
- order create öncesi payment sonucu doğrulama
- shipment create readiness kontrolü

## 2.2 Asenkron akış ne zaman kullanılır
Aşağıdaki durumlarda event-driven veya asenkron akış tercih edilir:
- kullanıcı yanıtı bekletilmeden sonradan işlenebiliyorsa
- projection / analytics / notification / feed / reward etkisi sonradan tamamlanabiliyorsa
- yan etkiler ana transaction’dan ayrılabiliyorsa

Örnek:
- order created sonrası notification
- delivered sonrası eligibility açılması
- return/refund sonrası reward etkisi düşürülmesi
- settlement sonrası payout hazırlık akışı

## 2.3 Güçlü tutarlılık gereken alanlar
Aşağıdaki alanlarda yanlış sıra veya duplicate işleme ciddi hata üretir:
- checkout -> payment handoff
- successful payment -> order create
- stock reservation consume
- price lock consume
- shipment event ingestion dedupe
- refund create / execute
- settlement adjustment
- payout batch item işleme

Bu alanlarda:
- idempotency
- state guard
- duplicate koruması
- audit
zorunludur.

## 2.4 Eventual consistency kabul edilen alanlar
Aşağıdaki alanlarda kısa gecikme kabul edilebilir:
- home / discover read modelleri
- takipçi / sayaç / badge özetleri
- notification center yansıması
- reward summary projection
- panel dashboard toplulaştırmaları
- search / ranking / feed yansımaları

Net kural:
Kullanıcıya gösterilen projection gecikebilir; ama owner truth bozulamaz.

---

## 3. TUTARLILIK SINIFLARI

## 3.1 C1 — Güçlü işlem tutarlılığı
İşlem aynı akış içinde doğrulanmalıdır.

Örnek:
- checkout ready_for_payment olmadan payment başlatılamaz
- payment captured olmadan order created sayılamaz

## 3.2 C2 — Kontrollü asenkron tutarlılık
Ana truth yazılır, yan etkiler kısa süre sonra tamamlanır.

Örnek:
- order create sonrası notification
- delivered sonrası review/story eligibility açılması

## 3.3 C3 — Projection / analytical eventual consistency
Read model veya toplulaştırma geç gelebilir.

Örnek:
- discover yüzeyleri
- admin dashboard sayaçları
- reward market summary projection

---

## 4. KANONIK AKIŞLAR

---

## 4.1 Checkout -> Payment -> Order akışı

### Adım 1
Cart / selected items -> Checkout review

Tür:
- senkron

Neden:
- kullanıcıya hemen doğrulanmış sonuç dönmek gerekir

Çıktı:
- reviewed totals
- address context
- coupon/campaign sonucu
- stock reservation
- price lock gerekiyorsa geçici bağlam

### Adım 2
Checkout -> Payment create/start

Tür:
- senkron başlatma
- provider callback sonucu senkron + asenkron karışık olabilir

Neden:
- kullanıcı ödeme akışına girecek
- payment state hızlı doğrulanmalı

### Adım 3
Payment captured -> Order create

Tür:
- internal command
- idempotent
- güçlü tutarlılık beklentili

Neden:
- aynı payment için duplicate order oluşmamalı

### Kural
`payment captured` olmak, `order created` ile aynı olay değildir.
Order create ayrı command ve ayrı audit izi taşır.

---

## 4.2 Checkout geçici bağlam akışı

### CheckoutPriceLock
Tür:
- geçici işlem bağlamı

Akış:
- checkout review sırasında üretilebilir
- payment/order progression sırasında consume edilir
- checkout kapanırsa release/expire olur

### StockReservation
Tür:
- geçici işlem bağlamı

Akış:
- checkout review sırasında yaratılabilir
- order create hattında consume edilir
- checkout expire/cancel olursa release edilir

### Kural
Bunlar order snapshot değildir.
Ama order create hattında referans ve idempotency için first-class kabul edilir.

---

## 4.3 Shipment / Delivery -> Eligibility akışı

### Adım 1
Order -> Shipment create

Tür:
- internal senkron command

### Adım 2
Shipment event append

Tür:
- event ingestion
- append-only
- idempotent

### Adım 3
Delivered event -> eligibility propagation

Tür:
- asenkron ama kontrollü
- event-driven

Açılan etkiler:
- verified purchase active
- review eligibility active
- story eligibility active
- reward entitlement impact pending/active

### Kural
Delivery event geçmişi overwrite edilmez.
Eligibility truth, content truth değildir; teslimat sonrası meta etkidir.

---

## 4.4 Return / Refund / Reward / Eligibility geri etki akışı

### Adım 1
Return request create

Tür:
- app senkron request
- internal case akışı

### Adım 2
Return decision

Tür:
- operations/internal command

### Adım 3
Approved return -> refund create/execute

Tür:
- internal / finance command
- idempotent

### Adım 4
Approved return veya refund sonucu -> eligibility / reward etkisi güncelleme

Tür:
- asenkron kontrollü propagation

Etkiler:
- verified purchase revoke olabilir
- review/story eligibility değişebilir
- reward entitlement impact geri alınabilir

### Kural
`return approved` ile `refund completed` aynı şey değildir.
Reward ve eligibility etkisi de bunlardan türeyen ayrı sonuçtur.

---

## 4.5 Settlement -> Payout akışı

### Adım 1
Order finalleşen line’lar -> settlement line create

Tür:
- internal command
- line-level

### Adım 2
Refund / return / sponsor correction -> settlement adjustment

Tür:
- internal finance command
- append-only adjustment mantığı

### Adım 3
Payable settlement lines -> payout batch create

Tür:
- internal finance command
- kontrollü asenkron yürütme

### Adım 4
Payout execution result -> payout batch result update

Tür:
- internal callback / result ingestion

### Kural
- settlement line payout değildir
- payout batch settlement üretmez
- adjustment overwrite yerine ek kayıt olarak ilerler

---

## 4.6 Notification akışı

Tetikleyiciler:
- order created
- shipment delivered
- return decision
- refund result
- payout result
- moderation/support/system events

Tür:
- asenkron orchestration

Kural:
Notification ana truth’un parçası değildir.
Ana işlem notification başarısız diye geri alınmaz.
Ama retry / DLQ / audit gereksinimi bulunur.

---

## 5. SISTEMLER ARASI ILETISIM KURALI

## 5.1 Owner read / owner write ayrımı
Bir sistem:
- başka sistemin truth’unu doğrudan yazamaz
- gerekirse command gönderir
- read için owner API veya güvenilir projection kullanır

## 5.2 BFF kuralı
BFF:
- read aggregation yapar
- write owner değildir
- internal state machine mutation noktası değildir

## 5.3 Panel kuralı
Panel:
- direct write owner değildir
- protected action / command yüzeyidir
- permission + reason_code + audit ister

## 5.4 Internal API kuralı
Internal API:
- owner-to-owner command / read / callback sözleşmesidir
- app/panel/public ile karıştırılmaz
- idempotency ve audit çoğu write akışında zorunludur

---

## 6. EVENT KURALI

## 6.1 Event üretim sırası
Önce:
- owner truth mutation

Sonra:
- event publication

Net kural:
Event yayımlandı diye truth oluşmuş kabul edilmez.
Truth owner kaydı esas alınır.

## 6.2 Event zorunlu metadata
Her event en az şu alanları taşımalıdır:
- event_id
- topic
- occurred_at
- producer
- subject_type
- subject_id
- payload_schema

## 6.3 Event dedupe
Aşağıdaki alanlarda event dedupe kritik:
- payment provider callback
- shipment delivery callback
- refund provider callback
- payout result callback

## 6.4 Replay / reprocessing
Replay mümkün olabilir ama:
- idempotency
- state guard
- duplicate protection
olmadan uygulanamaz.

---

## 7. LAG / GECIKME BEKLENTILERI

Bu dosya süreleri kesin sayıya bağlamaz; sınıf tanımlar.

## L1 — anlık / kullanıcı bekliyor
Örnek:
- checkout review
- payment start
- order detail read

## L2 — kısa gecikme kabul edilir
Örnek:
- delivered sonrası notification
- delivered sonrası review/story eligibility yansıması

## L3 — orta gecikme kabul edilir
Örnek:
- admin dashboard summary
- reward summary projection
- discover/search/read model güncellemeleri

Net kural:
Kullanıcı işlem doğrulaması gereken yerde L1,
yan etki ve projection’da L2/L3 kabul edilir.

---

## 8. RETRY KURALI

Retry yalnız şu durumda yapılır:
- işlem retry-safe ise
- idempotency key varsa
- side effect duplicate yaratmayacaksa

Retry uygulanabilecek örnekler:
- notification delivery
- bazı internal command teslimleri
- dependency timeout sonrası kontrollü tekrar

Retry uygulanırken dikkat:
- same command same idempotency key
- backoff
- max attempt
- DLQ / incident visibility

Retry uygulanmaması gereken örnek:
- guard red yemiş command
- invalid transition
- kesin domain rejection

---

## 9. AUDIT VE IZLENEBILIRLIK KURALI

Aşağıdaki akışlar audit ve trace açısından kritik kabul edilir:
- checkout -> payment -> order
- shipment event ingestion
- return decision
- refund execution
- settlement adjustment
- payout action/result
- eligibility revoke
- panel protected actions

Her kritik akışta mümkünse:
- request_id
- command_id
- event_id
- actor/service identity
- previous_state
- next_state
izlenebilir olmalıdır.

---

## 10. IMPLEMENTASYON ICIN NET KARARLAR

Bu dosya kodlama öncesi şu kararları sabitler:

1. Checkout review senkron çalışır
2. Payment başlatma senkron tetiklenir
3. Payment captured sonrası order create ayrı ve idempotent command’dir
4. CheckoutPriceLock ve StockReservation geçici ama first-class işlem bağlamıdır
5. Shipment event append-only ve idempotent işlenir
6. Eligibility ve reward etkileri delivery/return sonrası asenkron yayılır
7. Settlement line line-level oluşturulur
8. Settlement adjustment overwrite değil append mantığıyla ilerler
9. Payout batch, payable settlement line’lardan türetilir
10. Notification akışı ana truth’tan ayrıdır ve asenkron çalışır

---

## 11. KISA OZET

Doğru veri akışı modeli şudur:

- kullanıcıya cevap gereken çekirdek işlem hatları senkron kurulur
- yan etkiler ve projection’lar kontrollü asenkron yürür
- owner truth önce yazılır, event sonra üretilir
- duplicate ve retry ancak idempotent akışlarda kabul edilir
- checkout geçici bağlamı ile order truth’u karıştırılmaz
- payment, order, shipment, refund, settlement ve payout ayrı truth katmanlarıdır
- eligibility ve reward etkileri teslimat/iade sonrası meta katman olarak yayılır
- BFF ve panel truth owner değildir