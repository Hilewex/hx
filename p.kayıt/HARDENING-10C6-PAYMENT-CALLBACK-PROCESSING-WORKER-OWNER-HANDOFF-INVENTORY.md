# HARDENING-10C6 - Payment Callback Processing Worker / Owner Command Handoff Inventory

## 1. Genel Durum

10C5 ile PayTR callback live BFF ingestion path icinde PayTR payload'u `provider_callback_events.normalized_payload` alanina `NormalizedPaymentCallbackCandidate` modeli olarak yazilmaya basladi. PayTR hash verification mapping helper icinde calisiyor, `rawPayload` korunuyor, PayTR ACK policy `text/plain OK` olarak kaliyor ve duplicate callback mevcut callback record'unu overwrite etmiyor.

Payment callback halen payment truth degildir. Provider callback record dis saglayicidan gelen sinyali, verification/replay/processing durumunu ve normalize edilmis aday karari tutar; payment state transition ise yalniz payment owner tarafindan guard, idempotency ve audit/event politikasi ile uygulanabilir.

Bu inventory, provider callback kayitlarinin hangi worker modeliyle okunacagini, hangi candidate'larin owner command'a donusebilecegini, paymentAttempt lookup ve merchant_oid stratejisinin nasil netlesmesi gerektigini ve order/finance/risk boundary'lerinin nerede duracagini kararlastirmak icin hazirlanmistir.

## 2. Mevcut Callback Record Gercekligi

`provider_callback_events` tablosu provider callback ingestion kaydidir. Provider domain/name/mode, callback type, provider event id, provider reference, idempotency key, correlation/causation/request id, verification status, replay status, processing status, raw payload, normalized payload, error, boundary, received/processed timestamp alanlarini tasir.

`rawPayload` provider'dan gelen ham kanittir. `normalizedPayload` business truth degil, provider payload'unun sistem tarafindan anlasilir callback candidate modeline donusturulmus halidir. PayTR icin bu alan `candidate`, `hashVerified` ve `paytrStatus` tasir; config kullanilamazsa diagnostic object tasir.

`processingStatus` mevcut anlamlari:

| Status | Mevcut anlam |
|---|---|
| `received` | Ingestion basarili, worker tarafindan henuz owner handoff yapilmadi. |
| `accepted` | Callback sistem tarafindan islenmis/handed off kabul edilebilir duruma cekilebilir. |
| `duplicate` | Ingestion response'ta duplicate olarak doner; mevcut kayit overwrite edilmez. Persisted ilk kayit genelde orijinal statusunu korur. |
| `rejected` | Generic signature/freshness guard tarafindan invalid veya replay/freshness problemi saptanmis kayit. |
| `failed` | Worker veya processing sirasinda beklenmeyen hata icin kullanilabilir. |
| `ignored` | Valid ama owner command gerektirmeyen callback icin kullanilabilir. |

`markProviderCallbackEventProcessed(id, processingStatus, processedAt)` tek kaydin `processing_status` ve `processed_at` alanlarini gunceller. Bu payment truth mutate etmez; yalniz callback processing lifecycle marker'idir.

`listProviderCallbackEventsByProcessingStatus(processingStatus, limit)` DB polling worker icin source olabilir. `received` kayitlari oldest-first listelenebilir. Ancak once atomic claim/lock veya `received -> accepted/failed` concurrency tasarimi gereklidir; mevcut interface basit listeleme saglar, multi-worker race'i tek basina cozmez.

`candidate.callbackRecordId` su an `pending_insert` limitation tasir; cunku BFF mapping insert oncesi calisir ve provider callback repository insert etmeden record id bilinmez. Gercek callback id ile zenginlestirme icin iki asamali insert/update veya insert sonrasi normalized payload update tasarimi gerekir.

## 3. Normalized Candidate Processing Karari

Degerlendirilecek alanlar:

