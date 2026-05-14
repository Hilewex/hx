import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import {
  CatalogProductReadProjection,
  CartContext,
  CartLine,
  CheckoutReviewResponse,
  OrderResponse,
} from '../../../packages/contracts/src';
import { resolvePrice } from '../../../services/pricing/src';
import { PoolService } from '../../../services/pool/src';
import { resetProjectionStore, seedProjection } from '../../../services/catalog/src/projection-handler';
import { resetRepository as resetCartRepository } from '@hx/commerce';
import { resetRepository as resetCheckoutRepository } from '../../../services/checkout/src/checkout';
import { startCheckout } from '../../../services/checkout/src';
import { initiatePayment, simulatePaymentSuccess } from '../../../services/payment/src/payment';
import { resetPaymentRepository } from '../../../services/payment/src/repository';
import { createOrderFromPayment } from '../../../services/order/src';
import { resetOrderRepository } from '../../../services/order/src/repository';
import { closePool } from '../../../packages/persistence/src';
import { SmokeResult, SmokeRunner } from '../types';

function setEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function createCartRepository(linesByActor: Map<string, CartLine[]>) {
  const key = (context: CartContext) => `${context.actorType}:${context.actorId}`;

  return {
    getLines: async (context: CartContext) => linesByActor.get(key(context)) ?? [],
    saveLines: async (context: CartContext, lines: CartLine[]) => {
      linesByActor.set(key(context), lines);
    },
    clear: async (context: CartContext) => {
      linesByActor.delete(key(context));
    },
  };
}

function createCheckoutRepository(checkouts: Map<string, CheckoutReviewResponse>) {
  return {
    save: async (checkout: CheckoutReviewResponse) => {
      checkouts.set(checkout.checkoutId, checkout);
    },
    getById: async (checkoutId: string) => checkouts.get(checkoutId),
  };
}

function guestAddress() {
  return {
    kind: 'GUEST_ADDRESS' as const,
    recipientName: 'Economics Snapshot Guest',
    phone: '+905551112233',
    city: 'Istanbul',
    district: 'Kadikoy',
    addressLine: 'Order line economics smoke address',
  };
}

async function createLine(quantity = 2): Promise<CartLine> {
  const productId = 'p_valid';
  const variantId = 'v_1';
  const storefrontId = 's_feno_1';
  const price = await resolvePrice({ productId, variantId, storefrontId, quantity });
  assert.equal(price.status, 'OK');
  assert.ok(price.price);

  return {
    lineId: `line-${randomUUID()}`,
    productId,
    variantId,
    storefrontId,
    quantity,
    productName: 'Valid Product',
    productStatus: 'ACTIVE',
    unitPrice: price.price.activeUnitPrice,
    lineTotal: price.price.activeUnitPrice * quantity,
    warnings: [],
  };
}

interface ExpectedEconomicsSource {
  productId: string;
  variantId: string;
  storefrontId: string;
  commercialPoolProductId: string;
  creatorStoreProductId: string;
  creatorStoreId: string;
  supplierId: string;
  supplierSubmittedProductId: string;
  supplierVariantId: string;
  poolBasePriceAmount: number;
  creatorSelectedPriceAmount: number;
  supplierBaseAmount: number;
  platformMarginAmount?: number;
  creatorMarginAmount?: number;
}

function unwrap<T>(result: { success: true; data: T } | { success: false; error: { message: string } }): T {
  assert.equal(result.success, true, result.success ? undefined : result.error.message);
  return result.data;
}

