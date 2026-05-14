import { expect, test } from '@playwright/test';

test('homepage renders public projection surfaces and transport state', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'HX home' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse creators, stories, and product candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stories from projection candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mixed discovery feed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product discovery candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Homepage projection state' })).toBeVisible();
});

test('search page renders empty query and projected query states', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Search' }).click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No search query' })).toBeVisible();

  await page.goto('/search?q=studio');
  await expect(page.getByRole('heading', { name: 'Search', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Search projection state' })).toBeVisible();
});

test('category page renders category projection, product rail, and empty/degraded state', async ({ page }) => {
  await page.goto('/category?surface=style');

  await expect(page.getByRole('heading', { name: 'Category', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse entry points' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mixed discovery feed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product discovery candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Category projection state|Projection returned empty|Projection unavailable/ })).toBeVisible();
});

test('storefront page renders storefront projection surfaces', async ({ page }) => {
  await page.goto('/store/studio-preview');

  await expect(page.getByRole('heading', { name: 'studio-preview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stories from projection candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product discovery candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mixed discovery feed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Storefront projection state|Projection returned empty|Projection unavailable/ })).toBeVisible();
});

test('PDP renders projection-safe product, variants, reviews, Q&A, and action surface', async ({ page }) => {
  await mockPdpProjection(page);
  await page.goto('/product/p_valid?storefrontId=s_feno_1');

  await expect(page.getByRole('heading', { name: 'Valid Product' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose a variant preview' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Black/ })).toBeVisible();
  await page.getByRole('radio', { name: /White/ }).click();
  await expect(page.getByRole('radio', { name: /White/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: 'Customer context projections' })).toBeVisible();
  await expect(page.getByText('Projection review snippet without purchase badge.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart readiness placeholder' })).toBeVisible();
});

test('PDP renders degraded and missing product states without commerce truth', async ({ page }) => {
  await mockPdpProjection(page, { degradeStories: true });
  await page.goto('/product/p_valid?storefrontId=s_feno_1');
  await expect(page.getByRole('heading', { name: 'Partial PDP projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Valid Product' })).toBeVisible();

  await mockMissingPdpProjection(page);
  await page.goto('/product/missing?storefrontId=s_feno_1');
  await expect(page.getByRole('heading', { name: 'Product not found' })).toBeVisible();
});

test('PDP renders media fallback when media projection is missing', async ({ page }) => {
  await mockPdpProjection(page, { missingMedia: true });
  await page.goto('/product/p_valid?storefrontId=s_feno_1');

  await expect(page.getByText('Valid Product media preview')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Valid Product media projection unavailable' })).toBeVisible();
});

test('cart renders empty cart projection with discovery links', async ({ page }) => {
  await mockCartProjection(page, { lines: [] });
  await page.goto('/cart');

  await expect(page.getByRole('heading', { name: 'Your cart', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Search products' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse categories' })).toBeVisible();
});

test('cart renders line items, summary, coupon placeholder, and checkout handoff', async ({ page }) => {
  await mockCartProjection(page);
  await page.goto('/cart');

  await expect(page.getByRole('heading', { name: 'Cart line projections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cart Product' })).toBeVisible();
  await expect(page.getByLabel('Cart Product quantity projection').getByText('Quantity projection: 2')).toBeVisible();
  await expect(page.getByText('Price projection present; checkout owner confirms final price.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cart summary' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Coupon' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Checkout validation handoff placeholder' })).toBeVisible();
});

test('cart renders degraded projection and line warning without local truth', async ({ page }) => {
  await mockCartProjection(page, { degraded: true });
  await page.goto('/cart');

  await expect(page.getByRole('heading', { name: 'Degraded cart projection' })).toBeVisible();
  await expect(page.getByLabel(/Cart line warning/)).toBeVisible();
  await expect(page.getByText('OWNER_PRICE_STALE_PROJECTION')).toBeVisible();
});

test('checkout renders review, address, shipping, validation, coupon, and handoff surfaces', async ({ page }) => {
  await mockGuestSession(page);
  await mockCartProjection(page);
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Review checkout' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guest checkout surface' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Line review projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cart Product' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Address selection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shipping selection projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Validation feedback projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coupon projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment handoff placeholder' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proceed to payment placeholder' })).toBeDisabled();
});

test('checkout renders degraded validation feedback and return-to-cart flow', async ({ page }) => {
  await mockGuestSession(page);
  await mockCartProjection(page, { degraded: true });
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Degraded checkout projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Validation feedback projection' })).toBeVisible();
  await expect(page.getByText('OWNER_PRICE_STALE_PROJECTION').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Review cart' })).toBeVisible();
  await page.getByRole('link', { name: 'Review cart' }).click();
  await expect(page).toHaveURL(/\/cart$/);
});

test('checkout renders empty checkout state', async ({ page }) => {
  await mockGuestSession(page);
  await mockCartProjection(page, { lines: [] });
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Review checkout' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Checkout is empty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to cart' })).toBeVisible();
});

test('checkout renders on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockGuestSession(page);
  await mockCartProjection(page, { degraded: true });
  await page.goto('/checkout');

  await expect(page.getByRole('heading', { name: 'Review checkout' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment handoff placeholder' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Validation feedback projection' })).toBeVisible();
});

test('payment renders initiation surface and disables duplicate submit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/payment?checkoutId=co_smoke&paymentId=pay_smoke&paymentAttemptId=pa_smoke&state=initiation-ready');

  await expect(page.getByRole('heading', { name: 'Payment status' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment initiation placeholder' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provider redirect placeholder' })).toBeVisible();
  const button = page.getByRole('button', { name: 'Start payment placeholder' });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole('button', { name: 'Payment initiation placeholder in progress' })).toBeDisabled();
  await expect(page.getByText('Duplicate submit is disabled in this UI.')).toBeVisible();
});

test('payment renders pending state without finality truth', async ({ page }) => {
  await page.goto('/payment?checkoutId=co_smoke&paymentId=pay_smoke&paymentAttemptId=pa_smoke&state=pending');

  await expect(page.getByRole('heading', { name: 'Payment result pending' })).toBeVisible();
  await expect(page.getByText('The payment result is not final yet.')).toBeVisible();
  await expect(page.getByText('Do not start another payment while this result is pending or unknown.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible();
});

test('payment renders failed state with safe retry guidance', async ({ page }) => {
  await page.goto('/payment?checkoutId=co_smoke&paymentId=pay_smoke&paymentAttemptId=pa_smoke&state=failed');

  await expect(page.getByRole('heading', { name: 'Payment could not continue' })).toBeVisible();
  await expect(page.getByText('The payment projection reports a failed state.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to checkout' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible();
});

test('payment renders unknown-result state and return-to-checkout navigation', async ({ page }) => {
  await page.goto('/payment?checkoutId=co_smoke&paymentId=pay_smoke&paymentAttemptId=pa_smoke&state=unknown-result');

  await expect(page.getByRole('heading', { name: 'Payment result unknown' })).toBeVisible();
  await expect(page.getByText('The payment result is not certain right now.')).toBeVisible();
  await expect(page.getByText('Check the status before attempting another payment.')).toBeVisible();
  await page.getByRole('link', { name: 'Return to checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
});

test('order confirmation renders payment received without order-created truth', async ({ page }) => {
  await page.goto('/order/confirmation?checkoutId=co_smoke&paymentId=pay_smoke&paymentAttemptId=pa_smoke&orderRef=ord_projection&state=payment-succeeded-order-pending&paymentState=succeeded');

  await expect(page.getByRole('heading', { name: 'Order confirmation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order processing pending' })).toBeVisible();
  await expect(page.getByText('Payment received is not order created. Shipped is not delivered.')).toBeVisible();
  await expect(page.getByText('Payment success projection is separate from order creation and fulfillment.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order tracking timeline' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible();
});

test('order tracking renders timeline, shipment projection, and item previews', async ({ page }) => {
  await page.goto('/orders/order_smoke?state=shipped&paymentState=succeeded');

  await expect(page.getByRole('heading', { name: 'Track order' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order tracking timeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shipped projection', level: 2 })).toBeVisible();
  await expect(page.getByText('Shipped does not mean delivered.').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order item previews' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reference and help' })).toBeVisible();
});

test('order confirmation renders payment pending state', async ({ page }) => {
  await page.goto('/order/confirmation?checkoutId=co_pending&paymentId=pay_pending&paymentAttemptId=pa_pending&state=payment-pending&paymentState=pending');

  await expect(page.getByRole('heading', { name: 'Order confirmation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order processing pending' })).toBeVisible();
  await expect(page.getByText('Payment owner has not projected a final successful payment result.')).toBeVisible();
  await expect(page.getByText('Order creation is not guaranteed by payment projection.')).toBeVisible();
});

test('order tracking renders degraded shipment and support escalation', async ({ page }) => {
  await page.goto('/orders/order_smoke?state=degraded&shipmentState=degraded&paymentState=succeeded');

  await expect(page.getByRole('heading', { name: 'Degraded order projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tracking projection degraded' })).toBeVisible();
  await expect(page.getByText('Tracking projection is degraded. Contact support with the order reference.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact support' })).toBeVisible();
});

test('order tracking renders on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/orders/order_mobile?state=delivery-attempt&paymentState=succeeded');

  await expect(page.getByRole('heading', { name: 'Track order' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delivery attempt projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reference and help' })).toBeVisible();
});

test('guest order lookup renders foundation placeholders', async ({ page }) => {
  await page.goto('/orders');

  await expect(page.getByRole('heading', { name: 'Find an order' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guest order lookup' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lookup order projection placeholder' })).toBeDisabled();
});

test('returns render request list projection and refund pending separation', async ({ page }) => {
  await page.goto('/returns?orderId=order_smoke&state=refund-pending&refundState=pending');

  await expect(page.getByRole('heading', { name: 'Returns' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Return timeline' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Refund pending projection' })).toBeVisible();
  await expect(page.getByText('Return approved is not refund completed. Refund pending is not refund settled.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escalation guidance' })).toBeVisible();
});

test('return detail renders timeline and escalation guidance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/returns/ret_smoke?orderId=order_smoke&refundId=refund_smoke&state=approved&refundState=processing');

  await expect(page.getByRole('heading', { name: 'Return detail' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Return approved projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Refund processing projection', level: 2 })).toBeVisible();
  await expect(page.getByText('Return approved does not mean refund completed.')).toBeVisible();
  await expect(page.getByText('Refund initiated or processed is not settlement or payout truth.')).toBeVisible();
});

test('support renders guidance and order-linked support preview', async ({ page }) => {
  await page.goto('/support?orderId=order_smoke&paymentId=pay_smoke&returnId=ret_smoke&refundId=refund_smoke&state=ticket-opened');

  await expect(page.getByRole('heading', { name: 'Support' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Support ticket preview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order-linked support preview' })).toBeVisible();
  await expect(page.getByText('Support ticket opened is not issue resolved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Support guidance' })).toBeVisible();
});

test('support ticket renders degraded state and escalation guidance', async ({ page }) => {
  await page.goto('/support/tickets/ticket_smoke?orderId=order_smoke&returnId=ret_smoke&refundId=refund_smoke&state=escalated');

  await expect(page.getByRole('heading', { name: 'Support ticket', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escalated projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ticket timeline projection' })).toBeVisible();
  await expect(page.getByText('Escalation guidance render')).toBeVisible();
  await expect(page.getByText('Escalation is projected by support state, not decided locally.')).toBeVisible();
});

test('creator dashboard renders projection summary and scope guidance', async ({ page }) => {
  await mockCreatorDashboardProjection(page);
  await page.goto('/creator');

  await expect(page.getByRole('heading', { name: 'Creator management' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Creator scope boundary' })).toBeVisible();
  await expect(page.getByText('Creator authenticated is not storefront owner verified.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Storefront projection summary' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Products/ })).toBeVisible();
});

test('creator storefront management renders profile projection', async ({ page }) => {
  await mockCreatorStorefrontProjection(page);
  await page.goto('/creator/storefront');

  await expect(page.getByRole('heading', { name: 'Storefront management' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Feno Creator Store' })).toBeVisible();
  await expect(page.getByText('Visibility', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit storefront placeholder' })).toBeDisabled();
});

test('creator products renders list and empty state without binding mutation', async ({ page }) => {
  await mockCreatorProductsProjection(page);
  await page.goto('/creator/products');

  await expect(page.getByRole('heading', { name: 'Creator products' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Storefront product list projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Creator Listed Product' })).toBeVisible();
  await expect(page.getByText('Listed does not mean active or sellable.')).toBeVisible();

  await mockCreatorProductsProjection(page, { empty: true });
  await page.goto('/creator/products');
  await expect(page.getByRole('heading', { name: 'Product list empty' })).toBeVisible();
});

test('creator content renders content projections and empty state', async ({ page }) => {
  await mockCreatorContentProjection(page);
  await page.goto('/creator/content');

  await expect(page.getByRole('heading', { name: 'Creator content' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Story, post, and media projections' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pending story projection' })).toBeVisible();
  await expect(page.getByText('Created or uploaded does not mean published or public visible.')).toBeVisible();

  await mockCreatorContentProjection(page, { empty: true });
  await page.goto('/creator/content');
  await expect(page.getByRole('heading', { name: 'Content list empty' })).toBeVisible();
});

test('creator degraded projection renders without local permission truth', async ({ page }) => {
  await page.route('**/api/bff/creator', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ code: 'CREATOR_PROJECTION_UNAVAILABLE', message: 'Creator projection unavailable.' }] }),
    });
  });
  await page.goto('/creator');

  await expect(page.getByRole('heading', { name: 'Degraded creator projection' })).toBeVisible();
  await expect(page.getByText('Bu yuzey yalniz creator projection gosterir.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Creator empty, error, and degraded states' })).toBeVisible();
});

test('supplier dashboard renders projection summary and scope guidance', async ({ page }) => {
  await mockSupplierDashboardProjection(page);
  await page.goto('/supplier');

  await expect(page.getByRole('heading', { name: 'Supplier panel' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supplier scope boundary' })).toBeVisible();
  await expect(page.getByText('stock entered != stock confirmed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supplier store summary' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Products/ })).toBeVisible();
});

test('supplier products renders intake projections and empty state', async ({ page }) => {
  await mockSupplierProductsProjection(page);
  await page.goto('/supplier/products');

  await expect(page.getByRole('heading', { name: 'Supplier products', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supplier product list projection' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supplier Jacket Candidate' })).toBeVisible();
  await expect(page.getByText('Product submitted does not mean product active.')).toBeVisible();
  await expect(page.getByText('Stock entered does not mean stock confirmed.')).toBeVisible();

  await mockSupplierProductsProjection(page, { empty: true });
  await page.goto('/supplier/products');
  await expect(page.getByRole('heading', { name: 'Supplier products empty' })).toBeVisible();
});

test('supplier orders renders preparation projections and empty state', async ({ page }) => {
  await mockSupplierOrdersProjection(page);
  await page.goto('/supplier/orders');

  await expect(page.getByRole('heading', { name: 'Supplier orders', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order preparation list' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ORD-SUP-1001' })).toBeVisible();
  await expect(page.getByText('Shipment prepared does not mean shipped.')).toBeVisible();

  await mockSupplierOrdersProjection(page, { empty: true });
  await page.goto('/supplier/orders');
  await expect(page.getByRole('heading', { name: 'Supplier orders empty' })).toBeVisible();
});

test('supplier shipments renders shipment projection and degraded state', async ({ page }) => {
  await mockSupplierShipmentsProjection(page, { degraded: true });
  await page.goto('/supplier/shipments');

  await expect(page.getByRole('heading', { name: 'Supplier shipments', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shipment projection list' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Degraded shipment state' })).toBeVisible();
  await expect(page.getByText('Shipment prepared does not mean shipped.')).toBeVisible();
  await expect(page.getByText('Shipped does not mean delivered.')).toBeVisible();
});

test('supplier support renders dispute guidance and degraded state', async ({ page }) => {
  await mockSupplierSupportProjection(page, { degraded: true });
  await page.goto('/supplier/support');

  await expect(page.getByRole('heading', { name: 'Supplier support', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Support and dispute preview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Degraded support state' })).toBeVisible();
  await expect(page.getByText('Escalation guidance is not a moderation or fraud decision.')).toBeVisible();
});

test('supplier degraded projection renders without local owner truth', async ({ page }) => {
  await page.route('**/api/bff/supplier', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ code: 'SUPPLIER_PROJECTION_UNAVAILABLE', message: 'Supplier projection unavailable.' }] }),
    });
  });
  await page.goto('/supplier');

  await expect(page.getByRole('heading', { name: 'Degraded supplier projection' })).toBeVisible();
  await expect(page.getByText('Bu yuzey projection gosterir; query cache ve projection owner truth degildir.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Supplier empty, error, and degraded states' })).toBeVisible();
});

test('admin dashboard renders ops summary and boundary guidance', async ({ page }) => {
  await mockAdminDashboardProjection(page);
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Admin operations', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin ops boundary' })).toBeVisible();
  await expect(page.getByText('product submitted != product approved')).toBeVisible();
  await expect(page.getByText('risk signal != rejection decision; moderation flag != final moderation decision.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin operations summary' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Products/ })).toBeVisible();
});

test('admin product approval queue renders projections and empty state', async ({ page }) => {
  await mockAdminProductQueueProjection(page);
  await page.goto('/admin/products');

  await expect(page.getByRole('heading', { name: 'Product approval queue', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submitted product review queue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin Review Jacket Candidate' })).toBeVisible();
  await expect(page.getByText('Product submitted does not mean product approved.')).toBeVisible();
  await expect(page.getByText('Risk signal is not a rejection decision.')).toBeVisible();

  await mockAdminProductQueueProjection(page, { empty: true });
  await page.goto('/admin/products');
  await expect(page.getByRole('heading', { name: 'Product approval queue empty' })).toBeVisible();
});

test('admin product approval detail renders audit evidence and handoff placeholders', async ({ page }) => {
  await mockAdminProductDetailProjection(page);
  await page.goto('/admin/products/p_admin_1');

  await expect(page.getByRole('heading', { name: 'Product approval detail', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin Review Jacket Candidate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Audit and evidence visibility' })).toBeVisible();
  await expect(page.getByText('Audit visible does not mean audit owner mutation.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve via owner command placeholder' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reject via owner command placeholder' })).toBeDisabled();
  await expect(page.getByText('Product approved is not product active or sellable.')).toBeVisible();
});

test('admin degraded projection renders without local approval truth', async ({ page }) => {
  await page.route('**/api/bff/admin', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ code: 'ADMIN_PROJECTION_UNAVAILABLE', message: 'Admin projection unavailable.' }] }),
    });
  });
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Degraded admin projection' })).toBeVisible();
  await expect(page.getByText('Admin UI direct write, local permission engine veya owner state mutation uretmez.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin empty, error, and degraded states' })).toBeVisible();
});

test('homepage renders on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Browse creators, stories, and product candidates' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stories from projection candidates' })).toBeVisible();
});

test('not-found route renders the not-found state', async ({ page }) => {
  await page.goto('/phase-10a-missing-route');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
});

async function mockPdpProjection(
  page: import('@playwright/test').Page,
  options: { degradeStories?: boolean; missingMedia?: boolean } = {},
) {
  await page.route('**/api/bff/catalog/pdp/p_valid?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          product: {
            productId: 'p_valid',
            slug: 'valid-product',
            name: 'Valid Product',
            brand: 'HX Brand',
            status: 'ACTIVE',
            description: 'Foundation catalog read projection for an active product.',
            categories: [],
            media: options.missingMedia ? [] : [{ mediaId: 'm_1', url: '', type: 'IMAGE', isPrimary: true }],
            variants: [
              {
                variantId: 'v_1',
                sku: 'SKU-001',
                options: { color: 'Black' },
                availabilityStatus: 'AVAILABLE',
                priceTruth: false,
                stockTruth: false,
              },
              {
                variantId: 'v_2',
                sku: 'SKU-002',
                options: { color: 'White' },
                availabilityStatus: 'OUT_OF_STOCK',
                priceTruth: false,
                stockTruth: false,
              },
            ],
            defaultVariantId: 'v_1',
            publicReadable: true,
            catalogReadTruth: false,
            projectionSource: 'FOUNDATION_SEED',
            visibility: 'VISIBLE',
            priceTruth: false,
            stockTruth: false,
            mediaTruth: false,
            searchIndexTruth: false,
            productTruthMutated: false,
            warnings: ['SMOKE_PRODUCT_PROJECTION'],
          },
          storefrontContext: {
            storefrontId: 's_feno_1',
            name: 'Feno Trend Store',
            creatorNote: 'Foundation creator note projection',
          },
        },
      }),
    });
  });

  await page.route('**/api/bff/story/tray?**', async (route) => {
    if (options.degradeStories) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ code: 'STORY_PROJECTION_UNAVAILABLE', message: 'Story projection unavailable.' }] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              trayItemId: 'story_1',
              label: 'Use case preview',
              hasUnseen: false,
              storyIds: ['story_1'],
              storyType: 'USER_PRODUCT',
              surface: 'PDP',
              storyRingProjection: true,
              storefrontTruthMutated: false,
            },
          ],
        },
      }),
    });
  });

  await page.route('**/api/bff/rating/product/p_valid', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          success: true,
          ratingSummary: {
            productId: 'p_valid',
            averageRating: 4.2,
            reviewCount: 3,
            activeRatingCount: 3,
            ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
            lastCalculatedAt: '2026-05-12T00:00:00.000Z',
          },
        },
      }),
    });
  });

  await page.route('**/api/bff/review/list?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [{ reviewId: 'r_1', body: 'Projection review snippet without purchase badge.', warnings: [] }],
        },
      }),
    });
  });

  await page.route('**/api/bff/qa/question/list?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [{ questionId: 'q_1', body: 'Does this projection include a size preview?', answers: [], warnings: [] }],
        },
      }),
    });
  });
}