| Alan | Karar |
|---|---|
| `candidate.normalizedStatus` | Owner command eligibility'nin ana sonuc statusudur. |
| `candidate.ownerCommandCandidate` | Worker'in payment owner'a hangi command'i onerecegini gosterir; tek basina mutation yetkisi vermez. |
| `candidate.shouldProcess` | `true` ise paymentAttempt lookup ve owner guard'lardan sonra owner command'a adaydir. |
| `candidate.shouldReject` | `true` ise owner mutation yapilmaz; callback rejected/ignored/reconcile candidate olarak isaretlenir. |
| `candidate.shouldReconcile` | Status inquiry/reconciliation hattina adaydir; success gibi kabul edilmez. |
| `candidate.paymentAttemptId` | Owner lookup icin tercih edilen anahtar; 10C5 live path'te yoktur. |
| `candidate.paymentId` | Varsa dogrudan owner aggregate baglami saglar; 10C5 live path'te yoktur. |
| `candidate.checkoutId` | Order/checkout baglami icin yararli projection; owner lookup yerine gecmez. |
| `candidate.providerReference` | PayTR icin `merchant_oid`; provider truth referansidir. |
| `candidate.riskFlags` | Risk candidate sinyali olabilir; 10C6 risk truth mutate etmez. |
| `candidate.verificationStatus` | PayTR hash verification sonucudur; generic record `verificationStatus` ile karistirilmamalidir. |
| `candidate.replayStatus` | Replay/idempotency guard girdisidir. |

Net karar:

- Process edilebilir candidate: `shouldProcess=true`, `shouldReject=false`, `signatureVerified=true`, replay rejected degil, `paymentAttemptId` veya kesin lookup stratejisi mevcut olan `succeeded` ve `failed` candidate'lar.
- Reject edilir: `signature_failed`, `rejected_replay`, `rejected_freshness`, identity conflict, amount/currency mismatch, reference missing ve verification failed durumlari.
- Reconciliation'a birakilir: `pending`, `unknown_result`, `unsupported`, `payment_attempt_not_found`, amount/currency mismatch ve lookup/identity belirsizligi tasiyan durumlar.
- Risk candidate olarak isaretlenir ama risk truth mutate etmez: bad hash, replay, duplicate storm, amount mismatch, currency mismatch, paymentAttempt not found, stale/future callback ve unsupported status.

## 4. PaymentAttempt Lookup Karari

PayTR callback `merchant_oid` tasir. Mevcut 10C5 mapping bunu `providerEventId`, `providerReference` ve candidate idempotency key parcasi olarak kullanir.

`merchant_oid` su anda otomatik olarak paymentAttemptId degildir. PayTR initiate live olmadigi icin sistemin PayTR'ye hangi `merchant_oid` degerini gonderecegi henuz contract olarak sabitlenmemistir. En guvenli strateji, PayTR initiate tasarlanirken `merchant_oid` degerini sistem tarafindan uretilen veya sistemde kesin lookup edilebilen stable payment attempt reference yapmak, bu referansi payment kaydinda saklamak ve callback'te ayni referansi aramaktir.

Degerlendirme:

| Soru | Karar |
|---|---|
| `merchant_oid` paymentAttemptId midir? | Henuz degil; oyle olmasi isteniyorsa PayTR initiate contract'inda acikca sabitlenmeli. |
| `merchant_oid` checkoutId midir? | Olmamali; checkout birden fazla payment attempt uretebilir. |
| `merchant_oid` idempotencyKey midir? | Tek basina owner command idempotency key olabilir ama payment lookup icin yeterli degildir. |
| Mevcut repository lookup yapabilir mi? | `getByPaymentAttemptId` ve `getByIdempotencyKey(namespace,key)` var; providerReference/merchant_oid lookup yok. |
| PayTR initiate henuz live degilken nasil tasarlanmali? | `merchant_oid` = payment attempt centric stable provider order id olarak tasarlanmali ve payment kaydinda lookup edilebilir olmalidir. |

Net karar: PayTR initiate yapilmadan gercek paymentAttempt lookup tamamlanamaz. 10C7 oncesi veya 10C7 kapsaminda `merchant_oid` stratejisi netlesmelidir; aksi halde worker only foundation owner mutation'a gecemez.

## 5. Owner Command Handoff Karari

Worker mapping layer candidate'i okur, lookup/rejection/reconciliation kararini verir ve payment owner command olusturur. Payment state transition'i payment service uygular. Worker dogrudan repository'de payment state mutate etmemelidir; payment service icindeki owner command API'sine idempotent command gondermelidir.

BFF payment truth mutate edemez. Provider callback repository payment truth mutate edemez. Worker da payment owner degilse yalniz handoff/dispatch katmani olmali, final state mutation'i payment owner komutu icinde yapilmalidir.

