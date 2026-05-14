# 1. Okunan Dosyalar

| Dosya Yolu | Okundu mu? | İçinde Bulunan Kritik Fonksiyonlar | Not |
| :--- | :--- | :--- | :--- |
| apps/bff/src/server/payment.ts | EVET | `handleInitiatePayment` | Payment BFF entry point, ownership guard var. |
| apps/bff/src/server/order.ts | EVET | `handleCreateOrder`, `handleSimulatePaymentSuccess` | Order BFF entry point, payment success tetiklemesi var. |
| apps/bff/src/server/settlement.ts | EVET | `handleCreateSettlementFromOrder` | Settlement BFF entry point. |
| apps/bff/src/server/provider-callback.ts | EVET | `handleProviderCallbackIngestion` | Provider callback alım ve doğrulama yeri. |
| apps/bff/src/server/guards.ts | EVET | `requireResourceOwnership`, `requireGuestOrCustomer` | Auth ve ownership kontrolleri. |
| apps/bff/src/server/context.ts | EVET | `resolveContext` | Actor context çözümlenmesi. |
| services/payment/src/payment.ts | EVET | `initiatePayment`, `simulatePaymentSuccess` | Payment asıl iş mantığı ve state transition. |
| services/order/src/order.ts | EVET | `createOrderFromPayment` | Order asıl oluşum mantığı. |
| services/settlement/src/settlement.ts | EVET | `createSettlementFromOrder` | Settlement asıl oluşum mantığı. |

# 2. Payment Entry Point

Dosya: `apps/bff/src/server/payment.ts`
Fonksiyon: `handleInitiatePayment`
Kod alıntısı:
```typescript
    const ownershipGuard = requireResourceOwnership(context, checkout.cartContext.actorId);
    if (!ownershipGuard.allowed) {
        // HARDENING-06D: Payment initiation ownership mismatch signal
        const commerceContext = extractCommerceContext(context);
        await createInternalRiskSignal({
```
Bu kod ne yapıyor: Kullanıcının ilgili checkout üzerinde hak sahibi olup olmadığını kontrol ediyor, eğer değilse `PAYMENT_INITIATE_OWNERSHIP_MISMATCH` adıyla internal risk signal oluşturup isteği reddediyor. Başarılı ise `initiatePayment` servisini çağırıyor.
Guard var mı: Evet, `requireGuestOrCustomer` ve `requireResourceOwnership` var.
Karar: SAFE

# 3. Provider Callback Akışı

Dosya: `apps/bff/src/server/provider-callback.ts`
Fonksiyon: `handleProviderCallbackIngestion`
Kod alıntısı:
```typescript
  const verification = verifyProviderCallbackSignature({
    providerName,
    body: input.body,
    headers: input.headers,
  });
  const {
    existingByProviderEventId,
    existingByIdempotencyKey,
  } = await findExistingCallbackByIdentity({
    providerDomain,
    providerName,
    identity,
  });
```
Callback doğrulama var mı: Evet, `verifyProviderCallbackSignature` ve freshness/rate limit kontrolleri yapılıyor.
Idempotency var mı: Evet, `existingByIdempotencyKey` veya `existingByProviderEventId` ile duplicate kontrolü yapılıyor.
State transition nerede: Bu dosyada state transition yapılmıyor, callback sadece DB'ye `recordProviderCallbackEvent` ile kaydediliyor (`pending_insert` statüsünde).
Karar: PARTIAL (Sadece DB'ye yazıyor, payment state'in callback ile nasıl güncellendiği bu dosyada değil).

# 4. Payment → Order Geçişi

Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı:
```typescript
  if (payment.state !== 'SUCCEEDED') {
    console.error(`Order creation failed: payment not succeeded, state=${payment.state}`);
    await createInternalRiskSignal({
      targetId: checkoutId,
      targetType: 'ORDER',
      type: 'PAYMENT_ANOMALY',
      level: 'HIGH',
      source: 'ORDER_SIGNAL',
      reasonCode: 'PAYMENT_ANOMALY',
```
Order ne zaman oluşuyor: Payment nesnesi DB'den alınıp state'inin `SUCCEEDED` olduğu doğrulandıktan sonra oluşuyor.
Payment success şartı açık mı: Evet, açıkça `payment.state !== 'SUCCEEDED'` kontrolü var.
Duplicate order engeli var mı: Evet, `repo.getByIdempotencyKey('order', idempotencyKey)` kullanılıyor.
Karar: SAFE

# 5. Order Snapshot Kontrolü

- price snapshot:
Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı: `unitPriceSnapshot, lineTotalSnapshot,`
Durum: Var