async function mockMissingPdpProjection(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/catalog/pdp/missing?**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [{ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' }],
      }),
    });
  });
}

async function mockCartProjection(
  page: import('@playwright/test').Page,
  options: { lines?: unknown[]; degraded?: boolean } = {},
) {
  const lines = options.lines ?? [
    {
      lineId: 'line_1',
      productId: 'p_cart',
      variantId: 'v_cart',
      storefrontId: 's_feno_1',
      quantity: 2,
      productName: 'Cart Product',
      productStatus: 'ACTIVE',
      unitPrice: 120,
      lineTotal: 240,
      warnings: options.degraded ? ['OWNER_PRICE_STALE_PROJECTION'] : [],
      stockAvailability: options.degraded
        ? {
            productId: 'p_cart',
            variantId: 'v_cart',
            storefrontId: 's_feno_1',
            status: 'UNKNOWN',
            source: 'FOUNDATION_SIMULATED',
            warnings: ['OWNER_STOCK_STALE_PROJECTION'],
          }
        : undefined,
    },
  ];

  await page.route('**/api/bff/cart', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          status: 200,
          data: {
            context: {
              actorType: 'GUEST',
              actorId: 'smoke-cart',
            },
            lines,
            summary: {
              totalQuantity: lines.length ? 2 : 0,
              subTotal: lines.length ? 240 : undefined,
            },
          },
        },
      }),
    });
  });
}