Onerilen owner command idempotency key:

```text
payment-callback:{providerName}:{providerEventId}:{ownerCommandCandidate}
```

Daha guvenli format, provider domain ve lookup sonucu paymentAttemptId eklendiginde:

```text
payment-callback:{providerDomain}:{providerName}:{providerEventId}:{paymentAttemptId}:{ownerCommandCandidate}
```

`providerEventId` yoksa fallback olarak callback record id kullanilabilir:

```text
payment-callback:{providerDomain}:{providerName}:record:{callbackRecordId}:{ownerCommandCandidate}
```

## 6. Payment State Model Gap Analizi

Mevcut model:

- `PaymentState`: `CREATED`, `INITIATED`, `FAILED`, `CANCELLED`, `SUCCEEDED`
- `PaymentAttemptState`: `CREATED`, `PROVIDER_REDIRECT_READY`, `INITIATION_FAILED`, `SUCCEEDED`

Acik riskler:

- Payment tarafinda `PENDING`/`PROCESSING` yok.
- `UNKNOWN_RESULT` yok.
- Attempt icin `FAILED` yok; sadece `INITIATION_FAILED` var.
- Attempt icin `CANCELLED` ve `EXPIRED` yok.
- Callback processed marker payment state'te yok.
- Provider callback id / provider event id / owner command idempotency izi payment aggregate icinde tasarlanmamis.

Net karar: 10C7'de once state model ve owner command contract foundation gerekir. Sadece `succeeded/failed` minimal transition teknik olarak yapilabilir, ancak failed attempt state eksigi ve callback marker yoklugu nedeniyle kisa surede duplicate/order/reconciliation riski uretir. Minimal transition ancak state/command contract ile birlikte ve order handoff'suz tasarlanmalidir.

## 7. Worker/Polling Model Karari

### A) Synchronous BFF processing

Arti:

- En az altyapi gerektirir.
- Callback alinir alinmaz karar verilebilir.

Risk:

- PayTR ACK gecikebilir.
- BFF truth owner degildir.
- Provider retry ve domain mutation ayni request lifecycle'ina karisir.
- Amount/currency/paymentAttempt lookup hatalari PayTR response policy'yi bozabilir.

Karar: Onerilmez. Ingestion ve domain mutation ayrilmali.

### B) Provider callback DB polling worker

Arti:

- `provider_callback_events` zaten source olabilir.
- BFF response hizli kalir.
- PayTR `OK` response gecikmez.
- Domain mutation ingestion'dan ayrilir.
- Retry, failed, ignored, reconciliation marker'lari callback lifecycle uzerinden yonetilebilir.

Risk:

- Atomic claim/lock tasarimi gerekir.
- Multi-worker idempotency owner command seviyesinde zorunludur.
- `pending_insert` callbackRecordId limitation'i cozulmeli veya callback record id kayittan okunarak kullanilmalidir.

Karar: Ilk implementation icin onerilen model DB polling worker foundation'dir.

### C) Outbox/event queue worker

Arti:

- Uzun vadede daha net delivery/retry modeli.
- Event consumer idempotency ve observability daha guclu kurulabilir.

Risk:

- Su an callback ingestion outbox guarantee vermiyor.
- Yeni event/outbox contract'i ve migration gerektirir.
- 10C6 sonrasi ilk domain handoff icin fazla buyuk kapsam.

Karar: Sonra. Ilk worker foundation DB polling ile kurulup, ileride outbox/event queue modeline tasinabilir.

## 8. Processing State Transition Tasarimi

Onerilen callback lifecycle:

```text
received -> accepted
received -> rejected
received -> ignored
received -> failed
failed -> received veya accepted retry sonucu
```

`duplicate` persisted original kayit statusu olmak zorunda degildir; duplicate ingestion response'ta gorunur. Duplicate callback yeni insert yapmadigi icin worker ayni original record'u tekrar islememelidir.

Worker `received` statusundeki `payment/paytr` kayitlari alir. Ek olarak `failed` kayitlari retry policy ile alinabilir. Worker kaydi islemeye baslamadan once atomic claim ihtiyaci vardir; mevcut repo bunu dogrudan saglamadigi icin ilk foundation'da single worker veya claim extension gerekir.

