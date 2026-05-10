export type DiscountSponsorType = 'PLATFORM' | 'SUPPLIER' | 'CREATOR' | 'BRAND' | 'MIXED';
export type CheckoutDiscountSourceType = 'COUPON' | 'CAMPAIGN';
export type CouponValidationStatus = 'VALID' | 'BLOCKED' | 'INVALID' | 'EXPIRED' | 'NOT_ELIGIBLE' | 'USAGE_LIMIT_EXCEEDED';
export interface InitialPhaseSponsorPolicy {
    supplierSponsoredDiscountEnabled: false;
    brandSponsoredDiscountEnabled: false;
    creatorCouponEnabledOnCampaignProductsByDefault: false;
    platformSupportedCreatorCouponRequiresAdminRatio: true;
    creatorCouponRequiresMinimumMargin: true;
}
export interface CreatorCouponPolicy {
    creatorId: string;
    creatorStoreId: string;
    minCreatorMarginAmount: number;
    selectedSalePrice?: number;
    poolBasePriceAmount?: number;
    creatorMarginAmount?: number;
    couponDiscountAmount: number;
    platformSupportRatio?: number;
    adminSupportRatioApproved?: boolean;
}
export interface CheckoutDiscountInput {
    sourceType: CheckoutDiscountSourceType;
    code: string;
    creatorCouponPolicy?: CreatorCouponPolicy;
    isCampaignProduct?: boolean;
    creatorCouponEnabledOnCampaignProduct?: boolean;
}
export interface CouponApplicationInput {
    couponCode: string;
}
export interface CouponValidationResult {
    status: CouponValidationStatus;
    discountAmount: number;
    sponsorType?: DiscountSponsorType;
    sponsorId?: string;
    reasonCode?: string;
    appliedCode?: string;
}
export type CheckoutDiscountAllocationMethod = 'PROPORTIONAL' | 'SINGLE_LINE' | 'FOUNDATION_EQUAL_SPLIT';
export interface CheckoutDiscountLineAllocation {
    allocationId: string;
    discountSnapshotId: string;
    discountCode?: string;
    discountKind: CheckoutDiscountSourceType;
    sponsorType?: DiscountSponsorType;
    sponsorId?: string;
    lineId: string;
    cartLineId?: string;
    orderLineId?: string;
    productId?: string;
    allocatedAmount: number;
    currency: string;
    allocationMethod: CheckoutDiscountAllocationMethod;
    createdAt: string;
}
export interface CheckoutDiscountSnapshot {
    discountSnapshotId?: string;
    sourceType: CheckoutDiscountSourceType;
    code: string;
    discountAmount: number;
    sponsorType?: DiscountSponsorType;
    sponsorId?: string;
    validationStatus: CouponValidationStatus;
    reasonCode?: string;
    lineAllocations?: CheckoutDiscountLineAllocation[];
    totalAllocatedAmount?: number;
    allocationComplete?: boolean;
}
//# sourceMappingURL=coupon.d.ts.map