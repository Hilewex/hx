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


export async function handleAdminProtectedActionExecute(context: any, reqBody: any, headers: Record<string, string | string[] | undefined>) {
  try {
    const payload = reqBody;
    const actorId = context?.actorId || headers['x-actor-id'] as string || payload.actorId;
    const actorRole = context?.actorRole || headers['x-actor-role'] as string || payload.actorRole;

    if (!actorId || !actorRole) {
      return { status: 403, body: { success: false, handoffStatus: 'PERMISSION_DENIED', error: 'Missing actor context' } };
    }

    if (actorRole !== 'admin' && actorRole !== 'super_admin' && actorRole !== 'ops') {
      return { status: 403, body: { success: false, handoffStatus: 'PERMISSION_DENIED', error: 'Actor not in ops scope' } };
    }

    const allowlist = ['APPROVE_PRODUCT_HANDOFF', 'REJECT_PRODUCT_HANDOFF', 'REQUEST_REVISION_HANDOFF', 'REQUIRE_EVIDENCE_HANDOFF'];
    if (!allowlist.includes(payload.actionType)) {
      return { status: 400, body: { success: false, handoffStatus: 'VALIDATION_FAILED', error: 'Invalid action type' } };
    }

    let handoffStatus = 'ACCEPTED_FOR_OWNER_HANDOFF';
    
    if (!payload.targetId || typeof payload.targetId !== 'string') {
      handoffStatus = 'VALIDATION_FAILED';
    }

    if (!payload.idempotencyKey) {
      handoffStatus = 'VALIDATION_FAILED';
    }

    if (!payload.reasonCode && payload.actionType !== 'APPROVE_PRODUCT_HANDOFF') {
      handoffStatus = 'VALIDATION_FAILED';
    }

    if (payload.actionType === 'REQUIRE_EVIDENCE_HANDOFF' && !payload.metadata?.evidenceRefs) {
      handoffStatus = 'EVIDENCE_REQUIRED';
    }

    return {
      status: 200,
      body: {
        success: handoffStatus === 'ACCEPTED_FOR_OWNER_HANDOFF',
        handoffStatus,
        evidence: {
          actorId,
          actionType: payload.actionType,
          targetType: payload.targetType || 'unknown',
          targetId: payload.targetId || 'unknown',
          reasonCode: payload.reasonCode || '',
          correlationId: payload.correlationId || '',
          idempotencyKey: payload.idempotencyKey || '',
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: handoffStatus === 'EVIDENCE_REQUIRED',
          reasonCodeRequired: true,
          permissionChecked: true,
          ownerScopeChecked: true,
          businessTruthMutated: false,
          ownerDomainHandoff: handoffStatus
        },
        auditIntent: {
          intentId: `intent-${Date.now()}`,
          persisted: false,
          message: "Audit intent required but no persistence executed."
        }
      }
    };
  } catch (error) {
    return { status: 500, body: { success: false, handoffStatus: 'OWNER_UNAVAILABLE', error: 'Internal Server Error' } };
  }
}