async function mockGuestSession(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          actor: {
            role: 'GUEST',
            actorId: 'smoke-guest',
            isAuthenticated: false,
          },
        },
      }),
    });
  });
}

async function mockCreatorDashboardProjection(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/creator', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          context: {
            actorId: 'creator_actor',
            creatorId: 'creator_1',
            storefrontId: 'storefront_1',
            authenticatedProjection: true,
            storefrontOwnerVerifiedProjection: false,
            scopeStatus: 'PROJECTED',
          },
          storefront: creatorStorefrontFixture(),
          storefrontStatus: {
            status: 'PROJECTED',
            statusText: 'Storefront owner verification is projected, not decided by UI.',
            visibilityText: 'Visibility projection: pending owner review.',
          },
          products: creatorProductsFixture(),
          content: creatorContentFixture(),
          scopeGuidance: {
            surfaceOnlyProjection: true,
            actionsRequireOwnerCommand: true,
            scopeOutsideActionBlockedText: 'Scope outside action is blocked by owner/BFF command.',
            boundaryTexts: [
              'creator authenticated != storefront owner verified',
              'product listed != product active/sellable',
              'media uploaded != content published',
            ],
          },
          boundaryFlags: creatorBoundaryFlags(),
        },
      }),
    });
  });
}

async function mockCreatorStorefrontProjection(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/creator/storefront', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: creatorStorefrontFixture() }),
    });
  });
}

