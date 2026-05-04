import { 
  InteractionRecord, 
  InteractionCounterSummary, 
  ToggleInteractionCommand, 
  RemoveInteractionCommand, 
  ShareInteractionCommand, 
  GetInteractionStateQuery, 
  ListActorInteractionsQuery, 
  InteractionMutationResult,
  InteractionStateResponse,
  ActorInteractionListResponse,
  InteractionActionType,
  InteractionTargetType,
  InteractionState
} from '@hx/contracts';

interface InteractionStore {
  interactions: Map<string, InteractionRecord>;
  actorTargetActionIndex: Map<string, string>;
  idempotencyIndex: Map<string, string>;
}

const getInteractionStore = (): InteractionStore => {
  const root = globalThis as any;
  if (!root.__interactionStore) {
    root.__interactionStore = {
      interactions: new Map(),
      actorTargetActionIndex: new Map(),
      idempotencyIndex: new Map()
    };
  }
  return root.__interactionStore;
};

const getIndexKey = (actorId: string, targetType: InteractionTargetType, targetId: string, actionType: InteractionActionType): string => {
  return `${actorId}:${targetType}:${targetId}:${actionType}`;
};

export const getInteractionCounterSummary = async (targetType: InteractionTargetType, targetId: string): Promise<InteractionCounterSummary> => {
  const store = getInteractionStore();
  const interactions = Array.from(store.interactions.values()).filter(i => 
    i.target.targetType === targetType && 
    i.target.targetId === targetId && 
    i.state === 'ACTIVE'
  );

  return {
    targetType,
    targetId,
    likeCount: interactions.filter(i => i.actionType === 'LIKE').length,
    saveCount: interactions.filter(i => i.actionType === 'SAVE').length,
    shareCount: interactions.filter(i => i.actionType === 'SHARE').length,
    helpfulCount: interactions.filter(i => i.actionType === 'HELPFUL').length,
    voteUpCount: interactions.filter(i => i.actionType === 'VOTE_UP').length,
    voteDownCount: interactions.filter(i => i.actionType === 'VOTE_DOWN').length,
    lastCalculatedAt: new Date().toISOString()
  };
};

export const toggleInteraction = async (command: ToggleInteractionCommand): Promise<InteractionMutationResult> => {
  const store = getInteractionStore();

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.target?.targetType) return { success: false, errors: ['INTERACTION_TARGET_TYPE_REQUIRED'] };
  if (!command.target?.targetId) return { success: false, errors: ['INTERACTION_TARGET_ID_REQUIRED'] };
  if (!command.actionType) return { success: false, errors: ['INTERACTION_ACTION_REQUIRED'] };

  if (command.actionType === 'SHARE') return { success: false, errors: ['SHARE_REQUIRES_RECORD_SHARE'] };

  // Validation Action-Target
  const allowed: Record<InteractionActionType, InteractionTargetType[]> = {
    'LIKE': ['PRODUCT', 'STORE_POST', 'USER_PRODUCT_STORY', 'STORE_STORY', 'VIDEO_PRODUCT_CARD'],
    'SAVE': ['PRODUCT', 'STORE_POST', 'USER_PRODUCT_STORY', 'STORE_STORY', 'VIDEO_PRODUCT_CARD'],
    'HELPFUL': ['REVIEW', 'QA_QUESTION', 'QA_ANSWER'],
    'VOTE_UP': ['QA_QUESTION', 'QA_ANSWER'],
    'VOTE_DOWN': ['QA_QUESTION', 'QA_ANSWER'],
    'SHARE': [] // handled above
  };

  if (!allowed[command.actionType]?.includes(command.target.targetType)) {
    return { success: false, errors: ['INTERACTION_TARGET_ACTION_NOT_ALLOWED'] };
  }

  if (command.idempotencyKey && store.idempotencyIndex.has(command.idempotencyKey)) {
    const existingId = store.idempotencyIndex.get(command.idempotencyKey)!;
    const interaction = store.interactions.get(existingId);
    const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
    return { success: true, interaction, state: interaction?.state, counters };
  }

  // Mutual exclusion for VOTE_UP/VOTE_DOWN
  if (command.actionType === 'VOTE_UP' || command.actionType === 'VOTE_DOWN') {
    const otherAction: InteractionActionType = command.actionType === 'VOTE_UP' ? 'VOTE_DOWN' : 'VOTE_UP';
    const otherKey = getIndexKey(command.actorId, command.target.targetType, command.target.targetId, otherAction);
    if (store.actorTargetActionIndex.has(otherKey)) {
      const otherId = store.actorTargetActionIndex.get(otherKey)!;
      const otherRecord = store.interactions.get(otherId);
      if (otherRecord && otherRecord.state === 'ACTIVE') {
        otherRecord.state = 'REMOVED';
        otherRecord.removedAt = new Date().toISOString();
        otherRecord.updatedAt = otherRecord.removedAt;
      }
    }
  }

  const indexKey = getIndexKey(command.actorId, command.target.targetType, command.target.targetId, command.actionType);
  let interaction: InteractionRecord;
  let newState: InteractionState;

  if (store.actorTargetActionIndex.has(indexKey)) {
    const id = store.actorTargetActionIndex.get(indexKey)!;
    interaction = store.interactions.get(id)!;
    newState = interaction.state === 'ACTIVE' ? 'REMOVED' : 'ACTIVE';
    interaction.state = newState;
    interaction.updatedAt = new Date().toISOString();
    if (newState === 'REMOVED') interaction.removedAt = interaction.updatedAt;
  } else {
    const interactionId = `int_${Math.random().toString(36).substr(2, 9)}`;
    newState = 'ACTIVE';
    interaction = {
      interactionId,
      actorId: command.actorId,
      actorType: command.actorType || 'CUSTOMER',
      target: command.target,
      actionType: command.actionType,
      state: 'ACTIVE',
      visibility: command.actionType === 'SAVE' ? 'PRIVATE' : 'PUBLIC_AGGREGATE_ONLY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      idempotencyKey: command.idempotencyKey,
      optimisticClientMutationId: command.optimisticClientMutationId,
      contentTruthMutated: false,
      ratingTruthMutated: false,
      qaTruthMutated: false,
      supportProcess: false,
      notificationEmitted: false,
      errors: [],
      warnings: ['INTERACTION_TARGET_EXISTENCE_NOT_VERIFIED']
    };
    store.interactions.set(interactionId, interaction);
    store.actorTargetActionIndex.set(indexKey, interactionId);
  }

  if (command.idempotencyKey) store.idempotencyIndex.set(command.idempotencyKey, interaction.interactionId);

  const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
  return { success: true, interaction, state: newState, counters };
};

