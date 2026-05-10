import {
  CheckCustomerSocialEligibilityCommand,
  CustomerSocialEligibilityResult,
} from '@hx/contracts';
import { checkCustomerSocialEligibility } from '@hx/customer-social';

export function customerSocialRouter(req: any, res: any, next: any) {
  if (req.method === 'POST' && req.url === '/customer/social-eligibility/check') {
    const actorId = req.context?.actorId || req.context?.sessionId;
    const actorType = req.context?.role;

    if (!actorId || !actorType) {
      return res.status(401).json({ error: 'Authenticated actor context is required' });
    }

    if (actorType !== 'GUEST' && actorType !== 'CUSTOMER') {
      return res.status(400).json({ error: 'Invalid actor context' });
    }

    const command: CheckCustomerSocialEligibilityCommand = {
      ...req.body,
      context: {
        ...req.body?.context,
        actorId,
        actorType: actorType === 'CUSTOMER' ? 'REGISTERED_CUSTOMER' : 'GUEST',
      },
    };
    const result: CustomerSocialEligibilityResult = checkCustomerSocialEligibility(command);

    return res.json(result);
  }

  if (next) next();
}
