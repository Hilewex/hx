import {
  CheckCustomerSocialEligibilityCommand,
  CustomerSocialEligibilityResult,
} from '@hx/contracts';
import { checkCustomerSocialEligibility } from '@hx/customer-social';

export function customerSocialRouter(req: any, res: any, next: any) {
  if (req.method === 'POST' && req.url === '/customer/social-eligibility/check') {
    const actorId = req.headers['x-actor-id'];
    const actorType = req.headers['x-actor-type'];

    if (!actorId || !actorType) {
      return res.status(401).json({ error: 'x-actor-id and x-actor-type headers are required' });
    }

    if (actorType !== 'GUEST' && actorType !== 'REGISTERED_CUSTOMER') {
      return res.status(400).json({ error: 'Invalid x-actor-type header' });
    }

    const command: CheckCustomerSocialEligibilityCommand = req.body;
    const result: CustomerSocialEligibilityResult = checkCustomerSocialEligibility(command);

    return res.json(result);
  }

  if (next) next();
}