async function createPoolBackedLine(quantity = 2): Promise<{
  line: CartLine;
  expected: ExpectedEconomicsSource;
}> {
  const pool = new PoolService();
  const supplierId = `supplier-${randomUUID()}`;
  const creatorStoreId = `store-${randomUUID()}`;
  const productId = 'n';
  const supplierVariantId = `sv-${randomUUID()}`;
  const storefrontId = 's_feno_1';
  const price = await resolvePrice({ productId, variantId: supplierVariantId, storefrontId, quantity });
  assert.equal(price.status, 'OK');
  assert.ok(price.price);
  const selectedPrice = price.price.activeUnitPrice;
  const supplierBaseAmount = 100;
  const poolBasePriceAmount = 120;
  const supplierActor = { actorType: 'SUPPLIER' as const, actorId: 'supplier-actor', supplierId };
  const operatorActor = { actorType: 'OPERATOR' as const, actorId: 'operator-actor' };
  const creatorActor = { actorType: 'CREATOR' as const, actorId: 'creator-actor', creatorStoreId };

  const draft = unwrap(await pool.createSupplierProductDraft({
    actor: supplierActor,
    supplierId,
    title: 'Pool Creator Economics Product',
    categoryId: 'c_1',
  }));
  const updated = unwrap(await pool.updateSupplierProductDraft({
    actor: supplierActor,
    id: draft.id,
    description: 'Pool backed smoke product',
    brand: 'HX Pool',
    tags: ['economics'],
    variants: [{
      id: supplierVariantId,
      title: 'Default',
      sku: `SKU-${supplierVariantId}`,
      barcode: `BAR-${supplierVariantId}`,
      stock: 10,
      price: selectedPrice,
      attributes: { color: 'Black' },
      media: [{ id: 'm-econ', url: 'http://img.com/econ.jpg', type: 'IMAGE', order: 0 }],
    }],
    logistics: {
      shippingWeight: 1,
      shippingWidth: 10,
      shippingHeight: 10,
      shippingDepth: 10,
      isFragile: false,
    },
  }));
  unwrap(await pool.submitSupplierProductForReview({ actor: supplierActor, id: updated.id }));
  unwrap(await pool.startProductReview({ actor: operatorActor, productId: updated.id }));
  unwrap(await pool.approveSupplierProduct({ actor: operatorActor, productId: updated.id, notes: 'approved' }));
  const commercialized = unwrap(await pool.commercializeApprovedProduct({
    actor: operatorActor,
    submittedProductId: updated.id,
  }));
  unwrap(await pool.bindCommercialPoolProduct({ actor: operatorActor, commercialPoolProductId: commercialized.id }));
  const activeCommercialProduct = unwrap(await pool.activateCommercialPoolProduct({
    actor: operatorActor,
    commercialPoolProductId: commercialized.id,
  }));
  const creatorStoreProduct = unwrap(await pool.addCommercialProductToCreatorStore({
    actor: creatorActor,
    creatorStoreId,
    commercialPoolProductId: activeCommercialProduct.id,
    selectedPrice,
  }));

  const projection: CatalogProductReadProjection = {
    productId,
    slug: `pool-economics-${productId}`,
    name: 'Pool Creator Economics Product',
    brand: 'HX Pool',
    status: 'ACTIVE',
    variants: [{
      variantId: supplierVariantId,
      sku: `SKU-${supplierVariantId}`,
      options: { color: 'Black' },
      availabilityStatus: 'AVAILABLE',
      priceTruth: false,
      stockTruth: false,
    }],
    defaultVariantId: supplierVariantId,
    publicReadable: true,
    catalogReadTruth: false,
    projectionSource: 'POOL_CREATOR_STORE_PRODUCT',
    commercialPoolProductId: activeCommercialProduct.id,
    creatorStoreProductId: creatorStoreProduct.id,
    creatorStoreId,
    supplierId,
    supplierSubmittedProductId: updated.id,
    supplierVariantId,
    poolBasePriceAmount,
    creatorSelectedPriceAmount: creatorStoreProduct.selectedPrice,
    supplierBaseAmount,
    storefrontId,
    visibility: 'VISIBLE',
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    description: 'Pool backed smoke product',
    categories: [{ categoryId: 'c_1', name: 'Electronics', slug: 'electronics' }],
    media: [{ mediaId: 'm-econ', url: 'http://img.com/econ.jpg', type: 'IMAGE', isPrimary: true }],
    primaryMedia: { mediaId: 'm-econ', url: 'http://img.com/econ.jpg', type: 'IMAGE', isPrimary: true },
    warnings: ['POOL_CREATOR_SOURCE_BOUND_FOR_ECONOMICS_SMOKE'],
  };
  seedProjection(projection);

  return {
    line: {
      lineId: `line-${randomUUID()}`,
      productId,
      variantId: supplierVariantId,
      storefrontId,
      quantity,
      productName: 'Pool Creator Economics Product',
      productStatus: 'ACTIVE',
      unitPrice: selectedPrice,
      lineTotal: selectedPrice * quantity,
      warnings: [],
    },
    expected: {
      productId,
      variantId: supplierVariantId,
      storefrontId,
      commercialPoolProductId: activeCommercialProduct.id,
      creatorStoreProductId: creatorStoreProduct.id,
      creatorStoreId,
      supplierId,
      supplierSubmittedProductId: updated.id,
      supplierVariantId,
      poolBasePriceAmount,
      creatorSelectedPriceAmount: creatorStoreProduct.selectedPrice,
      supplierBaseAmount,
      platformMarginAmount: 20,
      creatorMarginAmount: creatorStoreProduct.selectedPrice - poolBasePriceAmount,
    },
  };
}

