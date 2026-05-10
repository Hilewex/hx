
import {
  StartCheckoutCommand, 
  CheckoutReviewResponse, 
  CheckoutState, 
  CheckoutValidationState,
  CheckoutLineValidation,
  CheckoutSummary,
  CheckoutAddressSnapshot,
  CatalogVariantProjection,
  CheckoutDiscountInput,
  CheckoutDiscountLineAllocation,
  CheckoutDiscountSnapshot,
  CouponValidationResult,
  DiscountSponsorType,
  InitialPhaseSponsorPolicy
} from '@hx/contracts';
import { getCart, getCheckoutRepository } from '@hx/commerce';
import type { ICheckoutRepository } from '@hx/commerce';
import { resolvePrice } from '@hx/pricing';
import { StockService } from '@hx/stock';
import { createInternalRiskSignal } from '@hx/risk';
import { getCustomerAddress, checkCheckoutEligibility } from '@hx/customer-address';
import { getCatalogProduct } from '@hx/catalog';
import { randomUUID } from 'node:crypto';

const stockService = new StockService();
const GUEST_CHECKOUT_WINDOW_MS = 60_000;
const GUEST_CHECKOUT_SIGNAL_THRESHOLD = 3;
const guestCheckoutAttempts = new Map<string, number[]>();

let repository: ICheckoutRepository | undefined;

interface FoundationDiscountRule {
  readonly sourceType: CheckoutDiscountInput['sourceType'];
  readonly code: string;
  readonly discountAmount: number;
  readonly sponsorType: DiscountSponsorType;
  readonly sponsorId?: string;
  readonly platformSupportedCreatorCoupon?: boolean;
  readonly expiresAt?: string;
  readonly eligibleActorTypes?: Array<'GUEST' | 'CUSTOMER'>;
  readonly usageLimit?: number;
  readonly usedCount?: number;
}

const INITIAL_PHASE_SPONSOR_POLICY: InitialPhaseSponsorPolicy = {
  supplierSponsoredDiscountEnabled: false,
  brandSponsoredDiscountEnabled: false,
  creatorCouponEnabledOnCampaignProductsByDefault: false,
  platformSupportedCreatorCouponRequiresAdminRatio: true,
  creatorCouponRequiresMinimumMargin: true,
};

