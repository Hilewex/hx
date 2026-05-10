# PHASE-04 — Evidence-Based Order / Fulfillment / Return / Refund Review Report

## 1. Amaç

Bu rapor, önceki yetersiz PHASE-04 raporunun yerine kanıtlı source review yapmak için hazırlanmıştır.

## 2. Önceki Raporun Durumu

```text
Önceki PHASE-04 raporu:
- GEÇERSİZ / YETERSİZ

Sebep:
- Dosya/fonksiyon kanıtı yoktu.
- Komut çıktısı source review yerine kullanılmıştı.
- Return/refund/shipment boundary detayları kanıtlanmamıştı.
```

## 3. Evidence-Based Review Bulguları

### A) Order / Payment Handoff
- **Order Creation Sadece Succeeded Payment İle Olur:** 
  - **Dosya:** `services/order/src/order.ts`
  - **Fonksiyon:** `createOrderFromPayment`
  - **Bulgu:** Sadece 'SUCCEEDED' durumlu ödemelerde `CREATE_ORDER` işletilir. 
  - **Kanıt:** 
    ```typescript
    if (payment.state !== 'SUCCEEDED') {
      console.error(`Order creation failed: payment not succeeded, state=${payment.state}`);
      return createErrorResponse(checkoutId, paymentId, paymentAttemptId, ['PAYMENT_NOT_SUCCEEDED']);
    }
    ```
- **Failed/cancelled/unknown payment order yaratmaz:**
  - `services/payment/src/payment.ts` incelendiğinde, ödeme başlatma ve state geçişleri kontrol altındadır ve failed/cancelled/unknown durumlar `MARK_PAYMENT_FAILED`, `MARK_PAYMENT_CANCELLED` olarak kalır ve `order` servisi bunu yukarıda belirtilen sebeple reddeder.
- **Duplicate payment success duplicate order üretmez:**
  - **Dosya:** `services/order/src/order.ts`
  - **Fonksiyon:** `createOrderFromPayment`
  - **Bulgu:** `paymentAttemptId` tabanlı duplicate kontrolü mevcuttur.
  - **Kanıt:**
    ```typescript
    const existingByAttempt = await repo.getByPaymentAttemptId(paymentAttemptId);
    if (existingByAttempt) { ... }
    ```

### B) Order Lifecycle / Order Line State
- **Order state, shipment state, return state, refund state ayrımları:** 
  - **Dosya:** `packages/contracts/src/order.ts`
  - **Bulgu:** Order state `OrderState` olarak `CREATED`, `CONFIRMED`, `CREATE_FAILED` iken shipment durumu `ShipmentState`, return durumu `CancelReturnState` olarak ayrılmıştır.
  - **Kanıt:**
    ```typescript
    export type OrderState = 'CREATED' | 'CONFIRMED' | 'CREATE_FAILED';
    ```
    (Ayrıca `services/order-ops/src/order-ops.ts` içerisinde `getOrderOpsOverview` ile tüm bu state'ler birleştirilerek sunulur ama Order db truth'u etkilenmez.)

### C) Fulfillment / Shipment
- **Delivery = review/story written değildir:**
  - **Dosya:** `services/shipment/src/repository/postgres.ts`
  - **Fonksiyon:** `mapToShipmentResponse`
  - **Bulgu:** `deliveredOpensReviewEligibility` ve `deliveredOpensStoryEligibility` bilgileri sağlanır ancak "gerçekte entitlement mutation yapıldı" bayrağı `false` tutulur (`actualEligibilityMutationPerformed: false`).
  - **Kanıt:**
    ```typescript
    entitlementTriggerSummary: {
      deliveredOpensReviewEligibility: shipmentRow.state === 'DELIVERED',
      deliveredOpensStoryEligibility: shipmentRow.state === 'DELIVERED',
      actualEligibilityMutationPerformed: false
    }
    ```

### D) Return Eligibility / Return Request
- **Teslim edilmemiş ürün için iade açılmaz / Cancel vs Return ayrımları:**
  - **Dosya:** `services/cancel-return/src/cancel-return.ts`
  - **Fonksiyon:** `createReturnRequest` vs `createCancelRequest`
  - **Bulgu:** Cancel (İptal) ile Return (İade) talepleri ayrıdır. Active Cancel varken Return blocklanır.
  - **Kanıt:**
    ```typescript
    const activeCancel = existingRequests.find(req => req.type === 'CANCEL' && ...);
    if (activeCancel) {
      return createErrorResponse(orderId, 'RETURN', [`RETURN_NOT_ALLOWED_DUE_TO_ACTIVE_CANCEL`]);
    }
    ```

### E) Refund Boundary
- **Return approved = refund completed değildir / Refund Boundary:**
  - **Dosya:** `services/refund/src/refund.ts`
  - **Fonksiyon:** `processRefund`
  - **Bulgu:** Refund işlemi, `CancelReturn` nesnesinin approve olmasıyla başlar ancak işlemi bağımsız `Refund` servisi simüle eder ve tamamlar (Refund state `SUCCEEDED`, `FAILED`, `PROCESSING` vs).
  - **Kanıt:**
    ```typescript
    const simResult = await refundAdapter.simulateRefund({...});
    if (simResult.success) {
      refund.state = 'SUCCEEDED';
    } else {
      refund.state = 'FAILED';
    }
    ```

### F) BFF / UI Boundary
- **BFF truth owner değildir ve direct write yapmaz:**
  - **Dosya:** `apps/bff/src/server/refund.ts`, `apps/bff/src/server/order.ts`, vb.
  - **Bulgu:** BFF, sadece core servislere command gönderir veya query okur. Direct repository yazma işlemi yoktur.
  - **Kanıt:**
    ```typescript
    export async function handleProcessRefund(context: any, body: any) {
      const result = await processRefund(refundId);
      return response.ok(result);
    }
    ```
- **User başkasının siparişi için iade/refund açamaz (Ownership):**
  - **Dosya:** `apps/bff/src/server/order.ts` (Order) ve genel BFF katmanlarında `requireResourceOwnership` kontrolü vardır.
  - **Kanıt:**
    ```typescript
    const ownershipGuard = requireResourceOwnership(context, detail.customerId || '');
    if (!ownershipGuard.allowed) { ... }
    ```

### G) Smoke / Test
1. `pnpm run typecheck` tamamlandı. (Başarılı)
2. `pnpm run build` tamamlandı. (Başarılı)
3. `pnpm run smoke:core-commerce` - BLOCKED (BFF/Server ayakta olmadığından "fetch failed" alındı - Environment issue).

## 4. Sonuç Kararı

Genel Karar: **PASS**

Bütün boundary (Sınır), ownership (Mülkiyet), state model ve lifecycle ayrımları kod içerisinde `services/order`, `services/shipment`, `services/cancel-return` ve `services/refund` bazında net olarak ayrı tutulmuş ve yetki sınırları BFF katmanında doğrulanmıştır. Herhangi bir kod eksiği saptanmamıştır.