- address snapshot:
Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı: Yok
Durum: Kanıt yetersiz (Sadece `summary: { ...checkout.summary }` kopyalanıyor, açık snapshot property'si kodda görünmüyor).

- variant snapshot:
Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı: `variantId: cl.variantId,`
Durum: Var (Ancak sadece ID tutuluyor, isim veya resim snapshot'ı net değil).

- store context snapshot:
Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı: `storefrontId: cl.storefrontId,`
Durum: Var

- coupon snapshot:
Dosya: `services/order/src/order.ts`
Fonksiyon: `createOrderFromPayment`
Kod alıntısı: Yok
Durum: Kanıt yetersiz.

# 6. Settlement Oluşumu

Dosya: `services/settlement/src/settlement.ts`
Fonksiyon: `createSettlementFromOrder`
Kod alıntısı:
```typescript
  const order = await getOrderById(orderId);
  if (!order) {
    return {
      success: false,
      errors: ['SETTLEMENT_ORDER_NOT_FOUND'],
      warnings: [],
    };
  }
```
Settlement ne zaman oluşuyor: Bir order üzerinden API'ye `orderId` verilerek manuel veya başka bir servis tarafından BFF endpoint'i `handleCreateSettlementFromOrder` çağrıldığında tetikleniyor.
Kim tetikliyor: Koddan doğrudan Order yaratıldığı anda bir event dinleyicisi görünmüyor, `apps/bff/src/server/settlement.ts` üzerinden `requireFinanceRole` yetkisiyle çağrılabiliyor.
Payment/order bağı var mı: Sadece Order'a bağı var (`getOrderById(orderId)`).
Karar: ACCEPTABLE (Manuel/Finance tetikliyor gibi görünüyor, asenkron order-created event dinleyicisi kanıtlanamadı).

# 7. Audit / Outbox Kontrolü

| Mutation | Dosya | Fonksiyon | Kod Alıntısı | Audit Var Mı | Outbox Var Mı | Actor/Context Taşınıyor Mu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Payment initiated | `services/payment/src/payment.ts` | `initiatePayment` | `await auditEvent.audit.appendAuditLog({ actorType: command.cartContext.actorType, actorId: command.cartContext.actorId, actionType: 'payment.initiated',` | Evet | Hayır | Evet |
| Payment succeeded | `services/payment/src/payment.ts` | `simulatePaymentSuccess` | `await auditEvent.audit.appendAuditLog({ actorType: 'SYSTEM', actorId: 'payment-simulator', actionType: 'payment.succeeded',` | Evet | Evet (`topic: 'payment.succeeded'`) | Hayır (SYSTEM olarak geçilmiş) |
| Order created | `services/order/src/order.ts` | `createOrderFromPayment` | `await auditEvent.audit.appendAuditLog({ actorType: 'SYSTEM', actorId: 'order-service', actionType: 'order.created',` | Evet | Evet (`topic: 'order.created'`) | Hayır (SYSTEM olarak geçilmiş) |
| Settlement created | `services/settlement/src/settlement.ts` | `createSettlementFromOrder` | `// mock audit append` | Hayır (Sadece mock blok var) | Hayır | Hayır |

# 8. Kesin Bulgular

- Bulgu: Payment state mutation (`SUCCEEDED`) `simulatePaymentSuccess` içerisinde audit ve outbox yazarak gerçekleşiyor.
- Kanıt dosyası: `services/payment/src/payment.ts`
- Kod alıntısı: `found.state = 'SUCCEEDED'; await repo.save(found);`
- Risk: Düşük

- Bulgu: Order yaratılmadan önce mutlaka Payment state'inin `SUCCEEDED` olduğu teyit ediliyor ve risk sinyalleri entegre edilmiş.
- Kanıt dosyası: `services/order/src/order.ts`
- Kod alıntısı: `if (payment.state !== 'SUCCEEDED') {`
- Risk: Düşük

- Bulgu: Settlement yaratılırken audit loglama mock olarak bırakılmış, gerçek bir sistem entegrasyonu yok.
- Kanıt dosyası: `services/settlement/src/settlement.ts`
- Kod alıntısı: `// mock audit append`
- Risk: Yüksek

# 9. Kanıt Yetersiz Alanlar

- Provider callback geldiğinde, payment veritabanında state'in gerçeğe uygun olarak nasıl güncellendiğine dair bir asenkron worker/job kodu görülmedi. Sadece DB'ye callback tablosuna insert atılıyor.
- Order satırlarında adres ve kupon verilerinin açıkça snapshot olarak tutulup tutulmadığı kanıtlanamadı.
- Settlement oluşumunun `order.created` outbox event'ini dinleyen bir sistem mi olduğu yoksa sadece `requireFinanceRole` BFF guard'ı altındaki REST endpoint'inden mi tetiklendiği net değil.

# 10. Nihai Karar

PARTIAL

Kanıt özeti:
Gerekli dosyalar bizzat okunmuş ve kod bazlı snapshotlar çıkarılmıştır. Payment ve Order zincirindeki kontroller (ownership mismatch, state doğrulama, idempotency, risk sinyalleri) güvenli ve başarılı görünmektedir (SAFE). Ancak Settlement servisindeki Audit mekanizması mock bırakılmış olup risklidir ve Provider Callback sonrası asıl payment state değişiminin nasıl gerçekleştiği incelenen dosyalarda kanıtlanamamıştır. Ayrıca Audit/Outbox kayıtlarına aktarılan Actor bilgileri `SYSTEM` olarak hardcode edilmiş ve izlenebilirlik zayıflatılmıştır.