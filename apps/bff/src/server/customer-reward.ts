import { checkCustomerRewardEligibility } from '@hx/customer-reward';
import {
  CheckCustomerRewardEligibilityCommand,
  CustomerRewardEligibilityErrorCode,
} from '@hx/contracts';

export async function customerRewardRouter(req: any, res: any, next: any) {
  if (req.method === 'POST' && req.url === '/customer/reward-eligibility/check') {
    const actorId = req.context?.actorId || req.context?.sessionId;
    const actorType = req.context?.role;

    if (!actorId || !actorType) {
      return res.status(400).json({
        allowed: false,
        reasonCode: CustomerRewardEligibilityErrorCode.INVALID_ACTOR,
        reason: 'Authenticated actor context is required',
      });
    }

    const command = req.body as CheckCustomerRewardEligibilityCommand;

    if (!command || !command.context) {
      return res.status(400).json({
        allowed: false,
        reasonCode: 'INVALID_REQUEST',
        reason: 'Request body must contain context',
      });
    }

    command.context.actorId = actorId;
    command.context.actorType = actorType as any;

    try {
      const result = await checkCustomerRewardEligibility(command.context);
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json({
        allowed: false,
        reasonCode: 'INTERNAL_ERROR',
        reason: e.message,
      });
    }
  }

  next();
}
