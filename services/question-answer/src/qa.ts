import { 
  QaQuestionRecord, 
  QaAnswerRecord, 
  CreateQaQuestionCommand, 
  CreateQaAnswerCommand, 
  QaQuestionListQuery, 
  QaQuestionTransitionCommand, 
  QaAnswerTransitionCommand, 
  QaMutationResult,
  QaQuestionStatus,
  QaAnswerStatus,
  CreateModerationCaseCommand
} from '@hx/contracts';
import { createModerationCase } from '@hx/moderation';
import { createInternalRiskSignal } from '@hx/risk';

interface QaStore {
  questions: Map<string, QaQuestionRecord>;
  questionIdempotency: Map<string, string>;
  answerIdempotency: Map<string, string>;
}

const getQaStore = (): QaStore => {
  const root = globalThis as any;
  if (!root.__qaStore) {
    root.__qaStore = {
      questions: new Map(),
      questionIdempotency: new Map(),
      answerIdempotency: new Map()
    };
  }
  return root.__qaStore;
};

export const createQaQuestion = async (command: CreateQaQuestionCommand): Promise<QaMutationResult> => {
  const store = getQaStore();

  if (command.idempotencyKey && store.questionIdempotency.has(command.idempotencyKey)) {
    const existingId = store.questionIdempotency.get(command.idempotencyKey)!;
    return { success: true, question: store.questions.get(existingId) };
  }

  const questionId = `q_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // ABUSE SIGNAL: Repeated question attempt
  const existingQuestions = Array.from(store.questions.values()).filter(
    q => q.actorId === command.actorId && q.productTag.productId === command.productTag.productId && q.body === command.body
  );
  if (existingQuestions.length > 0) {
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'QA_SERVICE',
        reasonCode: 'REPEATED_QUESTION_ATTEMPT',
        metadata: { body: command.body },
        correlationId: command.idempotencyKey
      });
    } catch (e) {
      console.error('[QaService] Risk signal failed:', e);
    }
  }

  // ABUSE SIGNAL: Spam-like question attempt
  const isSpamLike = command.body?.toLowerCase().includes('spam');
  if (isSpamLike) {
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'QA_SERVICE',
        reasonCode: 'SPAM_LIKE_QUESTION',
        metadata: { body: command.body },
        correlationId: command.idempotencyKey ? `spam_qa_${command.idempotencyKey}` : undefined
      });
    } catch (e) {
      console.error('[QaService] Risk signal failed:', e);
    }
  }

  const question: QaQuestionRecord = {
    questionId,
    actorId: command.actorId!,
    actorType: command.actorType || 'CUSTOMER',
    productTag: command.productTag,
    source: command.source || 'PDP',
    body: command.body,
    status: 'SUBMITTED',
    moderationStatus: 'PENDING',
    visibilityState: 'NOT_VISIBLE',
    answers: [],
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    idempotencyKey: command.idempotencyKey,
    reviewProcess: false,
    ratingProcess: false,
    ugcStory: false,
    storePost: false,
    supportProcess: false,
    socialThreadEnabled: false,
    errors: [],
    warnings: []
  };

  store.questions.set(questionId, question);
  if (command.idempotencyKey) store.questionIdempotency.set(command.idempotencyKey, questionId);

  // Trigger moderation case creation
  try {
    const modCommand: CreateModerationCaseCommand = {
      target: {
        targetType: 'QA_QUESTION',
        targetId: questionId,
        ownerActorId: question.actorId,
        productId: question.productTag.productId
      },
      source: 'SYSTEM_RULE',
      riskLevel: 'LOW',
      reasonCodes: ['UNKNOWN'],
      contentText: question.body,
      idempotencyKey: command.idempotencyKey ? `mod_qa_q_${command.idempotencyKey}` : undefined
    };
    await createModerationCase(modCommand);
  } catch (error) {
    console.error('[QaService] Failed to create moderation case for question:', error);
  }

  return { success: true, question };
};

export const approveQuestionModerationResult = async (questionId: string): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(questionId);
  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };

  const now = new Date().toISOString();
  question.moderationStatus = 'APPROVED';
  question.status = 'PUBLISHED';
  question.visibilityState = 'VISIBLE';
  question.publishedAt = now;
  question.updatedAt = now;

  return { success: true, question };
};

export const rejectQuestionModerationResult = async (questionId: string, reason?: string): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(questionId);
  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };

  const now = new Date().toISOString();
  question.moderationStatus = 'REJECTED';
  question.status = 'REJECTED';
  question.visibilityState = 'NOT_VISIBLE';
  question.rejectedAt = now;
  question.updatedAt = now;

  return { success: true, question };
};

export const listQaQuestions = async (query: QaQuestionListQuery) => {
  const store = getQaStore();
  let items = Array.from(store.questions.values());

  // Public Visibility Guard
  if (query.productId) items = items.filter(q => q.productTag.productId === query.productId);
  if (query.actorId) items = items.filter(q => q.actorId === query.actorId);
  
  if (query.status) {
    items = items.filter(q => q.status === query.status);
  } else {
    // Default public: only PUBLISHED
    items = items.filter(q => q.status === 'PUBLISHED');
  }

  // Extra guard for visibility and moderation
  const isPublic = !query.status || query.status === 'PUBLISHED';
  if (isPublic) {
    items = items.filter(q => q.visibilityState === 'VISIBLE' && q.moderationStatus === 'APPROVED');
  }

  // Map answers: filter invisible answers for public
  items = items.map(q => {
    if (isPublic) {
      return {
        ...q,
        answers: q.answers.filter(a => a.status === 'PUBLISHED' && a.visibilityState === 'VISIBLE' && a.moderationStatus === 'APPROVED')
      };
    }
    return q;
  });

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const limit = query.limit || 20;
  items = items.slice(0, limit);

  return { items };
};

export const getQaQuestionById = async (questionId: string) => {
  return getQaStore().questions.get(questionId);
};

export const transitionQaQuestion = async (command: QaQuestionTransitionCommand): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(command.questionId);

  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };

  const currentStatus = question.status;
  const targetStatus = command.targetStatus;

  const allowedTransitions: Record<QaQuestionStatus, QaQuestionStatus[]> = {
    'SUBMITTED': ['UNDER_REVIEW', 'ARCHIVED'],
    'UNDER_REVIEW': ['PUBLISHED', 'REJECTED', 'ARCHIVED'],
    'PUBLISHED': ['HIDDEN', 'ARCHIVED'],
    'REJECTED': ['ARCHIVED'],
    'HIDDEN': ['PUBLISHED', 'ARCHIVED'],
    'ARCHIVED': []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    return { success: false, errors: ['INVALID_TRANSITION'], question };
  }

  const now = new Date().toISOString();
  question.status = targetStatus;
  question.updatedAt = now;

  if (targetStatus === 'PUBLISHED') {
    // question.moderationStatus = 'APPROVED'; // HANDENING-06A: Domain should not set approved/rejected directly
    question.visibilityState = 'VISIBLE';
    question.publishedAt = now;
  } else if (targetStatus === 'REJECTED') {
    // question.moderationStatus = 'REJECTED'; // HANDENING-06A: Domain should not set approved/rejected directly
    question.visibilityState = 'NOT_VISIBLE';
    question.rejectedAt = now;
  }

  return { success: true, question };
};

export const createQaAnswer = async (command: CreateQaAnswerCommand): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(command.questionId);

  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };

  if (command.idempotencyKey && store.answerIdempotency.has(command.idempotencyKey)) {
    const existingId = store.answerIdempotency.get(command.idempotencyKey)!;
    const answer = question.answers.find(a => a.answerId === existingId);
    return { success: true, question, answer };
  }

  const answerId = `ans_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const answer: QaAnswerRecord = {
    answerId,
    questionId: command.questionId,
    authorType: command.authorType,
    authorId: command.authorId,
    body: command.body,
    status: 'SUBMITTED',
    moderationStatus: 'PENDING',
    visibilityState: 'NOT_VISIBLE',
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    officialAnswer: true,
    customerGenerated: false,
    errors: [],
    warnings: []
  };

  question.answers.push(answer);
  question.updatedAt = now;
  if (command.idempotencyKey) store.answerIdempotency.set(command.idempotencyKey, answerId);

  return { success: true, question, answer };
};

