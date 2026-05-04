# HARDENING-05E: Commerce Permission Enforcement Design

## 1. Analysis of Current State
Currently, commerce routes (`cart`, `checkout`, `payment`, `order`) rely on an ad-hoc mapping function:
```typescript
function mapToCartContext(context: any): { actorType: 'CUSTOMER' | 'GUEST'; actorId: string } {
  return {
    actorType: context.role === 'CUSTOMER' ? 'CUSTOMER' : 'GUEST',
    actorId: String(context.userId || context.actorId || 'anon')
  };
}
```
This is problematic because:
- Unauthenticated requests might still pass a legacy `x-actor-id` header, which could be mistakenly used as `actorId` even though the user is a GUEST.
- The fallback `'anon'` is weak and prevents tracking unique guest carts reliably without a proper session identifier.
- The `order.ts` handlers (`handleCreateOrder`, `handleGetOrderDetail`) completely lack context validation, trusting whatever is provided or passing without authorization checks.

## 2. Helper Functions for `guards.ts`
We will introduce the following helper functions in `apps/bff/src/server/guards.ts` to standardize commerce context extraction and permission enforcement:

### `requireGuestOrCustomer(context: ActorContext): GuardResult`
Validates that the actor is permitted to perform commerce actions.
- Allowed roles: `CUSTOMER` (authenticated) or `GUEST` / `ANONYMOUS` (unauthenticated).
- Blocks administrative roles (`ADMIN`, `OPERATOR`) from performing direct commerce actions on their own behalf unless specifically allowed (typically blocked in B2C flows).

### `extractCommerceContext(context: ActorContext): { actorType: 'CUSTOMER' | 'GUEST', actorId: string }`
Reliably extracts the commerce actor.
- If `isAuthenticated === true` and `role === 'CUSTOMER'`, returns `{ actorType: 'CUSTOMER', actorId: context.actorId }`.
- If `isAuthenticated === false`, returns `{ actorType: 'GUEST', actorId: context.sessionId }`.
- Throws an error or returns `null` if the context is invalid.

### `requireResourceOwnership(context: ActorContext, resourceOwnerId: string): GuardResult`
General-purpose guard to verify that the extracted commerce `actorId` matches the `resourceOwnerId` (e.g., cart owner, order owner).

## 3. Enforcement Strategy

### Cart (`apps/bff/src/server/cart.ts`)
- Replace local `mapToCartContext` with `extractCommerceContext`.
- Ensure routes enforce `requireGuestOrCustomer`.
- Pass the trusted extracted context to `getCart`, `addToCart`, `updateCartLine`, and `removeCartLine`.

### Checkout (`apps/bff/src/server/checkout.ts`)
- Replace local `mapToCartContext` with `extractCommerceContext`.
- Enforce `requireGuestOrCustomer`.
- Pass the trusted `cartContext` to `startCheckout`.

### Payment (`apps/bff/src/server/payment.ts`)
- Replace local `mapToCartContext` with `extractCommerceContext`.
- Override any `cartContext` provided in the request body with the securely extracted context before passing it to `initiatePayment`.

### Order (`apps/bff/src/server/order.ts`)
- **Get Order Details (`handleGetOrderDetail`)**: 
  - Extract the commerce context.
  - Fetch the order details.
  - Apply `requireResourceOwnership` to ensure `context.actorId === order.customerId` (or guest sessionId). If mismatch, return `NOT_FOUND` or `FORBIDDEN`.
- **Create Order (`handleCreateOrder`)**:
  - Securely extract the context and ensure the `CreateOrderCommand` uses the authenticated/session actor, preventing arbitrary `customerId` assignment from the client payload.

## 4. Execution Plan (Coding Phase)
1. Implement `requireGuestOrCustomer`, `extractCommerceContext`, and `requireResourceOwnership` in `apps/bff/src/server/guards.ts`.
2. Refactor `cart.ts` to utilize the new helpers.
3. Refactor `checkout.ts` to utilize the new helpers.
4. Refactor `payment.ts` to securely inject the actor context into payment commands.
5. Refactor `order.ts` to secure data retrieval and creation.
6. Verify endpoints via local testing / smoke tests to ensure GUEST flows use `sessionId` and CUSTOMER flows use `actorId`, while rejecting legacy headers for unauthenticated requests.
