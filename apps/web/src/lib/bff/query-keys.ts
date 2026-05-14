export const projectionQueryKeys = {
  session: () => ['projection', 'session'] as const,
  home: () => ['projection', 'public-home'] as const,
  discover: (surface: string, scope?: string) => ['projection', 'discover', surface, scope ?? 'global'] as const,
  story: (surface: string, storefrontId?: string) => ['projection', 'story', surface, storefrontId ?? 'global'] as const,
  catalog: (scope: string, value?: string) => ['projection', 'catalog', scope, value ?? 'all'] as const,
  cart: () => ['projection', 'cart'] as const,
  checkout: () => ['projection', 'checkout'] as const,
  payment: (checkoutId?: string, paymentId?: string, paymentAttemptId?: string, state?: string) =>
    ['projection', 'payment', checkoutId ?? 'context-missing', paymentId ?? 'payment-missing', paymentAttemptId ?? 'attempt-missing', state ?? 'owner'] as const,
  order: (scope: string, orderId?: string, orderRef?: string, paymentId?: string, state?: string, shipmentState?: string) =>
    ['projection', 'order', scope, orderId ?? 'order-missing', orderRef ?? 'reference-missing', paymentId ?? 'payment-missing', state ?? 'owner', shipmentState ?? 'owner'] as const,
  returns: (scope: string, returnId?: string, orderId?: string, refundId?: string, state?: string, refundState?: string) =>
    ['projection', 'returns', scope, returnId ?? 'return-missing', orderId ?? 'order-missing', refundId ?? 'refund-missing', state ?? 'owner', refundState ?? 'owner'] as const,
  support: (scope: string, ticketId?: string, orderId?: string, returnId?: string, state?: string) =>
    ['projection', 'support', scope, ticketId ?? 'ticket-missing', orderId ?? 'order-missing', returnId ?? 'return-missing', state ?? 'owner'] as const,
  pdp: (productId: string, storefrontId?: string) => ['projection', 'pdp', productId, storefrontId ?? 'context-required'] as const,
  creator: (surface: string) => ['projection', 'creator', surface] as const,
  supplier: (surface: string) => ['projection', 'supplier', surface] as const,
  admin: (surface: string, id?: string) => ['projection', 'admin', surface, id ?? 'root'] as const,
  storefront: (slug: string) => ['projection', 'storefront', slug] as const,
  search: (query: string) => ['projection', 'search', query.trim()] as const,
  category: (slug?: string) => ['projection', 'category', slug ?? 'root'] as const,
};