`received -> accepted`: Candidate owner command'a uygun bulunup payment owner command idempotent sekilde basariyla kabul edildiginde veya owner tarafindan already-processed no-op sonucu dondugunde olur.

`failed/retry`: Gecici repository/service hatasinda `failed` yazilir; error field extension ileride gerekir. Retry sayisi/backoff mevcut contract'ta yoktur.

`duplicate`: Duplicate callback yeni kayit olusturmaz; mevcut kayit tekrar overwrite edilmez. Worker duplicate response'u degil persisted original record'u gorur.

`rejected`: `shouldReject=true`, bad hash, replay/freshness rejected, amount/currency mismatch gibi owner mutation yapilmayan durumlar.

`shouldReconcile=true`: Owner mutation yapilmaz; callback `accepted` yerine `ignored` veya `rejected` degil, ileride `reconciliation_required` status ihtiyaci dogurur. Mevcut enumda bu olmadigi icin 10C7/10C8'de status extension degerlendirilmeli; simdilik `accepted` + reconciliation queue projection veya `failed` disinda ayri metadata gerekir.

## 9. Payment Owner Transition Scope

| normalizedStatus | ownerCommandCandidate | paymentAttempt lookup gerekli mi? | owner state transition yapilir mi? | provider callback status | order handoff olur mu? | reconciliation gerekir mi? | risk candidate olur mu? |
|---|---|---:|---:|---|---:|---:|---:|
| `succeeded` | `MARK_PAYMENT_SUCCEEDED` | Evet | Evet, owner guard sonrasi | `accepted` | Hayir | Hayir | Hayir |
| `failed` | `MARK_PAYMENT_FAILED` | Evet | Evet, state model destekleyince | `accepted` | Hayir | Hayir | Opsiyonel |
| `pending` | `MARK_PAYMENT_PENDING` | Evet | 10C7 state model olmadan hayir | `accepted` veya future `reconciliation_required` | Hayir | Evet | Hayir |
| `cancelled` | `MARK_PAYMENT_CANCELLED` | Evet | State model destekleyince | `accepted` | Hayir | Hayir | Hayir |
| `expired` | `MARK_PAYMENT_EXPIRED` | Evet | State model destekleyince | `accepted` veya future `reconciliation_required` | Hayir | Evet | Hayir |
| `unknown_result` | `NONE` | Evet | Hayir | future `reconciliation_required` | Hayir | Evet | Evet |
| `signature_failed` | `NONE` | Hayir | Hayir | `rejected` | Hayir | Hayir | Evet |
| `rejected_amount_mismatch` | `NONE` | Evet | Hayir | `rejected` | Hayir | Evet | Evet |
| `rejected_currency_mismatch` | `NONE` | Evet | Hayir | `rejected` | Hayir | Evet | Evet |
| `payment_attempt_not_found` | `NONE` | Lookup denendi | Hayir | future `reconciliation_required` veya `failed` | Hayir | Evet | Evet |
| `duplicate` | `NONE` | Hayir | Hayir | `ignored` | Hayir | Hayir | Opsiyonel |
| `rejected_replay` | `NONE` | Hayir | Hayir | `rejected` | Hayir | Hayir | Evet |
| `rejected_freshness` | `NONE` | Hayir | Hayir | `rejected` | Hayir | Evet | Evet |
| `unsupported` | `NONE` | Opsiyonel | Hayir | `ignored` veya future `reconciliation_required` | Hayir | Evet | Evet |

## 10. Order Boundary

Payment callback worker dogrudan order create cagirmamalidir. Payment SUCCEEDED olmadan order create olamaz. Duplicate callback duplicate order yaratmamalidir; bunun icin payment callback command idempotency ve order create idempotency ayrica korunmalidir.

Order handoff 10C6'da yoktur. 10C7/10C8'de bile once payment owner success event/outbox gerekir. Payment owner `SUCCEEDED` state'i resmi olarak yazmadan order create command tetiklenmemelidir.

Onerilen order idempotency key:

```text
order-from-payment:{paymentId}:{paymentAttemptId}
```

Provider callback id veya PayTR `merchant_oid` dogrudan order idempotency key olmamalidir; order payment owner success outcome'una baglanmalidir.

## 11. Finance / Settlement Boundary

