import { 
  CreateQaQuestionCommand, 
  CreateQaAnswerCommand, 
  QaQuestionListQuery, 
  QaQuestionTransitionCommand, 
  QaAnswerTransitionCommand 
} from '@hx/contracts';
import {
  createQaQuestion,
  getQaQuestionById,
  listQaQuestions,
  transitionQaQuestion,
  createQaAnswer,
  transitionQaAnswer
} from '@hx/question-answer';
import * as response from './response';
import { requireSocialCustomerActor, requireOfficialAnswerActor } from './guards';

const mapErrorToResponse = (error: string): response.BffResponse => {
  switch (error) {
    case 'QA_QUESTION_NOT_FOUND':
    case 'QA_ANSWER_NOT_FOUND':
      return response.notFound(error, 'Resource not found');
    case 'QA_ANSWER_AUTHOR_NOT_ALLOWED':
      return response.forbidden(error, 'Author not allowed');
    case 'ACTOR_REQUIRED':
    case 'QA_PRODUCT_TAG_REQUIRED':
    case 'QA_QUESTION_BODY_REQUIRED':
    case 'QA_QUESTION_TOO_SHORT':
    case 'QA_QUESTION_TOO_LONG':
    case 'QA_ANSWER_BODY_REQUIRED':
    case 'QA_ANSWER_TOO_SHORT':
    case 'QA_ANSWER_TOO_LONG':
    case 'QA_ANSWER_AUTHOR_REQUIRED':
    case 'QA_QUESTION_CLOSED':
    case 'INVALID_TRANSITION':
      return response.badRequest(error, 'Validation error');
    default: return response.internalError();
  }
};

export const handleCreateQaQuestion = async (context: any, body: CreateQaQuestionCommand) => {
  const guard = requireSocialCustomerActor(context);
  if (!guard.allowed) return guard.response;

  try {
    const result = await createQaQuestion({ ...body, actorId: context.actorId });
    if (!result.success) {
      return mapErrorToResponse(result.errors?.[0] || 'FAILED');
    }
    return response.created(result);
  } catch (error: any) {
    console.error('[BFF] handleCreateQaQuestion error:', error?.stack || error);
    return response.internalError();
  }
};

export const handleListQaQuestions = async (context: any, query: QaQuestionListQuery) => {
  const result = await listQaQuestions(query);
  return response.ok(result);
};

export const handleGetQaQuestion = async (context: any, questionId: string) => {
  const question = await getQaQuestionById(questionId);
  if (!question) return response.notFound('QA_QUESTION_NOT_FOUND', 'Question not found');
  return response.ok({ success: true, question });
};

export const handleTransitionQaQuestion = async (context: any, body: QaQuestionTransitionCommand) => {
  const guard = requireOfficialAnswerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await transitionQaQuestion({ ...body, actorId: context.actorId });
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};

export const handleCreateQaAnswer = async (context: any, body: CreateQaAnswerCommand) => {
  const guard = requireOfficialAnswerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await createQaAnswer({ ...body, authorId: context.actorId });
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.created(result);
};

export const handleTransitionQaAnswer = async (context: any, body: QaAnswerTransitionCommand) => {
  const guard = requireOfficialAnswerActor(context);
  if (!guard.allowed) return guard.response;

  const result = await transitionQaAnswer({ ...body, actorId: context.actorId });
  if (!result.success) {
    return mapErrorToResponse(result.errors?.[0] || 'FAILED');
  }
  return response.ok(result);
};