async function mockCreatorProductsProjection(page: import('@playwright/test').Page, options: { empty?: boolean } = {}) {
  await page.route('**/api/bff/creator/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: options.empty ? { items: [], emptyState: true } : creatorProductsFixture() }),
    });
  });
}

async function mockCreatorContentProjection(page: import('@playwright/test').Page, options: { empty?: boolean } = {}) {
  await page.route('**/api/bff/creator/content', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: options.empty ? { items: [], emptyState: true } : creatorContentFixture() }),
    });
  });
}

function creatorStorefrontFixture() {
  return {
    storefrontId: 'storefront_1',
    displayName: 'Feno Creator Store',
    slug: 'feno-creator-store',
    bio: 'Projection profile copy from BFF read model.',
    avatarMediaLabel: 'Avatar projection',
    bannerMediaLabel: 'Banner projection',
    visibilityProjection: 'PENDING_REVIEW',
    profileConfiguredProjection: true,
  };
}

function creatorProductsFixture() {
  return {
    items: [
      {
        storefrontProductId: 'sp_1',
        productId: 'p_creator_1',
        title: 'Creator Listed Product',
        contextText: 'Projection context without sellability claim.',
        displayOrderProjection: 1,
        listedStateProjection: 'LISTED_PROJECTION',
        activeSellableTruth: false,
        priceTruth: false,
        stockTruth: false,
      },
    ],
    totalProjection: 1,
  };
}

