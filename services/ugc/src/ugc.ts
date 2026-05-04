import { 
  UgcRecord, 
  CreateUserProductStoryCommand, 
  UgcListQuery, 
  UgcTransitionCommand,
  UgcMutationResult,
  UgcContentStatus,
  UgcVisibilityState,
  CreateModerationCaseCommand
} from '@hx/contracts';
import { createModerationCase } from '@hx/moderation';
import { createInternalRiskSignal } from '@hx/risk';

interface UgcStore {
  items: Map<string, UgcRecord>;
  idempotency: Map<string, string>;
}

const getUgcStore = (): UgcStore => {
  const root = globalThis as any;
  if (!root.__ugcStore) {
    root.__ugcStore = {
      items: new Map(),
      idempotency: new Map()
    };
  }
  return root.__ugcStore;
};

export const createUserProductStory = async (command: CreateUserProductStoryCommand): Promise<UgcMutationResult> => {
  const store = getUgcStore();

  if (command.idempotencyKey && store.idempotency.has(command.idempotencyKey)) {
    const existingId = store.idempotency.get(command.idempotencyKey)!;
    return { success: true, ugc: store.items.get(existingId) };
  }

  const ugcId = `ugc_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // ABUSE SIGNAL: Spam-like create attempt
  const isSpamLike = command.caption?.toLowerCase().includes('spam');
  if (isSpamLike) {
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'LOW',
        source: 'UGC_SERVICE',
        reasonCode: 'SPAM_LIKE_CONTENT',
        metadata: { caption: command.caption },
        correlationId: command.idempotencyKey
      });
    } catch (e) {
      console.error('[UgcService] Risk signal failed:', e);
    }
  }

  // ABUSE SIGNAL: Rejected UGC pattern
  const recentRejectedUgc = Array.from(store.items.values()).filter(
    u => u.actorId === command.actorId && u.status === 'REJECTED'
  );
  if (recentRejectedUgc.length >= 3) {
    try {
      await createInternalRiskSignal({
        targetId: command.actorId!,
        targetType: 'CUSTOMER',
        type: 'SOCIAL_ABUSE',
        level: 'MEDIUM',
        source: 'UGC_SERVICE',
        reasonCode: 'REPEATED_REJECTED_UGC_PATTERN',
        metadata: { rejectedCount: recentRejectedUgc.length },
        correlationId: command.idempotencyKey ? `rejected_ugc_${command.idempotencyKey}` : undefined
      });
    } catch (e) {
      console.error('[UgcService] Risk signal failed:', e);
    }
  }

  const ugc: UgcRecord = {
    ugcId,
    actorId: command.actorId!,
    contentType: 'USER_PRODUCT_STORY',
    status: 'SUBMITTED',
    moderationStatus: 'PENDING',
    visibilityState: 'NOT_VISIBLE',
    trustState: 'VERIFIED_PURCHASE',
    productTag: command.productTag,
    eligibilitySnapshot: {
      actorId: command.actorId!,
      productId: command.productTag.productId,
      deliveredRequired: true,
      deliveredConfirmed: true,
      eligibilityState: 'ELIGIBLE',
      reason: 'FOUNDATION_RESTORED'
    },
    trustMetadata: {
      verifiedPurchaseLabelVisible: true,
      returnedProductTrustImpact: false,
      ratingImpactLinked: false,
      autoDeleteOnReturn: false,
      moderationCanHide: true
    },
    media: command.media || [],
    caption: command.caption,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    idempotencyKey: command.idempotencyKey,
    creatorPost: false,
    supportProcess: false,
    qnaProcess: false,
    errors: [],
    warnings: []
  };

  store.items.set(ugcId, ugc);
  if (command.idempotencyKey) store.idempotency.set(command.idempotencyKey, ugcId);

  // Trigger moderation case creation
  try {
    const modCommand: CreateModerationCaseCommand = {
      target: {
        targetType: 'UGC',
        targetId: ugcId,
        ownerActorId: ugc.actorId,
        productId: ugc.productTag.productId
      },
      source: 'SYSTEM_RULE',
      riskLevel: 'LOW',
      reasonCodes: ['UNKNOWN'],
      contentText: ugc.caption,
      mediaAssetIds: ugc.media.map(m => m.mediaId),
      idempotencyKey: command.idempotencyKey ? `mod_ugc_${command.idempotencyKey}` : undefined
    };
    await createModerationCase(modCommand);
  } catch (error) {
    console.error('[UgcService] Failed to create moderation case:', error);
  }

  return { success: true, ugc };
};

export const approveUgcModerationResult = async (ugcId: string): Promise<UgcMutationResult> => {
  const store = getUgcStore();
  const ugc = store.items.get(ugcId);
  if (!ugc) return { success: false, errors: ['UGC_NOT_FOUND'] };

  const now = new Date().toISOString();
  ugc.moderationStatus = 'APPROVED';
  ugc.status = 'APPROVED';
  ugc.visibilityState = 'VISIBLE';
  ugc.approvedAt = now;
  ugc.updatedAt = now;

  return { success: true, ugc };
};

export const rejectUgcModerationResult = async (ugcId: string, reason?: string): Promise<UgcMutationResult> => {
  const store = getUgcStore();
  const ugc = store.items.get(ugcId);
  if (!ugc) return { success: false, errors: ['UGC_NOT_FOUND'] };

  const now = new Date().toISOString();
  ugc.moderationStatus = 'REJECTED';
  ugc.status = 'REJECTED';
  ugc.visibilityState = 'NOT_VISIBLE';
  ugc.rejectedAt = now;
  ugc.updatedAt = now;
  ugc.rejectionReason = reason || 'REJECTED_BY_MODERATION';

  return { success: true, ugc };
};

export const listUgc = async (query: UgcListQuery) => {
  const store = getUgcStore();
  let items = Array.from(store.items.values());

  // Public Visibility Guard
  if (query.productId) items = items.filter(i => i.productTag.productId === query.productId);
  if (query.actorId) items = items.filter(i => i.actorId === query.actorId);
  if (query.storefrontId) items = items.filter(i => i.productTag.storefrontId === query.storefrontId);
  
  if (query.status) {
    items = items.filter(i => i.status === query.status);
  } else {
    // Default public: only APPROVED
    items = items.filter(i => i.status === 'APPROVED');
  }

  // Extra guard for visibility and moderation
  const isPublic = !query.status || query.status === 'APPROVED';
  if (isPublic) {
    items = items.filter(i => i.visibilityState === 'VISIBLE' && i.moderationStatus === 'APPROVED');
  }

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const limit = query.limit || 20;
  items = items.slice(0, limit);

  return { items };
};

export const getUgcById = async (ugcId: string) => {
  return getUgcStore().items.get(ugcId);
};

export const transitionUgc = async (command: UgcTransitionCommand): Promise<UgcMutationResult> => {
  const store = getUgcStore();
  const ugc = store.items.get(command.ugcId);

  if (!ugc) return { success: false, errors: ['UGC_NOT_FOUND'] };

  const currentStatus = ugc.status;
  const targetStatus = command.targetStatus;

  const allowedTransitions: Record<UgcContentStatus, UgcContentStatus[]> = {
    'DRAFT': ['SUBMITTED', 'ARCHIVED'],
    'SUBMITTED': ['UNDER_REVIEW', 'ARCHIVED'],
    'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'ARCHIVED'],
    'APPROVED': ['HIDDEN', 'ARCHIVED'],
    'REJECTED': ['ARCHIVED'],
    'HIDDEN': ['APPROVED', 'ARCHIVED'],
    'ARCHIVED': []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    return { success: false, errors: ['INVALID_TRANSITION'], ugc };
  }

  const now = new Date().toISOString();
  ugc.status = targetStatus;
  ugc.updatedAt = now;

  if (targetStatus === 'APPROVED') {
    // ugc.moderationStatus = 'APPROVED'; // HANDENING-06A: Domain should not set approved/rejected directly
    ugc.visibilityState = 'VISIBLE';
    ugc.approvedAt = now;
  } else if (targetStatus === 'REJECTED') {
    // ugc.moderationStatus = 'REJECTED'; // HANDENING-06A: Domain should not set approved/rejected directly
    ugc.visibilityState = 'NOT_VISIBLE';
    ugc.rejectedAt = now;
    ugc.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
  }

  return { success: true, ugc };
};