export const removeInteraction = async (command: RemoveInteractionCommand): Promise<InteractionMutationResult> => {
  const store = getInteractionStore();

  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.target?.targetType) return { success: false, errors: ['INTERACTION_TARGET_TYPE_REQUIRED'] };
  if (!command.target?.targetId) return { success: false, errors: ['INTERACTION_TARGET_ID_REQUIRED'] };
  if (!command.actionType) return { success: false, errors: ['INTERACTION_ACTION_REQUIRED'] };

  const indexKey = getIndexKey(command.actorId, command.target.targetType, command.target.targetId, command.actionType);
  
  if (!store.actorTargetActionIndex.has(indexKey)) {
    const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
    return { success: true, state: 'REMOVED', warnings: ['INTERACTION_ALREADY_ABSENT'], counters };
  }

  const id = store.actorTargetActionIndex.get(indexKey)!;
  const interaction = store.interactions.get(id)!;
  interaction.state = 'REMOVED';
  interaction.updatedAt = new Date().toISOString();
  interaction.removedAt = interaction.updatedAt;

  const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
  return { success: true, interaction, state: 'REMOVED', counters };
};

export const recordShareInteraction = async (command: ShareInteractionCommand): Promise<InteractionMutationResult> => {
  const store = getInteractionStore();
  
  if (!command.actorId) return { success: false, errors: ['ACTOR_REQUIRED'] };
  if (!command.target?.targetType) return { success: false, errors: ['INTERACTION_TARGET_TYPE_REQUIRED'] };
  if (!command.target?.targetId) return { success: false, errors: ['INTERACTION_TARGET_ID_REQUIRED'] };

  if (command.idempotencyKey && store.idempotencyIndex.has(command.idempotencyKey)) {
    const existingId = store.idempotencyIndex.get(command.idempotencyKey)!;
    const interaction = store.interactions.get(existingId);
    const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
    return { success: true, interaction, state: 'ACTIVE', counters };
  }

  const interactionId = `int_sh_${Math.random().toString(36).substr(2, 9)}`;
  const interaction: InteractionRecord = {
    interactionId,
    actorId: command.actorId,
    actorType: command.actorType || 'CUSTOMER',
    target: command.target,
    actionType: 'SHARE',
    state: 'ACTIVE',
    visibility: 'PUBLIC_AGGREGATE_ONLY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    idempotencyKey: command.idempotencyKey,
    optimisticClientMutationId: command.optimisticClientMutationId,
    contentTruthMutated: false,
    ratingTruthMutated: false,
    qaTruthMutated: false,
    supportProcess: false,
    notificationEmitted: false,
    errors: [],
    warnings: ['INTERACTION_TARGET_EXISTENCE_NOT_VERIFIED', 'SHARE_PROVIDER_NOT_CONFIGURED']
  };

  store.interactions.set(interactionId, interaction);
  if (command.idempotencyKey) store.idempotencyIndex.set(command.idempotencyKey, interactionId);

  const counters = await getInteractionCounterSummary(command.target.targetType, command.target.targetId);
  return { success: true, interaction, state: 'ACTIVE', counters };
};

export const getInteractionState = async (query: GetInteractionStateQuery): Promise<InteractionStateResponse> => {
  const store = getInteractionStore();
  const counters = await getInteractionCounterSummary(query.targetType, query.targetId);
  
  const response: InteractionStateResponse = {
    target: { targetType: query.targetType, targetId: query.targetId },
    counters
  };

  if (query.actorId) {
    const actorState: any = {};
    const actions: InteractionActionType[] = ['LIKE', 'SAVE', 'HELPFUL', 'VOTE_UP', 'VOTE_DOWN'];
    for (const action of actions) {
      const key = getIndexKey(query.actorId, query.targetType, query.targetId, action);
      if (store.actorTargetActionIndex.has(key)) {
        const id = store.actorTargetActionIndex.get(key)!;
        actorState[action] = store.interactions.get(id)!.state;
      }
    }
    response.actorState = actorState;
  }

  return response;
};

export const listActorInteractions = async (query: ListActorInteractionsQuery): Promise<ActorInteractionListResponse> => {
  const store = getInteractionStore();
  let items = Array.from(store.interactions.values()).filter(i => i.actorId === query.actorId);

  if (query.actionType) items = items.filter(i => i.actionType === query.actionType);
  if (query.targetType) items = items.filter(i => i.target.targetType === query.targetType);
  if (query.state) items = items.filter(i => i.state === query.state);

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const limit = query.limit || 20;
  items = items.slice(0, limit);

  return { items };
};
