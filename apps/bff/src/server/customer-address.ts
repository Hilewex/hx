import { Router, RequestHandler } from 'express';
import {
  createCustomerAddress,
  updateCustomerAddress,
  archiveCustomerAddress,
  setDefaultCustomerAddress,
  getCustomerAddress,
  listCustomerAddresses,
  checkCheckoutEligibility
} from '@hx/customer-address';
import { CustomerAddressErrorCode } from '@hx/contracts';

const router: Router = Router();

function resolveActor(req: any): { actorId?: string; actorType?: string } {
  return {
    actorId: req.context?.actorId || req.context?.sessionId,
    actorType: req.context?.role,
  };
}

// Middleware to ensure actor is provided
const requireActor = (req: any, res: any, next: any) => {
  const { actorId, actorType } = resolveActor(req);
  if (!actorId || !actorType) {
    return res.status(401).json({ success: false, error: 'Unauthorized: missing actor info' });
  }
  next();
};

const requireCustomer = (req: any, res: any, next: any) => {
  const { actorType } = resolveActor(req);
  if (actorType !== 'CUSTOMER') {
    return res.status(403).json({ success: false, error: 'Forbidden: only CUSTOMER allowed' });
  }
  next();
};

router.post('/customer/address', requireActor, async (req, res) => {
  try {
    const { actorId, actorType } = resolveActor(req);

    if (actorType === 'GUEST') {
      return res.status(403).json({ success: false, error: CustomerAddressErrorCode.GUEST_CANNOT_CREATE_ADDRESS });
    }
    
    if (actorType !== 'CUSTOMER') {
        return res.status(403).json({ success: false, error: 'Forbidden: only CUSTOMER allowed' });
    }

    const command = req.body;
    const address = await createCustomerAddress(actorId!, actorType!, command);
    res.status(201).json({ success: true, data: address });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/customer/address/:addressId', requireActor, requireCustomer, async (req, res) => {
  try {
    const { actorId } = resolveActor(req);
    const addressId = req.params.addressId;
    const command = req.body;
    const address = await updateCustomerAddress(actorId!, addressId, command);
    res.json({ success: true, data: address });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/customer/address/:addressId/archive', requireActor, requireCustomer, async (req, res) => {
  try {
    const { actorId } = resolveActor(req);
    const addressId = req.params.addressId;
    const address = await archiveCustomerAddress(actorId!, addressId);
    res.json({ success: true, data: address });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/customer/address/:addressId/set-default', requireActor, requireCustomer, async (req, res) => {
  try {
    const { actorId } = resolveActor(req);
    const addressId = req.params.addressId;
    const address = await setDefaultCustomerAddress(actorId!, addressId);
    res.json({ success: true, data: address });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/customer/address/:addressId', requireActor, requireCustomer, async (req, res) => {
  try {
    const { actorId } = resolveActor(req);
    const addressId = req.params.addressId;
    const address = await getCustomerAddress(actorId!, addressId);
    res.json({ success: true, data: address });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/customer/addresses', requireActor, requireCustomer, async (req, res) => {
  try {
    const { actorId } = resolveActor(req);
    const addresses = await listCustomerAddresses(actorId!);
    res.json({ success: true, data: addresses });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/customer/checkout-eligibility/check', requireActor, async (req, res) => {
  try {
    const { actorId, actorType } = resolveActor(req);
    const result = await checkCheckoutEligibility(actorId!, actorType!);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
