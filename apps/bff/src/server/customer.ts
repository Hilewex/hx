
import { Router } from 'express';
import { 
    checkCustomerCapability,
    createCustomerProfile,
    updateCustomerProfile,
    getCustomerProfile,
    getCustomerProfileByActorId,
    listCustomerProfiles,
    suspendCustomerProfile,
    reactivateCustomerProfile,
    closeCustomerProfile
} from '@hx/customer';
import { withGuard, requireCustomer, requireAdminOrOperator, requireSelfOrAdmin, GuardResult } from './guards';

const router: Router = Router();

// Guards
const customerGuard = withGuard((context) => requireCustomer(context));
const guestOrCustomerGuard = withGuard((context) => {
    if (context.role === 'GUEST' || context.role === 'CUSTOMER') return { allowed: true };
    return { allowed: false, response: { status: 403, body: { errors: [{ code: 'FORBIDDEN', message: 'Actor CUSTOMER/GUEST context is required', category: 'permission' }] } } };
});
const adminGuard = withGuard((context) => requireAdminOrOperator(context));
const selfCustomerGuard = withGuard((context, req) => {
    const custCheck = requireCustomer(context);
    if (!custCheck.allowed) return custCheck;
    // Check ownership if customerProfileId is provided in params
    if (req?.params?.customerProfileId) {
        return requireSelfOrAdmin(context, String(req.params.customerProfileId));
    }
    return { allowed: true };
});

// POST /customer/capability/check
router.post('/capability/check', guestOrCustomerGuard, async (req: any, res: any) => {
    try {
        const context = req.context;
        const result = await checkCustomerCapability({
            capability: req.body.capability,
            context: { actorId: context.actorId || 'guest', actorType: context.role },
        });
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// POST /customer/profile
router.post('/profile', customerGuard, async (req: any, res: any) => {
    console.log('[BFF-CUSTOMER] POST /customer/profile received');
    try {
        const actorId = req.context.actorId || 'guest';
        console.log(`[BFF-CUSTOMER] Calling createCustomerProfile with actorId: ${actorId}`);
        const result = await createCustomerProfile({ ...req.body, actorId });
        console.log('[BFF-CUSTOMER] createCustomerProfile returned:', result);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        console.error('[BFF-CUSTOMER] Error in POST /customer/profile:', error);
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// PATCH /customer/profile/:customerProfileId
router.patch('/profile/:customerProfileId', selfCustomerGuard, async (req: any, res: any) => {
    try {
        const context = req.context;
        const result = await updateCustomerProfile(req.params.customerProfileId, context.actorId || 'guest', context.role, req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// GET /customer/profile/:customerProfileId
router.get('/profile/:customerProfileId', selfCustomerGuard, async (req: any, res: any) => {
    try {
        const profile = await getCustomerProfile(req.params.customerProfileId);
        if (!profile) {
            return res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
        }
        res.json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// GET /customer/me
router.get('/me', customerGuard, async (req: any, res: any) => {
    try {
        const actorId = req.context.actorId || 'guest';
        const profile = await getCustomerProfileByActorId(actorId);
        if (!profile) {
            return res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
        }
        res.json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// GET /customer/admin/profiles
router.get('/admin/profiles', adminGuard, async (req: any, res: any) => {
    try {
        const actorType = req.context.role;
        const profiles = await listCustomerProfiles(actorType);
        res.json({ success: true, data: profiles });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// GET /customer/admin/profiles/:customerProfileId
router.get('/admin/profiles/:customerProfileId', adminGuard, async (req: any, res: any) => {
    try {
        const profile = await getCustomerProfile(req.params.customerProfileId);
        if (!profile) {
            return res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND' } });
        }
        res.json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// POST /customer/admin/profiles/:customerProfileId/suspend
router.post('/admin/profiles/:customerProfileId/suspend', adminGuard, async (req: any, res: any) => {
    try {
        const actorType = req.context.role;
        const result = await suspendCustomerProfile(req.params.customerProfileId, actorType, req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// POST /customer/admin/profiles/:customerProfileId/reactivate
router.post('/admin/profiles/:customerProfileId/reactivate', adminGuard, async (req: any, res: any) => {
    try {
        const actorType = req.context.role;
        const result = await reactivateCustomerProfile(req.params.customerProfileId, actorType, req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

// POST /customer/admin/profiles/:customerProfileId/close
router.post('/admin/profiles/:customerProfileId/close', adminGuard, async (req: any, res: any) => {
    try {
        const actorType = req.context.role;
        const result = await closeCustomerProfile(req.params.customerProfileId, actorType, req.body);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { code: error.message } });
    }
});

export default router;