function createProjectionBackedLine(input: {
  poolBasePriceAmount?: number;
  creatorSelectedPriceAmount?: number;
  supplierBaseAmount?: number;
}): { line: CartLine; expected: ExpectedEconomicsSource } {
  const productId = 'n';
  const variantId = `sv-${randomUUID()}`;
  const storefrontId = 's_feno_1';
  const commercialPoolProductId = `cp-${randomUUID()}`;
  const creatorStoreProductId = `csp-${randomUUID()}`;
  const creatorStoreId = `store-${randomUUID()}`;
  const supplierId = `supplier-${randomUUID()}`;
  const supplierSubmittedProductId = `submitted-${randomUUID()}`;
  const unitPrice = 150;

  seedProjection({
    productId,
    slug: `pool-economics-${randomUUID()}`,
    name: 'Projection Backed Economics Product',
    brand: 'HX Pool',
    status: 'ACTIVE',
    variants: [{
      variantId,
      sku: `SKU-${variantId}`,
      options: { color: 'Black' },
      availabilityStatus: 'AVAILABLE',
      priceTruth: false,
      stockTruth: false,
    }],
    defaultVariantId: variantId,
    publicReadable: true,
    catalogReadTruth: false,
    projectionSource: 'POOL_CREATOR_STORE_PRODUCT',
    commercialPoolProductId,
    creatorStoreProductId,
    creatorStoreId,
    supplierId,
    supplierSubmittedProductId,
    supplierVariantId: variantId,
    poolBasePriceAmount: input.poolBasePriceAmount,
    creatorSelectedPriceAmount: input.creatorSelectedPriceAmount,
    supplierBaseAmount: input.supplierBaseAmount,
    storefrontId,
    visibility: 'VISIBLE',
    priceTruth: false,
    stockTruth: false,
    mediaTruth: false,
    searchIndexTruth: false,
    productTruthMutated: false,
    description: 'Projection backed smoke product',
    categories: [{ categoryId: 'c_1', name: 'Electronics', slug: 'electronics' }],
    media: [{ mediaId: 'm-econ', url: 'http://img.com/econ.jpg', type: 'IMAGE', isPrimary: true }],
    primaryMedia: { mediaId: 'm-econ', url: 'http://img.com/econ.jpg', type: 'IMAGE', isPrimary: true },
    warnings: ['POOL_CREATOR_SOURCE_BOUND_FOR_ECONOMICS_SMOKE'],
  });

  return {
    line: {
      lineId: `line-${randomUUID()}`,
      productId,
      variantId,
      storefrontId,
      quantity: 1,
      productName: 'Projection Backed Economics Product',
      productStatus: 'ACTIVE',
      unitPrice,
      lineTotal: unitPrice,
      warnings: [],
    },
    expected: {
      productId,
      variantId,
      storefrontId,
      commercialPoolProductId,
      creatorStoreProductId,
      creatorStoreId,
      supplierId,
      supplierSubmittedProductId,
      supplierVariantId: variantId,
      poolBasePriceAmount: input.poolBasePriceAmount as number,
      creatorSelectedPriceAmount: input.creatorSelectedPriceAmount as number,
      supplierBaseAmount: input.supplierBaseAmount as number,
    },
  };
}