function creatorContentFixture() {
  return {
    items: [
      {
        contentId: 'story_1',
        kind: 'STORY',
        title: 'Pending story projection',
        statusProjection: 'PENDING_REVIEW_PROJECTION',
        moderationStatusText: 'Moderation pending projection.',
        publicVisibleTruth: false,
        publishTruth: false,
        moderationDecisionTruth: false,
        mediaProcessingTruth: false,
      },
    ],
  };
}

function creatorBoundaryFlags() {
  return {
    creatorOwnershipTruth: false,
    permissionTruth: false,
    productBindingTruth: false,
    productAvailabilityTruth: false,
    priceTruth: false,
    stockTruth: false,
    mediaPublishTruth: false,
    moderationDecisionTruth: false,
    payoutSettlementTruth: false,
  };
}

async function mockSupplierDashboardProjection(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/supplier', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          context: {
            actorId: 'supplier_actor',
            supplierId: 'supplier_1',
            storeNameProjection: 'Feno Supplier Store',
            authenticatedProjection: true,
            supplierScopeStatus: 'PROJECTED',
          },
          products: supplierProductsFixture(),
          orders: supplierOrdersFixture(),
          shipments: supplierShipmentsFixture(),
          support: supplierSupportFixture(),
          stockWarningProjectionText: 'Stock projection warning only; central stock owner confirms stock.',
          scopeGuidance: supplierScopeGuidanceFixture(),
          boundaryFlags: supplierBoundaryFlagsFixture(),
        },
      }),
    });
  });
}