Payment callback settlement/hakedis yaratmaz. Payment success ile hakedis ayni sey degildir. Payment success yalniz tahsilat sonucunun payment owner tarafindan kesinlestirilmesidir; hakedis siparis, teslimat, iade/iptal ve risk pencereleriyle ayrica degerlendirilir.

Amount/currency mismatch bu hatta finance correction uretmez. Once payment owner/reconciliation tarafinda mismatch dogrulanir. Finance correction ancak official owner outcome, siparis/odeme baglami ve finansal etki belirlendikten sonra devreye girer.

Net karar: Finance/settlement mutation bu hatta yoktur.

## 12. Risk / Fraud Boundary

Risk candidate durumlari:

| Durum | Risk candidate karari |
|---|---|
| bad hash | `PAYTR_HASH_FAILED`, high confidence anomaly. |
| replay | Replay/duplicate storm izlenmeli. |
| duplicate storm | Rate/velocity sinyali olabilir. |
| amount mismatch | Finansal spoof/anomaly candidate. |
| currency mismatch | Finansal spoof/anomaly candidate. |
| paymentAttempt not found | Suspicious or operational mismatch candidate. |
| stale/future callback | Freshness/replay anomaly candidate. |
| unsupported status | Provider contract drift/anomaly candidate. |

Bu inventory risk signal uretmez ve risk truth mutate etmez. Risk linkage, payment callback worker owner transition foundation stabil olduktan sonra ayri pakette ele alinmalidir. Onerilen yer: 10C10 reconciliation inventory sonrasinda veya 10C11 order handoff boundary oncesinde `Payment Callback Risk Signal Linkage / Advisory Only` paketi.

## 13. Reconciliation Boundary

`shouldReconcile=true`, callback'in dogrudan payment owner success/failure mutation'i icin yeterli kesinlikte olmadigini, provider status inquiry veya internal lookup/review gerektirdigini ifade eder. Bu success sayilmaz, failure sayilmaz, order tetiklemez.

Status inquiry su durumlarda gerekir:

- `unknown_result`
- `pending`
- `unsupported`
- `payment_attempt_not_found`
- amount/currency mismatch
- stale/future callback
- provider status ile internal state celiskisi

PayTR Durum Sorgu API 10C10 veya sonraki reconciliation runtime paketinde devreye girmelidir. 10C6 sadece boundary ve karar envanteri yapar.

`unknown_result` ve `pending` reconciliation queue/projection'a gider. `paymentAttempt not found` once merchant_oid/paymentAttempt stratejisi ve provider inquiry ile cozulmelidir; dogrudan failed/succeeded yazilmaz.

## 14. Ilk Implementation Roadmap

### HARDENING-10C7 - Payment Callback State Model / Owner Command Contract Foundation

Amac: Payment callback owner command contract'ini ve state model eksiklerini kapatmak.

Scope: Payment/attempt state extension, callback owner command DTO, idempotency key policy, paymentAttempt/provider reference lookup contract inventory veya foundation.

Yasakli alanlar: Worker runtime, BFF route degisikligi, order handoff, finance/risk mutation, live PayTR initiate.

Kabul kaniti: Contract/type smoke veya unit-level command decision testleri; state enum ve transition policy dokumantasyonu.

Neden bu sirada: Worker owner command gondermeden once hedef command ve state makinesi net olmalidir.

### HARDENING-10C8 - Payment Callback Processing Worker Foundation / No Order Handoff

Amac: `provider_callback_events` uzerinden DB polling worker foundation kurmak.

Scope: `received` callback listesi, single-worker claim veya basit polling, candidate parse, reject/ignore/accepted marker, no payment mutation mode veya dry-run handoff.

Yasakli alanlar: Order create, finance/risk mutation, PayTR status inquiry, BFF ACK degisikligi.

Kabul kaniti: Worker received kaydi alip callback processing statusunu dogru lifecycle'a ceker; duplicate overwrite yapmaz.

Neden bu sirada: Domain mutation'dan once ingestion disi processing lifecycle kurulmalidir.

### HARDENING-10C9 - Payment Owner Transition for Succeeded/Failed Callback

Amac: Verified succeeded/failed callback'leri payment owner command ile idempotent state transition'a baglamak.

