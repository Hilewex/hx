import { config } from '../config';
import { ThemeTokens, defaultTokens } from '@hx/ui';
import { initializeAuth } from './auth';
import { renderPdpShell, simulatePdpLoad } from './pdp';
import { simulateCartFlow, renderCartShell } from './cart';
import { simulateCheckoutFlow, renderCheckoutShell } from './checkout';
import { simulatePaymentInitiationFlow } from './payment';
import { simulateOrderFlow, renderOrderShell } from './order';
import { simulateShipmentFlow, renderShipmentShell } from './shipment';
import { simulateCancelReturnFlow } from './cancel-return';
import { simulateRefundFlow } from './refund';
import { simulateNotificationFlow } from './notification';
import { simulateSupportFlow } from './support';
import { simulatePostFlow } from './post';
import { simulateUgcFlow } from './ugc';
import { simulateReviewFlow } from './review';
import { simulateQaFlow } from './qa';
import { simulateInteractionFlow } from './interaction';
import { simulateFollowFlow } from './follow';
import { simulateFollowFeedFlow } from './feed';
import { simulateSearchFlow } from './search';
import { simulateCategoryFlow } from './category';
import { simulatePlpFlow } from './plp';
import { simulateStorefrontFlow } from './storefront';
import { simulateStoryFlow } from './story';
import { simulateMediaFlow } from './media';
import { simulateModerationFlow } from './moderation';

export function createAppShell() {
  const theme: ThemeTokens = defaultTokens;
  return {
    mount: async () => {
      console.log(`[Web] Mounted app shell with theme primary: ${theme.colors.primary}`);
      console.log(`[Web] Connecting to BFF at: ${config.NEXT_PUBLIC_BFF_URL}`);
      const authState = initializeAuth();
      console.log(`[Web] Initial Auth State:`, authState);
      
      console.log('\n[Web] Simulating PDP Load for p_valid:');
      renderPdpShell(simulatePdpLoad('p_valid'));
      console.log('\n[Web] Simulating PDP Load for p_unknown:');
      renderPdpShell(simulatePdpLoad('p_unknown'));
      console.log('\n[Web] Simulating PDP Load for p_unavailable:');
      renderPdpShell(simulatePdpLoad('p_unavailable'));

      renderCartShell('LOADING');
      await simulateCartFlow();
      renderCartShell('SUCCESS');

      renderCheckoutShell('LOADING');
      const checkoutId = await simulateCheckoutFlow();
      if (checkoutId) {
        const paymentInfo = await simulatePaymentInitiationFlow(checkoutId);
        if (paymentInfo) {
          renderOrderShell('CREATING');
          const orderId = await simulateOrderFlow(paymentInfo.paymentId, paymentInfo.paymentAttemptId, checkoutId);
          renderOrderShell('CREATED');
          if (orderId) {
            const orderRes = await fetch(`http://localhost:3000/order/${orderId}`).then(r => r.json());
            // P17 FIX: Call simulation which handles its own lifecycle internal steps
            const cancelReturnId = await simulateCancelReturnFlow(orderRes);
            
            // P18 Refund simulation
            if (cancelReturnId) {
              await simulateRefundFlow(cancelReturnId, orderRes);
            }
          }
        }
      }

      // P19 Notification simulation
      await simulateNotificationFlow();

      // P20 Support simulation
      await simulateSupportFlow();

      // P21 Post simulation
      await simulatePostFlow();

      // P21 UGC simulation
      await simulateUgcFlow();

      // P22 Review simulation
      await simulateReviewFlow();

      // P23 Q&A simulation
      await simulateQaFlow();

      // P24 Interaction simulation
      await simulateInteractionFlow();

      // P25 Follow simulation
      await simulateFollowFlow();

      // P25 Follow Feed simulation
      await simulateFollowFeedFlow();

      // P26 Search simulation
      await simulateSearchFlow();

      // P27 Category & PLP simulation
      await simulateCategoryFlow();
      await simulatePlpFlow();

      // P28 Storefront simulation
      const fetchBff = async (path: string) => {
        const bffUrl = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';
        const response = await fetch(`${bffUrl}${path}`);
        return response.json();
      };
      await simulateStorefrontFlow(fetchBff);

      // P29 Story simulation
      await simulateStoryFlow(fetchBff);

      // P30 Media simulation
      const fetchBffFull = async (path: string, options: any = {}) => {
        const bffUrl = config.NEXT_PUBLIC_BFF_URL || 'http://localhost:3000';
        const response = await fetch(`${bffUrl}${path}`, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json'
          }
        });
        return response.json();
      };
      await simulateMediaFlow(fetchBffFull);

      // P31 Moderation simulation
      await simulateModerationFlow(fetchBffFull);
    }
  };
}