function assertSnapshot(order: OrderResponse, expected: ExpectedEconomicsSource): void {
  assert.equal(order.state, 'CREATED');
  assert.equal(order.lines.length, 1);

  const line = order.lines[0];
  const snapshot = line.economicsSnapshot;
  assert.ok(snapshot, 'order line economics snapshot missing');
  assert.equal(snapshot.unitPriceSnapshot, line.unitPriceSnapshot);
  assert.equal(snapshot.lineTotalSnapshot, line.lineTotalSnapshot);
  assert.equal(snapshot.commercialPoolProductId, expected.commercialPoolProductId);
  assert.equal(snapshot.creatorStoreProductId, expected.creatorStoreProductId);
  assert.equal(snapshot.creatorStoreId, expected.creatorStoreId);
  assert.equal(snapshot.supplierId, expected.supplierId);
  assert.equal(snapshot.supplierSubmittedProductId, expected.supplierSubmittedProductId);
  assert.equal(snapshot.supplierVariantId, expected.supplierVariantId);
  assert.equal(snapshot.poolBasePriceAmount, expected.poolBasePriceAmount);
  assert.equal(snapshot.creatorSelectedPriceAmount, expected.creatorSelectedPriceAmount);
  assert.equal(snapshot.supplierBaseAmount, expected.supplierBaseAmount);
  assert.equal(snapshot.platformMarginAmount, expected.platformMarginAmount);
  assert.equal(snapshot.creatorMarginAmount, expected.creatorMarginAmount);
  assert.equal(snapshot.priceSource, 'CHECKOUT_LINE');
  assert.equal(snapshot.status, 'COMPLETE');
  assert.equal(snapshot.unknownFields.includes('supplierId'), false);
  assert.equal(snapshot.unknownFields.includes('supplierSubmittedProductId'), false);
  assert.equal(snapshot.unknownFields.includes('supplierVariantId'), false);
  assert.equal(snapshot.unknownFields.includes('poolBasePriceAmount'), false);
  assert.equal(snapshot.unknownFields.includes('creatorSelectedPriceAmount'), false);
  assert.equal(snapshot.unknownFields.includes('supplierBaseAmount'), false);
  assert.equal(snapshot.unknownFields.includes('platformMarginAmount'), false);
  assert.equal(snapshot.unknownFields.includes('creatorMarginAmount'), false);
  assert.equal(snapshot.warnings.includes('ORDER_LINE_ECONOMICS_SOURCE_DEGRADED'), false);
  assert.equal(snapshot.boundaryFlags.economicsSnapshotOnly, true);
  assert.equal(snapshot.boundaryFlags.settlementCreated, false);
  assert.equal(snapshot.boundaryFlags.payoutCreated, false);
  assert.equal(snapshot.boundaryFlags.ledgerEntryCreated, false);
  assert.equal(snapshot.boundaryFlags.payableCreated, false);
  assert.equal(snapshot.discountAllocationRefs.length, 1);
  assert.equal(snapshot.discountAllocationRefs[0].discountCode, 'HX10');
  assert.equal(snapshot.discountAllocationRefs[0].allocatedAmount, 10);
  assert.equal(snapshot.couponSnapshotRefs.length, 1);
  assert.equal(snapshot.couponSnapshotRefs[0].code, 'HX10');
}

async function createPaidOrderForLine(
  context: CartContext,
  linesByActor: Map<string, CartLine[]>,
  line: CartLine,
): Promise<OrderResponse> {
  linesByActor.set(`${context.actorType}:${context.actorId}`, [line]);

  const checkout = await startCheckout({
    cartContext: context,
    addressSnapshot: guestAddress(),
    couponCode: 'HX10',
  });
  assert.equal(checkout.state, 'REVIEW_READY');
  assert.equal(checkout.validationState, 'VALID');

  const payment = await initiatePayment({
    checkoutId: checkout.checkoutId,
    cartContext: context,
    paymentMethod: 'CARD',
    idempotencyKey: `payment-${randomUUID()}`,
  });
  assert.equal(payment.state, 'INITIATED');

  const success = await simulatePaymentSuccess(payment.attempt.paymentAttemptId);
  assert.equal(success.state, 'SUCCEEDED');

  return createOrderFromPayment({
    customerId: context.actorId,
    paymentId: payment.paymentId,
    paymentAttemptId: payment.attempt.paymentAttemptId,
    checkoutId: checkout.checkoutId,
    idempotencyKey: `order-${randomUUID()}`,
  });
}