Scope: `MARK_PAYMENT_SUCCEEDED`, `MARK_PAYMENT_FAILED`, paymentAttempt lookup, owner command idempotency, audit/outbox payment result event.

Yasakli alanlar: Order create direct call, finance/risk mutation, reconciliation API.

Kabul kaniti: Ayni callback ikinci kez geldiginde ikinci payment/order etkisi uretmez; payment owner state dogru guncellenir.

Neden bu sirada: Sadece worker foundation ve command contract hazir olduktan sonra owner mutation guvenli olur.

### HARDENING-10C10 - Payment Callback Reconciliation Candidate / Status Inquiry Inventory

Amac: `shouldReconcile=true` durumlar icin inquiry ve reconciliation modelini tasarlamak.

Scope: PayTR Durum Sorgu API inventory, reconciliation candidate status, retry/backoff, operator visibility.

Yasakli alanlar: Hakiki finance settlement, order handoff, automatic risk case mutation.

Kabul kaniti: `pending`, `unknown_result`, `payment_attempt_not_found`, mismatch durumlari icin net status inquiry karari.

Neden bu sirada: Success/failed minimal transition sonrasi belirsiz durumlar resmi runtime ister.

### HARDENING-10C11 - Payment Success Event / Order Handoff Boundary

Amac: Payment owner success event/outbox ile order create handoff boundary'sini kurmak.

Scope: `payment.succeeded` outbox/consumer idempotency, order command idempotency key, no direct callback-to-order path.

Yasakli alanlar: Finance settlement, risk enforcement, provider callback BFF mutation.

Kabul kaniti: Payment success event order command'a tekil ve duplicate-safe sekilde gider; duplicate callback duplicate order uretmez.

Neden bu sirada: Order ancak payment owner success truth sonrasinda baslamalidir.

### HARDENING-10C12 - PayTR Real Test Callback E2E Sandbox Validation

Amac: PayTR sandbox initiate/callback gercek uctan uca dogrulama.

Scope: PayTR merchant_oid strategy, sandbox initiate, callback hash verification, paymentAttempt lookup, worker processing.

Yasakli alanlar: Production secret hardcode, finance/risk mutation, uncontrolled order creation.

Kabul kaniti: Sandbox callback provider record, normalized payload, worker handoff ve payment owner result path'i dogrulanir.

Neden bu sirada: Contract, worker, owner transition ve handoff boundary kurulmadan real E2E dogrulama eksik kalir.

## 15. Domain Processing Readiness Karari

Payment owner mutation'a hemen gecilmemelidir. Once state model/owner command contract gerekir. Once worker foundation gerekir. Once paymentAttempt/merchant_oid stratejisi gerekir.

Readiness sirasi:

1. `merchant_oid` -> paymentAttempt/provider reference stratejisi.
2. Payment state/attempt state ve callback owner command contract.
3. DB polling worker foundation.
4. Succeeded/failed icin idempotent owner transition.
5. Reconciliation runtime.
6. Payment success event ile order handoff.

## 16. Acik Riskler

- `merchant_oid` mapping belirsizligi.
- `candidate.callbackRecordId` placeholder: `pending_insert`.
- Live callback candidate icinde `paymentAttemptId` yoklugu.
- Expected amount/currency live lookup yoklugu.
- Payment state modelinde pending/unknown/failed attempt/cancelled/expired eksikleri.
- Callback processed marker'in payment aggregate icinde olmamasi.
- Duplicate callback'in ileride duplicate order yaratma riski.
- Worker atomic claim/retry/backoff eksikligi.
- Reconciliation runtime yoklugu.
- PayTR status inquiry eksikligi.
- Risk/finance boundary'nin yanlis yerde mutate edilme riski.
- Generic signature guard ile PayTR hash verification ayriminin operasyonel karisikliga yol acma riski.

## 17. Nihai Karar

**PAYMENT CALLBACK WORKER / OWNER HANDOFF INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Domain processing hala baslamamistir.

Payment owner mutation hala yoktur.

Order/finance/risk mutation hala yoktur.

Siradaki onerilen paket:

**HARDENING-10C7 - Payment Callback State Model / Owner Command Contract Foundation**

Bu inventory paketinde build/typecheck/smoke calistirilmadi. Git komutu calistirilmadi. `pnpm install` calistirilmadi.