async function mockSupplierProductsProjection(page: import('@playwright/test').Page, options: { empty?: boolean } = {}) {
  await page.route('**/api/bff/supplier/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: options.empty ? { items: [], emptyState: true } : supplierProductsFixture() }),
    });
  });
}

async function mockSupplierOrdersProjection(page: import('@playwright/test').Page, options: { empty?: boolean } = {}) {
  await page.route('**/api/bff/supplier/orders', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: options.empty ? { items: [], emptyState: true } : supplierOrdersFixture() }),
    });
  });
}

async function mockSupplierShipmentsProjection(page: import('@playwright/test').Page, options: { degraded?: boolean } = {}) {
  await page.route('**/api/bff/supplier/shipments', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ...supplierShipmentsFixture(),
          degradedStateText: options.degraded ? 'Carrier projection timeout; shipment owner state is not inferred locally.' : undefined,
          warnings: options.degraded ? ['SUPPLIER_SHIPMENT_PROJECTION_DEGRADED'] : [],
        },
      }),
    });
  });
}

async function mockSupplierSupportProjection(page: import('@playwright/test').Page, options: { degraded?: boolean } = {}) {
  await page.route('**/api/bff/supplier/support', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ...supplierSupportFixture(),
          degradedStateText: options.degraded ? 'Support projection is degraded; no fraud or moderation decision is exposed.' : undefined,
          warnings: options.degraded ? ['SUPPLIER_SUPPORT_PROJECTION_DEGRADED'] : [],
        },
      }),
    });
  });
}