export const transitionQaAnswer = async (command: QaAnswerTransitionCommand): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(command.questionId);

  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };
  const answer = question.answers.find(a => a.answerId === command.answerId);
  if (!answer) return { success: false, errors: ['QA_ANSWER_NOT_FOUND'], question };

  const currentStatus = answer.status;
  const targetStatus = command.targetStatus;

  const allowedTransitions: Record<QaAnswerStatus, QaAnswerStatus[]> = {
    'SUBMITTED': ['UNDER_REVIEW', 'ARCHIVED'],
    'UNDER_REVIEW': ['PUBLISHED', 'REJECTED', 'ARCHIVED'],
    'PUBLISHED': ['HIDDEN', 'ARCHIVED'],
    'REJECTED': ['ARCHIVED'],
    'HIDDEN': ['PUBLISHED', 'ARCHIVED'],
    'ARCHIVED': []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    return { success: false, errors: ['INVALID_TRANSITION'], question, answer };
  }

  const now = new Date().toISOString();
  answer.status = targetStatus;
  answer.updatedAt = now;
  question.updatedAt = now;

  if (targetStatus === 'PUBLISHED') {
    // answer.moderationStatus = 'APPROVED'; // HANDENING-06A: Domain should not set approved/rejected directly
    answer.visibilityState = 'VISIBLE';
    answer.publishedAt = now;
  } else if (targetStatus === 'REJECTED') {
    // answer.moderationStatus = 'REJECTED'; // HANDENING-06A: Domain should not set approved/rejected directly
    answer.visibilityState = 'NOT_VISIBLE';
    answer.rejectedAt = now;
  }

  return { success: true, question, answer };
};
