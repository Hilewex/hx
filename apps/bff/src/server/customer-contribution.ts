import { 
  CheckCustomerContributionEligibilityCommand, 
  CustomerContributionType 
} from '@hx/contracts';
import { checkCustomerContributionEligibility } from '@hx/customer-contribution';

export default async function customerContributionRouter(req: any, res: any, next: any) {
  if (req.url === '/customer/contribution-eligibility/check' && req.method === 'POST') {
    const actorId = req.headers['x-actor-id'] as string;
    const actorType = req.headers['x-actor-type'] as string;

    if (!actorId || !actorType) {
      return res.status(401).json({ error: 'Unauthorized: Missing actor headers' });
    }

    const { context, contributionType } = req.body as CheckCustomerContributionEligibilityCommand;

    if (!context || !contributionType) {
      return res.status(400).json({ error: 'Bad Request: Missing context or contributionType' });
    }

    // Validate type
    if (!Object.values(CustomerContributionType).includes(contributionType)) {
      return res.status(400).json({ error: 'Bad Request: Invalid contributionType' });
    }

    // Override actor in context with headers for security
    const secureContext = {
      ...context,
      actorId,
      actorType: actorType as any,
    };

    try {
      const result = await checkCustomerContributionEligibility({
        context: secureContext,
        contributionType,
      });

      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (next) {
    return next();
  }
}