function assertBoundaryFlags(order: OrderResponse): void {
  const snapshot = order.lines[0].economicsSnapshot;
  assert.ok(snapshot);
  assert.equal(snapshot.boundaryFlags.economicsSnapshotOnly, true);
  assert.equal(snapshot.boundaryFlags.settlementCreated, false);
  assert.equal(snapshot.boundaryFlags.payoutCreated, false);
  assert.equal(snapshot.boundaryFlags.ledgerEntryCreated, false);
  assert.equal(snapshot.boundaryFlags.payableCreated, false);
}

async function assertStaticGuard(): Promise<void> {
  const files = [
    'packages/contracts/src/order.ts',
    'services/order/src/order.ts',
  ];
  const forbidden = [
    'create' + 'Settlement',
    'finalize' + 'Settlement',
    'append' + 'LedgerEntry',
    'create' + 'Payout',
    'execute' + 'Payout',
    'apply' + 'FinanceCorrection',
    'provider' + 'Payout',
    'supplierPayableCreated: ' + 'true',
    'creatorEarningCreated: ' + 'true',
    'platformRevenueCreated: ' + 'true',
    'settlementCreated: ' + 'true',
    'payoutCreated: ' + 'true',
    'ledgerEntryCreated: ' + 'true',
    'payableCreated: ' + 'true',
  ];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    for (const pattern of forbidden) {
      assert.equal(content.includes(pattern), false, `${pattern} found in ${file}`);
    }
  }
}