function supplierProductsFixture() {
  return {
    items: [
      {
        supplierProductId: 'sp_sup_1',
        productId: 'p_supplier_1',
        title: 'Supplier Jacket Candidate',
        intakeStatusProjection: 'SUBMITTED_PROJECTION',
        reviewStatusProjection: 'Review pending projection',
        stockProjectionText: 'Stock entered projection: 12 units',
        priceProjectionText: 'Base price projection: pending central price owner review',
        moderationProjectionText: 'Moderation review projection pending.',
        productSubmittedTruth: false,
        productActiveTruth: false,
        stockTruth: false,
        priceTruth: false,
        activationTruth: false,
      },
    ],
    totalProjection: 1,
  };
}

function supplierOrdersFixture() {
  return {
    items: [
      {
        orderId: 'order_supplier_1',
        orderReference: 'ORD-SUP-1001',
        productTitle: 'Supplier Jacket Candidate',
        quantityProjectionText: 'Quantity projection: 2',
        preparationStateProjection: 'PREPARE_ITEMS_PROJECTION',
        readinessProjectionText: 'Readiness projection requires owner command confirmation.',
        shipmentPreparationProjectionText: 'Shipment label placeholder available by projection',
        supportProjectionText: 'No active dispute projection for this order.',
        shipmentTruth: false,
        deliveryTruth: false,
        customerPrivateDataIncluded: false,
      },
    ],
    totalProjection: 1,
  };
}

function supplierShipmentsFixture() {
  return {
    items: [
      {
        shipmentId: 'ship_supplier_1',
        orderReference: 'ORD-SUP-1001',
        carrierProjectionText: 'Carrier placeholder projection: owner command required.',
        trackingProjectionText: 'Tracking projection pending logistics owner update',
        preparationStateProjection: 'PREPARED_PROJECTION',
        shipmentPreparedTruth: false,
        shippedTruth: false,
        deliveredTruth: false,
        rawLogisticsPayloadIncluded: false,
      },
    ],
    totalProjection: 1,
  };
}

function supplierSupportFixture() {
  return {
    items: [
      {
        ticketId: 'SUP-TICKET-1',
        orderReference: 'ORD-SUP-1001',
        statusProjection: 'TRIAGED_PROJECTION',
        guidanceText: 'Attach order preparation context and wait for support owner response.',
        escalationProjectionText: 'Escalation guidance render',
        moderationDecisionTruth: false,
        fraudRiskInternalsIncluded: false,
      },
    ],
    totalProjection: 1,
  };
}

function supplierScopeGuidanceFixture() {
  return {
    surfaceOnlyProjection: true,
    actionsRequireOwnerCommand: true,
    scopeOutsideActionBlockedText: 'Supplier scope outside action is blocked by owner/BFF command.',
    boundaryTexts: [
      'product submitted != product active',
      'stock entered != stock confirmed',
      'shipment prepared != shipped',
      'shipped != delivered',
      'settled != payable',
      'payable != paid_out',
    ],
  };
}

function supplierBoundaryFlagsFixture() {
  return {
    stockTruth: false,
    priceTruth: false,
    activationTruth: false,
    shipmentTruth: false,
    deliveryTruth: false,
    payoutSettlementTruth: false,
    moderationDecisionTruth: false,
    rawLogisticsPayloadIncluded: false,
    privateCustomerDataIncluded: false,
  };
}

async function mockAdminDashboardProjection(page: import('@playwright/test').Page) {
  await page.route('**/api/bff/admin', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          context: {
            actorId: 'admin_actor',
            roleProjection: 'OPS_REVIEWER_PROJECTION',
            opsScopeStatus: 'PROJECTED',
            authenticatedProjection: true,
          },
          opsSummary: {
            productApprovalQueueText: '1 submitted product projection waiting for owner command review',
            moderationRiskQueueText: 'Moderation and risk queue placeholder projection',
            supportOpsText: 'Support ops placeholder projection',
            financeOpsText: 'Finance ops placeholder projection',
            auditEvidenceText: 'Evidence required projection visible',
          },
          productQueue: adminProductQueueFixture(),
          moderationRiskQueuePlaceholderText: 'Moderation/risk signal queue placeholder; no final decision.',
          supportFinanceOpsPlaceholderText: 'Support and finance ops placeholder; no payout or settlement truth.',
          auditEvidenceSummaryPlaceholderText: 'Audit/evidence preview only; no audit owner mutation.',
          scopeGuidance: adminScopeGuidanceFixture(),
          boundaryFlags: adminBoundaryFlagsFixture(),
        },
      }),
    });
  });
}

async function mockAdminProductQueueProjection(page: import('@playwright/test').Page, options: { empty?: boolean } = {}) {
  await page.route('**/api/bff/admin/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: options.empty ? { items: [], emptyState: true } : adminProductQueueFixture() }),
    });
  });
}

