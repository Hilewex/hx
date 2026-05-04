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
  QaAnswerStatus
} from '@hx/contracts';

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

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.productTag?.productId) return { success: false, errors: ['QA_PRODUCT_TAG_REQUIRED'] };
  if (!command.body) return { success: false, errors: ['QA_QUESTION_BODY_REQUIRED'] };
  
  if (command.body.length < 5) return { success: false, errors: ['QA_QUESTION_TOO_SHORT'] };
  if (command.body.length > 500) return { success: false, errors: ['QA_QUESTION_TOO_LONG'] };

  if (command.idempotencyKey && store.questionIdempotency.has(command.idempotencyKey)) {
    const existingId = store.questionIdempotency.get(command.idempotencyKey)!;
    return { success: true, question: store.questions.get(existingId) };
  }

  const questionId = `q_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const question: QaQuestionRecord = {
    questionId,
    actorId: command.actorId,
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

  return { success: true, question };
};

export const listQaQuestions = async (query: QaQuestionListQuery) => {
  const store = getQaStore();
  let items = Array.from(store.questions.values());

  if (query.productId) items = items.filter(q => q.productTag.productId === query.productId);
  if (query.actorId) items = items.filter(q => q.actorId === query.actorId);
  if (query.status) items = items.filter(q => q.status === query.status);
  if (query.visibilityState) items = items.filter(q => q.visibilityState === query.visibilityState);

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Simple limit implementation
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
    'SUBMITTED': ['UNDER_REVIEW'],
    'UNDER_REVIEW': ['PUBLISHED', 'REJECTED'],
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
    question.moderationStatus = 'APPROVED';
    question.visibilityState = 'VISIBLE';
    question.publishedAt = now;
  } else if (targetStatus === 'REJECTED') {
    question.moderationStatus = 'REJECTED';
    question.visibilityState = 'NOT_VISIBLE';
    question.rejectedAt = now;
    question.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
  } else if (targetStatus === 'HIDDEN') {
    question.visibilityState = 'HIDDEN_BY_MODERATION';
    question.hiddenAt = now;
  } else if (targetStatus === 'ARCHIVED') {
    question.visibilityState = 'ARCHIVED';
    question.archivedAt = now;
  }

  return { success: true, question };
};

export const createQaAnswer = async (command: CreateQaAnswerCommand): Promise<QaMutationResult> => {
  const store = getQaStore();
  const question = store.questions.get(command.questionId);

  if (!question) return { success: false, errors: ['QA_QUESTION_NOT_FOUND'] };
  if (question.status === 'ARCHIVED') return { success: false, errors: ['QA_QUESTION_CLOSED'] };
  
  if (!command.body) return { success: false, errors: ['QA_ANSWER_BODY_REQUIRED'] };
  if (command.body.length < 2) return { success: false, errors: ['QA_ANSWER_TOO_SHORT'] };
  if (command.body.length > 1000) return { success: false, errors: ['QA_ANSWER_TOO_LONG'] };

  if (!command.authorType) return { success: false, errors: ['QA_ANSWER_AUTHOR_REQUIRED'] };
  if (!command.authorId) return { success: false, errors: ['QA_ANSWER_AUTHOR_REQUIRED'] };
  
  // Rule: Answer author cannot be CUSTOMER (official/authorized only)
  if ((command.authorType as string) === 'CUSTOMER') {
    return { success: false, errors: ['QA_ANSWER_AUTHOR_NOT_ALLOWED'] };
  }

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
    'SUBMITTED': ['UNDER_REVIEW'],
    'UNDER_REVIEW': ['PUBLISHED', 'REJECTED'],
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
    answer.moderationStatus = 'APPROVED';
    answer.visibilityState = 'VISIBLE';
    answer.publishedAt = now;
  } else if (targetStatus === 'REJECTED') {
    answer.moderationStatus = 'REJECTED';
    answer.visibilityState = 'NOT_VISIBLE';
    answer.rejectedAt = now;
    answer.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
  } else if (targetStatus === 'HIDDEN') {
    answer.visibilityState = 'HIDDEN_BY_MODERATION';
    answer.hiddenAt = now;
  } else if (targetStatus === 'ARCHIVED') {
    answer.visibilityState = 'ARCHIVED';
    answer.archivedAt = now;
  }

  return { success: true, question, answer };
};
