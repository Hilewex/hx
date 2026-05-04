import { 
  createModerationCase, 
  reviewModerationCase, 
  getModerationCase, 
  listModerationCases 
} from '@hx/moderation';
import { approvePostModerationResult, rejectPostModerationResult } from '@hx/post';
import { approveReviewModerationResult, rejectReviewModerationResult } from '@hx/review';
import { approveUgcModerationResult, rejectUgcModerationResult } from '@hx/ugc';
import { approveQuestionModerationResult, rejectQuestionModerationResult } from '@hx/question-answer';
import * as response from './response';
import { requireAuthenticated, requireModerationOperator, requireAdminOrOperator } from './guards';

export const handleCreateModerationCase = async (context: any, body: any) => {
  const authCheck = requireAdminOrOperator(context);
  if (!authCheck.allowed) return authCheck.response;

  try {
    if (!body.target || !body.source) {
      return response.badRequest('MISSING_FIELDS', 'Missing target or source');
    }
    const result = await createModerationCase(body);
    return response.created(result);
  } catch (error: any) {
    return response.internalError();
  }
};

export const handleReviewModerationCase = async (context: any, body: any) => {
  const guardResult = requireModerationOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    if (!body.caseId || !body.decision) {
      return response.badRequest('MISSING_FIELDS', 'Missing caseId or decision');
    }
    const result = await reviewModerationCase(body);

    // [HARDENING-06C1] Moderation Decision Handoff: Trigger target owner transition if needed
    if (result.success && result.caseId) {
      const caseResponse = await getModerationCase({ caseId: result.caseId });
      const caseData = caseResponse?.data;
      
      if (caseData && !caseData.targetTruthMutated) {
        const { targetType, targetId } = caseData.target || {};
        const { decision, note } = body;

        if (targetType && targetId && (decision === 'APPROVE' || decision === 'REJECT')) {
          console.log(`[BFF] Delegating moderation decision handoff for ${targetType}:${targetId} as ${decision}`);
          
          try {
            if (targetType === 'STORE_POST') {
              if (decision === 'APPROVE') await approvePostModerationResult(targetId);
              else await rejectPostModerationResult(targetId, note);
            } else if (targetType === 'REVIEW') {
              if (decision === 'APPROVE') await approveReviewModerationResult(targetId);
              else await rejectReviewModerationResult(targetId, note);
            } else if (targetType === 'UGC') {
              if (decision === 'APPROVE') await approveUgcModerationResult(targetId);
              else await rejectUgcModerationResult(targetId, note);
            } else if (targetType === 'QA_QUESTION') {
              if (decision === 'APPROVE') await approveQuestionModerationResult(targetId);
              else await rejectQuestionModerationResult(targetId, note);
            }
          } catch (handoffError) {
            console.error('[BFF] Moderation handoff delegation failed:', handoffError);
            // We don't fail the moderation review result itself, but log the failure
          }
        }
      }
    }

    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'MODERATION_CASE_NOT_FOUND') {
      return response.notFound('MODERATION_CASE_NOT_FOUND', 'Moderation case not found');
    }
    return response.internalError();
  }
};

export const handleGetModerationCase = async (context: any, query: any) => {
  const guardResult = requireModerationOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    if (!query.caseId) {
      return response.badRequest('MISSING_CASE_ID', 'Missing caseId');
    }
    const result = await getModerationCase({ caseId: query.caseId });
    return response.ok(result);
  } catch (error: any) {
    if (error.message === 'MODERATION_CASE_NOT_FOUND') {
      return response.notFound('MODERATION_CASE_NOT_FOUND', 'Moderation case not found');
    }
    return response.internalError();
  }
};

export const handleListModerationCases = async (context: any, query: any) => {
  const guardResult = requireModerationOperator(context);
  if (!guardResult.allowed) return guardResult.response;

  try {
    const result = await listModerationCases(query);
    return response.ok(result);
  } catch (error: any) {
    return response.internalError();
  }
};
