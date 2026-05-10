import { validateAdminProtectedAction } from '@hx/admin';
import { AdminProtectedActionRequest } from '@hx/contracts';

export async function handleAdminProtectedActionValidate(context: any, reqBody: any, headers: Record<string, string | string[] | undefined>) {
  try {
    const payload = reqBody as AdminProtectedActionRequest;
    
    // Simulate getting actor info from auth context
    const actorId = context.actorId || headers['x-actor-id'] as string || payload.actorId;
    const actorRole = context.actorRole || headers['x-actor-role'] as string || payload.actorRole;

    const validatedPayload: AdminProtectedActionRequest = {
      ...payload,
      actorId,
      actorRole
    };

    const result = validateAdminProtectedAction(validatedPayload);
    
    if (!result.success) {
      const finalEvidence = { ...result.evidence };
      console.log('FINAL EVIDENCE REASON CODE:', finalEvidence.reasonCode);
      return { status: 403, body: { ...result, evidence: finalEvidence } };
    }

    return { status: 200, body: result };
  } catch (error) {
    return { status: 500, body: { success: false, error: 'Internal Server Error' } };
  }
}
