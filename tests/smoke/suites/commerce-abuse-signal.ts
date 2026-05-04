import { SmokeRunner } from '../types';
import { getCustomerHeaders, getGuestHeaders, issueDevAuthToken } from '../auth-utils';

export const commerceAbuseSignalSmoke: SmokeRunner = {
  name: 'commerce-abuse-signal',
  run: async (baseUrl: string) => {
    const results: string[] = [];
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    // Auth context'ler
    const customerA = `cust_a_${Date.now()}`;
    const customerB = `cust_b_${Date.now()}`;
    const abuseGuestId = `guest-${Date.now()}`;
    
    const headersA = getCustomerHeaders(customerA);
    const headersB = getCustomerHeaders(customerB);
    const headersAbuseGuest = { ...getGuestHeaders(), 'session-id': abuseGuestId };
    
    const riskOperatorHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${issueDevAuthToken('risk-op-1', 'ADMIN')}`
    };

    try {
      await fetch(`${baseUrl}/cart/items`, {
        method: 'POST',
        headers: headersAbuseGuest,
        body: JSON.stringify({ productId: 'p1', variantId: 'v1', storefrontId: 's1', quantity: 1 })
      });

      const guestCheckoutStatuses: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const checkoutRes = await fetch(`${baseUrl}/checkout/start`, {
          method: 'POST',
          headers: headersAbuseGuest,
          body: JSON.stringify({ cartId: abuseGuestId })
        });
        guestCheckoutStatuses.push(checkoutRes.status);
      }

      await delay(100);

      // Check Risk Signal for Guest Velocity
      const resGuestSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${abuseGuestId}&targetType=ACCOUNT`, {
        headers: riskOperatorHeaders
      });
      const guestSignals = (await resGuestSignal.json()).data;
      const hasGuestSignal = guestSignals.signals?.some((s: any) => s.reasonCode === 'SUSPICIOUS_VELOCITY' && s.metadata?.reason === 'GUEST_CHECKOUT_RATE_PATTERN');
      
      if (hasGuestSignal) {
        results.push('PASS: Risk signal for guest checkout velocity found');
      } else {
        results.push('FAIL: Risk signal for guest checkout velocity NOT found');
      }

      if (guestCheckoutStatuses.every((status) => status === 200)) {
        results.push('PASS: Guest commerce stayed open after guest checkout signal');
      } else {
        results.push(`FAIL: Guest commerce was blocked after guest checkout signal (${guestCheckoutStatuses.join(',')})`);
      }

      const guestReviewRes = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: headersAbuseGuest,
        body: JSON.stringify({ productId: 'p1', orderId: 'guest-order', rating: 5, content: 'guest review attempt' })
      });
      if (guestReviewRes.status === 401 || guestReviewRes.status === 403) {
        results.push('PASS: Guest social rights stayed closed');
      } else {
        results.push(`FAIL: Guest social rights unexpectedly opened (${guestReviewRes.status})`);
      }

      // 2. Client Amount Spoof Attempt
      // Create a cart and checkout for Customer A
      await fetch(`${baseUrl}/cart/items`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ productId: 'p1', variantId: 'v1', storefrontId: 's1', quantity: 1 })
      });

      const resCheckout = await fetch(`${baseUrl}/checkout/start`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ cartId: customerA })
      });
      const checkout = (await resCheckout.json()).data;
      const checkoutId = checkout.checkoutId;

      // Try to initiate payment with spoofed amount
      const resSpoofPayment = await fetch(`${baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ 
            checkoutId, 
            paymentMethod: 'CARD', 
            amount: 999999,
            currency: 'USD'
        })
      });
      const spoofPayment = (await resSpoofPayment.json()).data;

      await delay(100);

      // Check Risk Signal for Amount Spoof
      const resSpoofSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutId}&targetType=CHECKOUT`, {
        headers: riskOperatorHeaders
      });
      const spoofSignals = (await resSpoofSignal.json()).data;
      const hasSpoofSignal = spoofSignals.signals?.some((s: any) => s.metadata?.reason === 'CLIENT_AMOUNT_SPOOF_ATTEMPT')
        && spoofSignals.signals?.some((s: any) => s.metadata?.reason === 'CLIENT_CURRENCY_SPOOF_ATTEMPT');

      if (hasSpoofSignal) {
        results.push('PASS: Risk signal for client amount spoof found');
      } else {
        results.push('FAIL: Risk signal for client amount spoof NOT found');
      }

      if (spoofPayment?.attempt?.amount !== 999999 && spoofPayment?.attempt?.currency === 'TRY') {
        results.push('PASS: Client amount/currency spoof did not mutate payment truth');
      } else {
        results.push('FAIL: Client amount/currency spoof mutated payment truth');
      }

      // 3. Customer A payment initiate Customer B checkout (Ownership Mismatch)
      // Checkout already exists for Customer A (checkoutId)
      // Customer B tries to initiate payment for Customer A's checkout
      const resPayOwnerMismatch = await fetch(`${baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({ checkoutId, paymentMethod: 'CARD' })
      });

      await delay(100);

      // Check Risk Signal for Payment Ownership Mismatch
      const resPayOwnerSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutId}&targetType=CHECKOUT`, {
        headers: riskOperatorHeaders
      });
      const payOwnerSignals = (await resPayOwnerSignal.json()).data;
      const hasPayOwnerSignal = payOwnerSignals.signals?.some((s: any) => s.metadata?.reason === 'PAYMENT_INITIATE_OWNERSHIP_MISMATCH');

      if (hasPayOwnerSignal) {
        results.push('PASS: Risk signal for payment ownership mismatch found');
      } else {
        results.push('FAIL: Risk signal for payment ownership mismatch NOT found');
      }

      if (resPayOwnerMismatch.status === 403) {
        results.push('PASS: Payment ownership mismatch preserved existing 403 without payment mutation');
      } else {
        results.push(`FAIL: Payment ownership mismatch did not preserve 403 (${resPayOwnerMismatch.status})`);
      }

      // 4. Repeated Failed Payment Attempt (Simulated by invalid amount)
      for (let i = 0; i < 2; i += 1) {
        await fetch(`${baseUrl}/payment/initiate`, {
          method: 'POST',
          headers: headersA,
          body: JSON.stringify({
            checkoutId,
            paymentMethod: 'CARD',
            amount: -50,
            idempotencyKey: `invalid-payment-${Date.now()}-${i}`
          })
        });
      }

      await delay(100);

      const resFailSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutId}&targetType=CHECKOUT`, {
        headers: riskOperatorHeaders
      });
      const failSignals = (await resFailSignal.json()).data;
      const hasFailSignal = failSignals.signals?.some((s: any) => s.metadata?.error === 'INVALID_AMOUNT')
        && failSignals.signals?.some((s: any) => s.metadata?.reason === 'REPEATED_FAILED_PAYMENT_ATTEMPT');

      if (hasFailSignal) {
        results.push('PASS: Risk signal for repeated failed payment attempt found');
      } else {
        results.push('FAIL: Risk signal for repeated failed payment attempt NOT found');
      }

      // 5. Customer A create order from Customer B payment (Ownership Mismatch)
      // First, get a successful payment for Customer B
      await fetch(`${baseUrl}/cart/items`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({ productId: 'p1', variantId: 'v1', storefrontId: 's1', quantity: 1 })
      });
      const resCheckoutB = await fetch(`${baseUrl}/checkout/start`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({ cartId: customerB })
      });
      const checkoutB = (await resCheckoutB.json()).data;
      
      const resPayB = await fetch(`${baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({ checkoutId: checkoutB.checkoutId, paymentMethod: 'CARD' })
      });
      const paymentB = (await resPayB.json()).data;

      // Simulate payment success for B
      await fetch(`${baseUrl}/payment/simulate-success`, {
        method: 'POST',
        headers: headersB,
        body: JSON.stringify({ paymentAttemptId: paymentB.attempt.paymentAttemptId })
      });

      // Customer A tries to create order from Customer B's payment
      const resOrderOwnerMismatch = await fetch(`${baseUrl}/order/create-from-payment`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ 
            paymentId: paymentB.paymentId, 
            paymentAttemptId: paymentB.attempt.paymentAttemptId,
            checkoutId: checkoutB.checkoutId
        })
      });

      await delay(100);

      // Check Risk Signal for Order Ownership Mismatch
      const resOrderOwnerSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutB.checkoutId}&targetType=CHECKOUT`, {
        headers: riskOperatorHeaders
      });
      const orderOwnerSignals = (await resOrderOwnerSignal.json()).data;
      const hasOrderOwnerSignal = orderOwnerSignals.signals?.some((s: any) => s.metadata?.reason === 'ORDER_CREATE_OWNERSHIP_MISMATCH');

      if (hasOrderOwnerSignal) {
        results.push('PASS: Risk signal for order creation ownership mismatch found');
      } else {
        results.push('FAIL: Risk signal for order creation ownership mismatch NOT found');
      }

      if (resOrderOwnerMismatch.status === 403) {
        results.push('PASS: Order ownership mismatch preserved existing 403 without order mutation');
      } else {
        results.push(`FAIL: Order ownership mismatch did not preserve 403 (${resOrderOwnerMismatch.status})`);
      }

      const resPayPending = await fetch(`${baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({
          checkoutId,
          paymentMethod: 'CARD',
          idempotencyKey: `pending-payment-${Date.now()}`
        })
      });
      const pendingPayment = (await resPayPending.json()).data;

      const resNonSuccessOrder = await fetch(`${baseUrl}/order/create-from-payment`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify({ 
            paymentId: pendingPayment.paymentId,
            paymentAttemptId: pendingPayment.attempt.paymentAttemptId,
            checkoutId: checkoutId
        })
      });
      const nonSuccessOrder = (await resNonSuccessOrder.json()).data;

      await delay(100);

      const resNonSuccessSignal = await fetch(`${baseUrl}/risk/signal/list?targetId=${checkoutId}&targetType=ORDER`, {
        headers: riskOperatorHeaders
      });
      const nonSuccessSignals = (await resNonSuccessSignal.json()).data;
      const hasNonSuccessSignal = nonSuccessSignals.signals?.some((s: any) => s.metadata?.error === 'PAYMENT_NOT_SUCCEEDED');

      if (hasNonSuccessSignal) {
        results.push('PASS: Risk signal for non-success payment order attempt found');
      } else {
        results.push('FAIL: Risk signal for non-success payment order attempt NOT found');
      }

      if (nonSuccessOrder?.state === 'CREATE_FAILED' && !nonSuccessOrder?.orderId) {
        results.push('PASS: Non-success payment order attempt did not mutate order truth');
      } else {
        results.push('FAIL: Non-success payment order attempt mutated order truth');
      }

      // 7. targetTruthMutated=false validation
      const allListings = [guestSignals, spoofSignals, payOwnerSignals, failSignals, orderOwnerSignals, nonSuccessSignals];
      const allSignals = allListings.flatMap(l => l.signals || []);
      const mutatedTruth = allSignals.some((s: any) => s.targetTruthMutated === true);
      
      if (!mutatedTruth && allSignals.length > 0) {
          results.push('PASS: targetTruthMutated=false verified for all signals');
      } else if (allSignals.length === 0) {
          results.push('FAIL: No signals were created to verify targetTruthMutated');
      } else {
          results.push('FAIL: Some signals have targetTruthMutated=true');
      }

      const allPassed = results.every(r => r.startsWith('PASS'));
      return {
        result: allPassed ? 'PASS' : 'FAIL',
        message: results.join(' | ')
      };

    } catch (e: any) {
      return { result: 'FAIL', message: `Test error: ${e.message}` };
    }
  }
};
