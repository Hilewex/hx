import { CustomerSupportService } from '@hx/customer-support';
import {
  CheckCustomerSupportEligibilityCommand,
} from '@hx/contracts';

const customerSupportService = new CustomerSupportService();

export async function customerSupportRouter(req: any, res: any, next: any) {
  if (req.method === 'POST' && req.url === '/customer/support-eligibility/check') {
    const actorId = req.context?.actorId || req.context?.sessionId;
    const actorType = req.context?.role;

    if (!actorId || !actorType) {
      return res.status(400).json({
        allowed: false,
        reason: 'Authenticated actor context is required',
      });
    }

    const command = req.body as CheckCustomerSupportEligibilityCommand;

    if (!command || !command.context || !command.action) {
      return res.status(400).json({
        allowed: false,
        reason: 'Request body must contain context and action',
      });
    }

    command.context.actorId = actorId;
    command.context.actorType = actorType as any;

    try {
      const result = await customerSupportService.checkCustomerSupportEligibility(command);
      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json({
        allowed: false,
        reason: e.message,
      });
    }
  }

  next();
}