async function mockAdminProductDetailProjection(page: import('@playwright/test').Page, options: { degraded?: boolean } = {}) {
  await page.route('**/api/bff/admin/products/p_admin_1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          productId: 'p_admin_1',
          reviewReference: 'APR-1001',
          title: 'Admin Review Jacket Candidate',
          supplierContextProjectionText: 'Feno Supplier Store projection',
          creatorContextProjectionText: 'Creator storefront projection unavailable',
          categoryTaxonomyProjectionText: 'Outerwear > Jackets taxonomy projection',
          priceSubmittedProjectionText: 'Submitted base price projection: 1200 TRY',
          stockSubmittedProjectionText: 'Submitted stock projection: 12 units',
          reviewStatusProjection: 'PENDING_REVIEW_PROJECTION',
          riskSignalProjectionText: 'Risk signal projection requires risk owner interpretation',
          moderationSignalProjectionText: 'Moderation flag projection requires moderation owner decision',
          submittedFields: [
            { label: 'Title', valueProjectionText: 'Admin Review Jacket Candidate' },
            { label: 'Description', valueProjectionText: 'Submitted description projection without activation claim' },
          ],
          media: [
            {
              mediaId: 'media_admin_1',
              label: 'Primary image projection',
              statusProjectionText: 'Media scan signal pending projection',
              mediaTruth: false,
              rawProviderPayloadIncluded: false,
            },
          ],
          checklist: [
            {
              checklistId: 'check_taxonomy',
              label: 'Category taxonomy',
              statusProjectionText: 'Projected as needs reviewer attention',
              requiredEvidenceProjectionText: 'Category evidence required projection',
              ownerDecisionTruth: false,
            },
          ],
          auditEvidence: {
            requiredEvidence: ['reason code', 'review snapshot', 'risk signal reference'],
            missingEvidenceWarnings: ['Missing reviewer reason projection.'],
            auditTrailPreview: ['Submitted projection read', 'Risk signal projection read'],
            actorReasonPlaceholderText: 'Actor and reason are required by owner/BFF command.',
            auditVisibleTruth: false,
            auditOwnerMutationTruth: false,
            evidenceOwnerMutationTruth: false,
          },
          actionHandoff: {
            approvePlaceholderText: 'Approve via owner command placeholder',
            rejectPlaceholderText: 'Reject via owner command placeholder',
            requestRevisionPlaceholderText: 'Request revision placeholder',
            requireEvidencePlaceholderText: 'Require evidence placeholder',
            ownerCommandRequired: true,
            directWriteAllowed: false,
            uiMutationTruth: false,
          },
          degradedStateText: options.degraded ? 'Approval detail projection is partial; no owner decision is inferred.' : undefined,
          warnings: options.degraded ? ['ADMIN_APPROVAL_DETAIL_DEGRADED'] : undefined,
          productSubmittedTruth: false,
          productApprovalTruth: false,
          productActivationTruth: false,
          activeSellableTruth: false,
          riskDecisionTruth: false,
          moderationDecisionTruth: false,
          supplierOwnershipTruth: false,
          creatorOwnershipTruth: false,
        },
      }),
    });
  });
}

function adminProductQueueFixture() {
  return {
    items: [
      {
        productId: 'p_admin_1',
        reviewReference: 'APR-1001',
        title: 'Admin Review Jacket Candidate',
        supplierNameProjection: 'Feno Supplier Store projection',
        storeContextProjection: 'Supplier store context projected; ownership is not decided by UI',
        submittedAtProjectionText: 'Submitted timestamp projection',
        reviewStatusProjection: 'PENDING_REVIEW_PROJECTION',
        riskSignalProjectionText: 'Risk signal projection present',
        moderationSignalProjectionText: 'Moderation flag projection present',
        evidenceRequiredProjectionText: 'Evidence required before owner command',
        detailHref: '/admin/products/p_admin_1',
        productSubmittedTruth: false,
        productApprovalTruth: false,
        productActivationTruth: false,
        activeSellableTruth: false,
        riskDecisionTruth: false,
        moderationDecisionTruth: false,
        supplierOwnershipTruth: false,
      },
    ],
    totalProjection: 1,
  };
}

function adminScopeGuidanceFixture() {
  return {
    surfaceOnlyProjection: true,
    actionsRequireOwnerCommand: true,
    scopeOutsideActionBlockedText: 'Admin scope outside action is blocked by owner/BFF command.',
    boundaryTexts: [
      'product submitted != product approved',
      'product approved != product active/sellable',
      'admin reviewed != owner state mutated',
      'risk signal != rejection decision',
      'moderation flag != final moderation decision',
      'audit visible != audit owner mutation',
    ],
  };
}

function adminBoundaryFlagsFixture() {
  return {
    directWriteTruth: false,
    productApprovalTruth: false,
    productActivationTruth: false,
    activeSellableTruth: false,
    moderationDecisionTruth: false,
    riskDecisionTruth: false,
    supplierCreatorOwnershipTruth: false,
    auditEvidenceMutationTruth: false,
    privateCustomerDataIncluded: false,
    rawProviderPayloadIncluded: false,
    persistenceInternalsIncluded: false,
  };
}