const FOUNDATION_DISCOUNTS: FoundationDiscountRule[] = [
  {
    sourceType: 'COUPON',
    code: 'HX10',
    discountAmount: 10,
    sponsorType: 'PLATFORM',
    sponsorId: 'platform:hx',
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_SUPPLIER_25',
    discountAmount: 25,
    sponsorType: 'SUPPLIER',
    sponsorId: 'supplier:foundation',
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_CREATOR_30',
    discountAmount: 30,
    sponsorType: 'CREATOR',
    sponsorId: 'creator:foundation',
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_CREATOR_PLATFORM_30',
    discountAmount: 30,
    sponsorType: 'CREATOR',
    sponsorId: 'creator:foundation',
    platformSupportedCreatorCoupon: true,
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_EXPIRED',
    discountAmount: 10,
    sponsorType: 'PLATFORM',
    sponsorId: 'platform:hx',
    expiresAt: '2020-01-01T00:00:00.000Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_LIMITED',
    discountAmount: 10,
    sponsorType: 'PLATFORM',
    sponsorId: 'platform:hx',
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1,
    usedCount: 1,
  },
  {
    sourceType: 'COUPON',
    code: 'HX_CUSTOMER_10',
    discountAmount: 10,
    sponsorType: 'PLATFORM',
    sponsorId: 'platform:hx',
    expiresAt: '2099-12-31T23:59:59.999Z',
    eligibleActorTypes: ['CUSTOMER'],
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'CAMPAIGN',
    code: 'CAMP_BRAND_20',
    discountAmount: 20,
    sponsorType: 'BRAND',
    sponsorId: 'brand:foundation',
    expiresAt: '2099-12-31T23:59:59.999Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
  {
    sourceType: 'CAMPAIGN',
    code: 'CAMP_EXPIRED',
    discountAmount: 20,
    sponsorType: 'BRAND',
    sponsorId: 'brand:foundation',
    expiresAt: '2020-01-01T00:00:00.000Z',
    usageLimit: 1_000,
    usedCount: 0,
  },
];

function getRepository(): ICheckoutRepository {
  return repository || getCheckoutRepository();
}

// For testing purposes
export function resetRepository(mockRepo?: ICheckoutRepository) {
  repository = mockRepo;
}

export async function getCheckoutReview(checkoutId: string): Promise<CheckoutReviewResponse | undefined> {
  return await getRepository().getById(checkoutId);
}

function normalizeDiscountInputs(command: StartCheckoutCommand): CheckoutDiscountInput[] {
  const inputs: CheckoutDiscountInput[] = [];

  if (command.couponCode) {
    inputs.push({ sourceType: 'COUPON', code: command.couponCode });
  }

  if (command.campaignId) {
    inputs.push({ sourceType: 'CAMPAIGN', code: command.campaignId });
  }

  for (const input of command.discountInputs ?? []) {
    inputs.push(input);
  }

  const seen = new Set<string>();
  return inputs
    .map((input) => ({
      sourceType: input.sourceType,
      code: input.code.trim().toUpperCase(),
      creatorCouponPolicy: input.creatorCouponPolicy,
      isCampaignProduct: input.isCampaignProduct,
      creatorCouponEnabledOnCampaignProduct: input.creatorCouponEnabledOnCampaignProduct,
    }))
    .filter((input) => {
      if (!input.code || (input.sourceType !== 'COUPON' && input.sourceType !== 'CAMPAIGN')) return false;
      const key = `${input.sourceType}:${input.code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function validateFoundationDiscount(
  input: CheckoutDiscountInput,
  cartContext: StartCheckoutCommand['cartContext'],
): CouponValidationResult {
  const rule = FOUNDATION_DISCOUNTS.find(
    (candidate) => candidate.sourceType === input.sourceType && candidate.code === input.code,
  );

  if (!rule) {
    return {
      status: 'INVALID',
      discountAmount: 0,
      reasonCode: `${input.sourceType}_NOT_FOUND`,
      appliedCode: input.code,
    };
  }

  if (rule.expiresAt && Date.parse(rule.expiresAt) <= Date.now()) {
    return {
      status: 'EXPIRED',
      discountAmount: 0,
      reasonCode: `${input.sourceType}_EXPIRED`,
      appliedCode: rule.code,
    };
  }

  if (rule.eligibleActorTypes && !rule.eligibleActorTypes.includes(cartContext.actorType)) {
    return {
      status: 'NOT_ELIGIBLE',
      discountAmount: 0,
      reasonCode: `${input.sourceType}_NOT_ELIGIBLE`,
      appliedCode: rule.code,
    };
  }

  if (rule.usageLimit !== undefined && (rule.usedCount ?? 0) >= rule.usageLimit) {
    return {
      status: 'USAGE_LIMIT_EXCEEDED',
      discountAmount: 0,
      reasonCode: `${input.sourceType}_USAGE_LIMIT_EXCEEDED`,
      appliedCode: rule.code,
    };
  }

  if (rule.sponsorType === 'SUPPLIER' && !INITIAL_PHASE_SPONSOR_POLICY.supplierSponsoredDiscountEnabled) {
    return {
      status: 'BLOCKED',
      discountAmount: 0,
      sponsorType: rule.sponsorType,
      sponsorId: rule.sponsorId,
      reasonCode: 'FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED',
      appliedCode: rule.code,
    };
  }

  if (rule.sponsorType === 'BRAND' && !INITIAL_PHASE_SPONSOR_POLICY.brandSponsoredDiscountEnabled) {
    return {
      status: 'BLOCKED',
      discountAmount: 0,
      sponsorType: rule.sponsorType,
      sponsorId: rule.sponsorId,
      reasonCode: 'FIRST_PHASE_BRAND_SPONSOR_DISABLED',
      appliedCode: rule.code,
    };
  }

  if (rule.sponsorType === 'CREATOR') {
    const policy = input.creatorCouponPolicy;

    if (
      input.isCampaignProduct &&
      !INITIAL_PHASE_SPONSOR_POLICY.creatorCouponEnabledOnCampaignProductsByDefault &&
      input.creatorCouponEnabledOnCampaignProduct !== true
    ) {
      return {
        status: 'BLOCKED',
        discountAmount: 0,
        sponsorType: rule.sponsorType,
        sponsorId: rule.sponsorId,
        reasonCode: 'CREATOR_COUPON_DISABLED_ON_CAMPAIGN_PRODUCT',
        appliedCode: rule.code,
      };
    }

    if (!policy) {
      return {
        status: 'BLOCKED',
        discountAmount: 0,
        sponsorType: rule.sponsorType,
        sponsorId: rule.sponsorId,
        reasonCode: 'CREATOR_COUPON_MARGIN_INPUTS_REQUIRED',
        appliedCode: rule.code,
      };
    }

    const hasDirectCreatorMargin =
      policy.creatorMarginAmount !== undefined && Number.isFinite(policy.creatorMarginAmount);
    const hasCreatorMarginInputs =
      policy.selectedSalePrice !== undefined &&
      policy.poolBasePriceAmount !== undefined &&
      Number.isFinite(policy.selectedSalePrice) &&
      Number.isFinite(policy.poolBasePriceAmount);

    if (
      !Number.isFinite(policy.minCreatorMarginAmount) ||
      policy.minCreatorMarginAmount < 0 ||
      !Number.isFinite(policy.couponDiscountAmount) ||
      policy.couponDiscountAmount !== rule.discountAmount ||
      (!hasDirectCreatorMargin && !hasCreatorMarginInputs)
    ) {
      return {
        status: 'BLOCKED',
        discountAmount: 0,
        sponsorType: rule.sponsorType,
        sponsorId: rule.sponsorId,
        reasonCode: 'CREATOR_COUPON_MARGIN_INPUTS_REQUIRED',
        appliedCode: rule.code,
      };
    }

    const creatorMargin = hasDirectCreatorMargin
      ? policy.creatorMarginAmount!
      : policy.selectedSalePrice! - policy.poolBasePriceAmount!;
    const creatorMarginAfterCoupon = creatorMargin - rule.discountAmount;

    if (creatorMarginAfterCoupon < policy.minCreatorMarginAmount) {
      return {
        status: 'BLOCKED',
        discountAmount: 0,
        sponsorType: rule.sponsorType,
        sponsorId: rule.sponsorId,
        reasonCode: 'CREATOR_COUPON_MINIMUM_MARGIN_VIOLATION',
        appliedCode: rule.code,
      };
    }

    if (
      rule.platformSupportedCreatorCoupon &&
      INITIAL_PHASE_SPONSOR_POLICY.platformSupportedCreatorCouponRequiresAdminRatio &&
      (policy.platformSupportRatio === undefined ||
        !Number.isFinite(policy.platformSupportRatio) ||
        policy.adminSupportRatioApproved !== true)
    ) {
      return {
        status: 'BLOCKED',
        discountAmount: 0,
        sponsorType: rule.sponsorType,
        sponsorId: rule.sponsorId,
        reasonCode: 'PLATFORM_SUPPORTED_CREATOR_COUPON_ADMIN_RATIO_REQUIRED',
        appliedCode: rule.code,
      };
    }
  }

  return {
    status: 'VALID',
    discountAmount: rule.discountAmount,
    sponsorType: rule.sponsorType,
    sponsorId: rule.sponsorId,
    appliedCode: rule.code,
  };
}

function resolveDiscountSnapshots(
  inputs: CheckoutDiscountInput[],
  cartContext: StartCheckoutCommand['cartContext'],
): { snapshots: CheckoutDiscountSnapshot[]; errors: string[]; discountTotal: number } {
  const snapshots: CheckoutDiscountSnapshot[] = [];
  const errors: string[] = [];
  let discountTotal = 0;

  for (const input of inputs) {
    const validation = validateFoundationDiscount(input, cartContext);
    const discountSnapshotId = `ds_${randomUUID()}`;
    snapshots.push({
      discountSnapshotId,
      sourceType: input.sourceType,
      code: validation.appliedCode ?? input.code,
      discountAmount: validation.status === 'VALID' ? validation.discountAmount : 0,
      sponsorType: validation.sponsorType,
      sponsorId: validation.sponsorId,
      validationStatus: validation.status,
      reasonCode: validation.reasonCode,
      allocationComplete: validation.status === 'VALID' ? false : undefined,
    });

    if (validation.status === 'VALID') {
      discountTotal += validation.discountAmount;
    } else {
      errors.push(validation.reasonCode ?? `${input.sourceType}_INVALID`);
    }
  }

  return { snapshots, errors, discountTotal };
}

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function allocateAmountAcrossLines(
  amount: number,
  snapshot: CheckoutDiscountSnapshot,
  eligibleLines: CheckoutLineValidation[],
  currency: string,
  createdAt: string,
): CheckoutDiscountLineAllocation[] {
  const roundedAmount = roundMoney(amount);
  if (roundedAmount <= 0 || eligibleLines.length === 0 || !snapshot.sponsorType) return [];

  const totalLineAmount = roundMoney(
    eligibleLines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0),
  );
  if (totalLineAmount <= 0) return [];

  let allocatedSoFar = 0;
  return eligibleLines.map((line, index) => {
    const isLast = index === eligibleLines.length - 1;
    const allocatedAmount = isLast
      ? roundMoney(roundedAmount - allocatedSoFar)
      : roundMoney(roundedAmount * ((line.lineTotal ?? 0) / totalLineAmount));
    const allocationMethod: CheckoutDiscountLineAllocation['allocationMethod'] =
      eligibleLines.length === 1 ? 'SINGLE_LINE' : 'PROPORTIONAL';
    allocatedSoFar = roundMoney(allocatedSoFar + allocatedAmount);

    return {
      allocationId: `dla_${randomUUID()}`,
      discountSnapshotId: snapshot.discountSnapshotId ?? `${snapshot.sourceType}:${snapshot.code}`,
      discountCode: snapshot.code,
      discountKind: snapshot.sourceType,
      sponsorType: snapshot.sponsorType,
      sponsorId: snapshot.sponsorId,
      lineId: line.lineId,
      cartLineId: line.lineId,
      productId: line.productId,
      allocatedAmount,
      currency,
      allocationMethod,
      createdAt,
    };
  }).filter((allocation) => allocation.allocatedAmount > 0);
}

function attachDiscountLineAllocations(
  snapshots: CheckoutDiscountSnapshot[],
  checkoutLines: CheckoutLineValidation[],
  discountTotal: number,
  currency: string,
): CheckoutDiscountSnapshot[] {
  const eligibleLines = checkoutLines.filter(
    (line) => line.validationState === 'VALID' && (line.lineTotal ?? 0) > 0,
  );
  const createdAt = new Date().toISOString();
  let remainingDiscountTotal = roundMoney(discountTotal);

  return snapshots.map((snapshot) => {
    if (snapshot.validationStatus !== 'VALID' || snapshot.discountAmount <= 0 || remainingDiscountTotal <= 0) {
      return {
        ...snapshot,
        lineAllocations: undefined,
        totalAllocatedAmount: 0,
        allocationComplete: false,
      };
    }

    const allocatableAmount = roundMoney(Math.min(snapshot.discountAmount, remainingDiscountTotal));
    const lineAllocations = allocateAmountAcrossLines(
      allocatableAmount,
      snapshot,
      eligibleLines,
      currency,
      createdAt,
    );
    const totalAllocatedAmount = roundMoney(
      lineAllocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0),
    );
    remainingDiscountTotal = roundMoney(remainingDiscountTotal - totalAllocatedAmount);

    return {
      ...snapshot,
      discountAmount: allocatableAmount,
      lineAllocations,
      totalAllocatedAmount,
      allocationComplete: totalAllocatedAmount === allocatableAmount,
    };
  });
}

export async function startCheckout(command: StartCheckoutCommand): Promise<CheckoutReviewResponse> {
  const { cartContext, addressSnapshot: commandAddressSnapshot } = command;
  const { actorId, actorType } = cartContext;

  const checkoutId = randomUUID();

  // 1. Address Eligibility Check
  const eligibility = await checkCheckoutEligibility(actorId, actorType);
  if (!eligibility.eligible) {
    const response: CheckoutReviewResponse = {
      checkoutId,
      cartContext,
      state: 'BLOCKED',
      validationState: 'BLOCKED',
      lines: [],
      summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
      errors: [eligibility.reason || 'ADDRESS_INELIGIBLE'],
      warnings: [],
    };
    await getRepository().save(response);
    return response;
  }

  // 2. Guest Checkout Address Validation
  if (actorType === 'GUEST') {
    if (
      !commandAddressSnapshot ||
      !commandAddressSnapshot.recipientName ||
      !commandAddressSnapshot.phone ||
      !commandAddressSnapshot.city ||
      !commandAddressSnapshot.addressLine
    ) {
      const response: CheckoutReviewResponse = {
        checkoutId,
        cartContext,
        state: 'BLOCKED',
        validationState: 'BLOCKED',
        lines: [],
        summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
        errors: ['GUEST_ADDRESS_INCOMPLETE'],
        warnings: [],
      };
      await getRepository().save(response);
      return response;
    }
  }
  
  const cartRes = await getCart(cartContext);
  const cartData = cartRes.data;

  if (cartContext.actorType === 'GUEST') {
    const now = Date.now();
    const recentAttempts = (guestCheckoutAttempts.get(cartContext.actorId) || [])
      .filter((createdAt) => now - createdAt <= GUEST_CHECKOUT_WINDOW_MS);
    recentAttempts.push(now);
    guestCheckoutAttempts.set(cartContext.actorId, recentAttempts);

    if (recentAttempts.length >= GUEST_CHECKOUT_SIGNAL_THRESHOLD) {
      await createInternalRiskSignal({
        targetId: cartContext.actorId,
        targetType: 'ACCOUNT',
        type: 'ACCOUNT_VELOCITY',
        level: 'MEDIUM',
        source: 'SYSTEM_RULE',
        reasonCode: 'SUSPICIOUS_VELOCITY',
        metadata: {
          actorId: cartContext.actorId,
          actorType: 'GUEST',
          reason: 'GUEST_CHECKOUT_RATE_PATTERN',
          attemptCount: recentAttempts.length,
          windowMs: GUEST_CHECKOUT_WINDOW_MS,
          checkoutTruthMutated: false,
        },
        correlationId: randomUUID(),
      });
    }
  }

  if (!cartData.lines || cartData.lines.length === 0) {
    const response: CheckoutReviewResponse = {
      checkoutId,
      cartContext,
      state: 'BLOCKED',
      validationState: 'BLOCKED',
      lines: [],
      summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
      errors: ['CART_IS_EMPTY'],
      warnings: [],
    };
    await getRepository().save(response);
    return response;
  }
  
  // 3. Resolve final address snapshot
  let finalAddressSnapshot: CheckoutAddressSnapshot | undefined;
  if (actorType === 'CUSTOMER' && commandAddressSnapshot?.addressId) {
    try {
      const registeredAddress = await getCustomerAddress(actorId, commandAddressSnapshot.addressId);
      finalAddressSnapshot = {
        kind: 'REGISTERED_ADDRESS',
        addressId: registeredAddress.id,
        recipientName: `${registeredAddress.firstName} ${registeredAddress.lastName}`,
        phone: registeredAddress.phone,
        city: registeredAddress.city,
        district: registeredAddress.district,
        addressLine: registeredAddress.fullAddress,
      };
    } catch (e) {
       const response: CheckoutReviewResponse = {
        checkoutId,
        cartContext,
        state: 'BLOCKED',
        validationState: 'BLOCKED',
        lines: [],
        summary: { totalQuantity: 0, subTotal: 0, grandTotal: 0, currency: 'TRY' },
        errors: ['CUSTOMER_ADDRESS_NOT_FOUND'],
        warnings: [],
      };
      await getRepository().save(response);
      return response;
    }
  } else if (actorType === 'GUEST') {
    finalAddressSnapshot = commandAddressSnapshot;
  }


  let overallValidationState: CheckoutValidationState = 'VALID';
  let overallState: CheckoutState = 'REVIEW_READY';
  const checkoutLines: CheckoutLineValidation[] = [];
  let subTotal = 0;
  let totalQuantity = 0;
  const globalErrors: string[] = [];
  const globalWarnings: string[] = [];
  const discountInputs = normalizeDiscountInputs(command);

  for (const line of cartData.lines) {
    const lineValidation: CheckoutLineValidation = {
      lineId: line.lineId,
      productId: line.productId,
      variantId: line.variantId,
      storefrontId: line.storefrontId,
      quantity: line.quantity,
      validationState: 'PENDING',
      warnings: [],
      errors: [],
    };

    
    const catalogResult = getCatalogProduct(line.productId);

    if (catalogResult.status !== 'OK' || !catalogResult.product || catalogResult.product.status !== 'ACTIVE') {
      lineValidation.validationState = 'BLOCKED';
      lineValidation.errors.push(catalogResult.status === 'NOT_FOUND' ? 'PRODUCT_NOT_FOUND' : 'PRODUCT_NOT_SELLABLE');
      checkoutLines.push(lineValidation);
      overallState = 'BLOCKED';
      if(overallValidationState !== 'BLOCKED') overallValidationState = 'BLOCKED';
      continue; // Move to the next line
    }

    const product = catalogResult.product;
    const targetVariantId = line.variantId || product.defaultVariantId;
    lineValidation.variantId = targetVariantId;

    if (product.variants && product.variants.length > 0) {
        if (!targetVariantId || !product.variants.some((v: CatalogVariantProjection) => v.variantId === targetVariantId)) {
            lineValidation.validationState = 'BLOCKED';
            lineValidation.errors.push('VARIANT_NOT_FOUND');
            checkoutLines.push(lineValidation);
            overallState = 'BLOCKED';
            if(overallValidationState !== 'BLOCKED') overallValidationState = 'BLOCKED';
            continue; // Move to the next line
        }
    }

     const priceRes = await resolvePrice({
      productId: line.productId,
      variantId: targetVariantId, // Use validated variantId
      storefrontId: line.storefrontId,
    });

    const stockRes = await stockService.resolveStock({
      productId: line.productId,
      variantId: targetVariantId, // Use validated variantId
      storefrontId: line.storefrontId,
      requestedQuantity: line.quantity,
    });

    let hasError = false;

    if (priceRes.status === 'PRICE_UNAVAILABLE' || !priceRes.price) {
      lineValidation.validationState = 'PRICE_MISMATCH';
      lineValidation.errors.push('PRICE_UNAVAILABLE');
      hasError = true;
      if ((overallValidationState as CheckoutValidationState) !== 'BLOCKED') overallValidationState = 'PRICE_MISMATCH';
    } else if (line.unitPrice !== undefined && line.unitPrice !== priceRes.price.activeUnitPrice) {
      lineValidation.validationState = 'PRICE_MISMATCH';
      lineValidation.errors.push('PRICE_MISMATCH');
      lineValidation.unitPrice = priceRes.price.activeUnitPrice;
      lineValidation.lineTotal = priceRes.price.activeUnitPrice * line.quantity;
      hasError = true;
      if ((overallValidationState as CheckoutValidationState) !== 'BLOCKED') overallValidationState = 'PRICE_MISMATCH';
    } else {
      lineValidation.unitPrice = priceRes.price.activeUnitPrice;
      lineValidation.lineTotal = lineValidation.unitPrice * line.quantity;
    }

    if (stockRes.status === 'STOCK_UNAVAILABLE' || stockRes.availability?.status === 'OUT_OF_STOCK') {
      lineValidation.validationState = 'STOCK_MISMATCH';
      lineValidation.errors.push('STOCK_UNAVAILABLE');
      lineValidation.stockStatus = 'OUT_OF_STOCK';
      hasError = true;
      if ((overallValidationState as CheckoutValidationState) !== 'BLOCKED') overallValidationState = 'STOCK_MISMATCH';
    } else if (stockRes.availability?.status === 'UNKNOWN') {
      lineValidation.warnings.push('STOCK_UNKNOWN');
      lineValidation.stockStatus = 'UNKNOWN';
    } else {
      lineValidation.stockStatus = stockRes.availability?.status;
    }

    if (!hasError) {
      lineValidation.validationState = 'VALID';
      subTotal += lineValidation.lineTotal || 0;
      totalQuantity += line.quantity;
    } else {
      overallState = 'BLOCKED';
    }

    checkoutLines.push(lineValidation);
  }

  if (overallValidationState !== 'VALID') {
    overallState = 'BLOCKED';
  }
  
  // If we still don't have a valid address snapshot for a customer, block.
  if (actorType === 'CUSTOMER' && !finalAddressSnapshot) {
    overallState = 'BLOCKED';
    globalErrors.push('MISSING_SHIPPING_ADDRESS_SELECTION');
  }

  const discountResolution = resolveDiscountSnapshots(discountInputs, cartContext);
  if (discountResolution.errors.length > 0) {
    overallState = 'BLOCKED';
    overallValidationState = 'BLOCKED';
    globalErrors.push(...discountResolution.errors);
  }

  const discountTotal =
    discountResolution.errors.length === 0
      ? Math.min(subTotal, discountResolution.discountTotal)
      : 0;

  const currency = 'TRY';
  const allocatedDiscountSnapshots = attachDiscountLineAllocations(
    discountResolution.snapshots,
    checkoutLines,
    discountTotal,
    currency,
  );

  const summary: CheckoutSummary = {
    totalQuantity,
    subTotal,
    discountTotal,
    grandTotal: subTotal - discountTotal,
    currency,
  };

  const response: CheckoutReviewResponse = {
    checkoutId,
    cartContext,
    state: overallState,
    validationState: overallValidationState,
    lines: checkoutLines,
    summary,
    errors: globalErrors,
    warnings: globalWarnings,
    addressSnapshot: finalAddressSnapshot,
    discountSnapshots: allocatedDiscountSnapshots,
  };

  await getRepository().save(response);
  return response;
}