export const orderLineEconomicsSnapshotFoundationSmoke: SmokeRunner = {
  name: 'order-line-economics-snapshot-foundation',
  run: async (): Promise<{ result: SmokeResult; message: string }> => {
    const originalPersistenceMode = process.env.PERSISTENCE_MODE;
    const originalPaymentProviderName = process.env.PAYMENT_PROVIDER_NAME;
    const originalPaymentProviderMode = process.env.PAYMENT_PROVIDER_MODE;
    const linesByActor = new Map<string, CartLine[]>();
    const checkouts = new Map<string, CheckoutReviewResponse>();

    try {
      process.env.PERSISTENCE_MODE = 'memory';
      process.env.PAYMENT_PROVIDER_NAME = 'internal_simulation';
      process.env.PAYMENT_PROVIDER_MODE = 'simulation';
      resetCartRepository(createCartRepository(linesByActor));
      resetCheckoutRepository(createCheckoutRepository(checkouts));
      resetPaymentRepository();
      resetOrderRepository();

      const context: CartContext = {
        actorType: 'GUEST',
        actorId: `guest-${randomUUID()}`,
      };
      resetProjectionStore();
      const { line, expected } = await createPoolBackedLine();
      linesByActor.set(`${context.actorType}:${context.actorId}`, [line]);

      const checkout = await startCheckout({
        cartContext: context,
        addressSnapshot: guestAddress(),
        couponCode: 'HX10',
      });
      assert.equal(checkout.state, 'REVIEW_READY');
      assert.equal(checkout.validationState, 'VALID');
      assert.equal(checkout.lines[0].creatorStoreId, expected.creatorStoreId);
      assert.equal(checkout.lines[0].creatorSelectedPriceAmount, expected.creatorSelectedPriceAmount);
      assert.equal(checkout.lines[0].poolBasePriceAmount, expected.poolBasePriceAmount);
      assert.equal(checkout.discountSnapshots?.[0]?.lineAllocations?.length, 1);

      const payment = await initiatePayment({
        checkoutId: checkout.checkoutId,
        cartContext: context,
        paymentMethod: 'CARD',
        idempotencyKey: `payment-${randomUUID()}`,
      });
      assert.equal(payment.state, 'INITIATED');

      const success = await simulatePaymentSuccess(payment.attempt.paymentAttemptId);
      assert.equal(success.state, 'SUCCEEDED');

      const orderIdempotencyKey = `order-${randomUUID()}`;
      const order = await createOrderFromPayment({
        customerId: context.actorId,
        paymentId: payment.paymentId,
        paymentAttemptId: payment.attempt.paymentAttemptId,
        checkoutId: checkout.checkoutId,
        idempotencyKey: orderIdempotencyKey,
      });
      assertSnapshot(order, expected);

      const duplicate = await createOrderFromPayment({
        customerId: context.actorId,
        paymentId: payment.paymentId,
        paymentAttemptId: payment.attempt.paymentAttemptId,
        checkoutId: checkout.checkoutId,
        idempotencyKey: orderIdempotencyKey,
      });
      assert.equal(duplicate.orderId, order.orderId);
      assert.equal(duplicate.lines[0].economicsSnapshot?.economicsSnapshotCreatedAt, order.lines[0].economicsSnapshot?.economicsSnapshotCreatedAt);

      resetProjectionStore();
      const missingSource = createProjectionBackedLine({
        creatorSelectedPriceAmount: 150,
      });
      const missingSourceOrder = await createPaidOrderForLine(context, linesByActor, missingSource.line);
      const missingSourceSnapshot = missingSourceOrder.lines[0].economicsSnapshot;
      assert.ok(missingSourceSnapshot);
      assert.equal(missingSourceSnapshot.platformMarginAmount, undefined);
      assert.equal(missingSourceSnapshot.creatorMarginAmount, undefined);
      assert.ok(missingSourceSnapshot.unknownFields.includes('poolBasePriceAmount'));
      assert.ok(missingSourceSnapshot.unknownFields.includes('supplierBaseAmount'));
      assert.ok(missingSourceSnapshot.unknownFields.includes('platformMarginAmount'));
      assert.ok(missingSourceSnapshot.unknownFields.includes('creatorMarginAmount'));
      assert.equal(missingSourceSnapshot.status, 'DEGRADED');
      assertBoundaryFlags(missingSourceOrder);

      resetProjectionStore();
      const invalidPlatform = createProjectionBackedLine({
        supplierBaseAmount: 130,
        poolBasePriceAmount: 120,
        creatorSelectedPriceAmount: 150,
      });
      const invalidPlatformOrder = await createPaidOrderForLine(context, linesByActor, invalidPlatform.line);
      const invalidPlatformSnapshot = invalidPlatformOrder.lines[0].economicsSnapshot;
      assert.ok(invalidPlatformSnapshot);
      assert.equal(invalidPlatformSnapshot.platformMarginAmount, undefined);
      assert.equal(invalidPlatformSnapshot.creatorMarginAmount, 30);
      assert.ok(invalidPlatformSnapshot.unknownFields.includes('platformMarginAmount'));
      assert.ok(invalidPlatformSnapshot.warnings.includes('PLATFORM_MARGIN_PRICE_RELATION_INVALID'));
      assert.equal(invalidPlatformSnapshot.status, 'DEGRADED');
      assertBoundaryFlags(invalidPlatformOrder);

      resetProjectionStore();
      const invalidCreator = createProjectionBackedLine({
        supplierBaseAmount: 100,
        poolBasePriceAmount: 120,
        creatorSelectedPriceAmount: 110,
      });
      const invalidCreatorOrder = await createPaidOrderForLine(context, linesByActor, invalidCreator.line);
      const invalidCreatorSnapshot = invalidCreatorOrder.lines[0].economicsSnapshot;
      assert.ok(invalidCreatorSnapshot);
      assert.equal(invalidCreatorSnapshot.platformMarginAmount, 20);
      assert.equal(invalidCreatorSnapshot.creatorMarginAmount, undefined);
      assert.ok(invalidCreatorSnapshot.unknownFields.includes('creatorMarginAmount'));
      assert.ok(invalidCreatorSnapshot.warnings.includes('CREATOR_MARGIN_PRICE_RELATION_INVALID'));
      assert.equal(invalidCreatorSnapshot.status, 'DEGRADED');
      assertBoundaryFlags(invalidCreatorOrder);

      await assertStaticGuard();

      return {
        result: 'PASS',
        message:
          'order line economics snapshot computes safe platform/creator margins from source amounts, degraded sources are explicit, boundary flags remain closed, and order idempotency is preserved.',
      };
    } catch (error) {
      return { result: 'FAIL', message: (error as Error).message };
    } finally {
      resetCartRepository();
      resetCheckoutRepository();
      resetProjectionStore();
      resetPaymentRepository();
      resetOrderRepository();
      setEnv('PERSISTENCE_MODE', originalPersistenceMode);
      setEnv('PAYMENT_PROVIDER_NAME', originalPaymentProviderName);
      setEnv('PAYMENT_PROVIDER_MODE', originalPaymentProviderMode);
      await closePool().catch(() => undefined);
    }
  },
};
