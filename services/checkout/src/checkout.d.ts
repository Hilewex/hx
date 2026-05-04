import { StartCheckoutCommand, CheckoutReviewResponse } from '@hx/contracts';
import type { ICheckoutRepository } from '@hx/commerce';
export declare function resetRepository(mockRepo?: ICheckoutRepository): void;
export declare function getCheckoutReview(checkoutId: string): Promise<CheckoutReviewResponse | undefined>;
export declare function startCheckout(command: StartCheckoutCommand): Promise<CheckoutReviewResponse>;
//# sourceMappingURL=checkout.d.ts.map
