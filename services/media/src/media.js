"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionUgc = exports.getUgcById = exports.listUgc = exports.createUserProductStory = exports.transitionStorePost = exports.getStorePostById = exports.listStorePosts = exports.createStorePost = void 0;
const getMediaStore = () => {
    const root = globalThis;
    if (!root.__mediaStore) {
        root.__mediaStore = {
            storePosts: new Map(),
            ugc: new Map(),
            postIdempotency: new Map(),
            ugcIdempotency: new Map()
        };
    }
    return root.__mediaStore;
};
const createStorePost = async (command) => {
    const store = getMediaStore();
    if (command.idempotencyKey && store.postIdempotency.has(command.idempotencyKey)) {
        const existingId = store.postIdempotency.get(command.idempotencyKey);
        return { success: true, post: store.storePosts.get(existingId) };
    }
    const errors = [];
    const warnings = [];
    if (!command.creatorId || !command.storefrontId)
        errors.push('CREATOR_AND_STOREFRONT_REQUIRED');
    if (!command.title || !command.body)
        errors.push('TITLE_AND_BODY_REQUIRED');
    if (command.title && command.title.length > 120)
        errors.push('POST_TITLE_TOO_LONG');
    if (command.body && command.body.length > 500)
        errors.push('POST_BODY_TOO_LONG');
    if (command.postType === 'PRODUCT_LINKED' && !command.linkedObject?.productId) {
        errors.push('PRODUCT_LINKED_POST_REQUIRES_PRODUCT_ID');
    }
    if (command.postType === 'COLLECTION' && !command.linkedObject?.collectionId) {
        warnings.push('COLLECTION_POST_MISSING_COLLECTION_ID');
    }
    if (errors.length > 0)
        return { success: false, errors };
    const postId = `post_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const post = {
        postId,
        creatorId: command.creatorId,
        storefrontId: command.storefrontId,
        postType: command.postType,
        status: 'SUBMITTED',
        visibility: command.visibility || 'FOLLOWERS_ONLY',
        moderationStatus: 'PENDING',
        title: command.title,
        body: command.body,
        media: command.media || [],
        linkedObject: command.linkedObject,
        createdAt: now,
        updatedAt: now,
        socialThreadEnabled: false,
        officialStoreCommunication: true,
        supportProcess: false,
        qnaProcess: false,
        storyProcess: false,
        idempotencyKey: command.idempotencyKey,
        errors: [],
        warnings
    };
    store.storePosts.set(postId, post);
    if (command.idempotencyKey)
        store.postIdempotency.set(command.idempotencyKey, postId);
    return { success: true, post, warnings };
};
exports.createStorePost = createStorePost;
const listStorePosts = async (query) => {
    const store = getMediaStore();
    let items = Array.from(store.storePosts.values());
    if (query.storefrontId)
        items = items.filter(p => p.storefrontId === query.storefrontId);
    if (query.creatorId)
        items = items.filter(p => p.creatorId === query.creatorId);
    if (query.status)
        items = items.filter(p => p.status === query.status);
    if (query.postType)
        items = items.filter(p => p.postType === query.postType);
    const warnings = [];
    if (query.followerActorId) {
        warnings.push('FOLLOW_RELATIONSHIP_NOT_VERIFIED');
        items = items.filter(p => p.visibility === 'FOLLOWERS_ONLY' || p.visibility === 'STORE_PROFILE');
    }
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { items, warnings };
};
exports.listStorePosts = listStorePosts;
const getStorePostById = async (postId) => {
    return getMediaStore().storePosts.get(postId);
};
exports.getStorePostById = getStorePostById;
const transitionStorePost = async (command) => {
    const store = getMediaStore();
    const post = store.storePosts.get(command.postId);
    if (!post)
        return { success: false, errors: ['POST_NOT_FOUND'] };
    const currentStatus = post.status;
    const targetStatus = command.targetStatus;
    const allowedTransitions = {
        'DRAFT': ['SUBMITTED'],
        'SUBMITTED': ['UNDER_REVIEW'],
        'UNDER_REVIEW': ['PUBLISHED', 'REJECTED'],
        'PUBLISHED': ['HIDDEN', 'ARCHIVED'],
        'REJECTED': ['ARCHIVED'],
        'HIDDEN': ['PUBLISHED', 'ARCHIVED'],
        'ARCHIVED': []
    };
    if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
        return { success: false, errors: ['INVALID_TRANSITION'], post };
    }
    const now = new Date().toISOString();
    post.status = targetStatus;
    post.updatedAt = now;
    if (targetStatus === 'PUBLISHED') {
        post.publishedAt = now;
        post.moderationStatus = 'APPROVED';
    }
    else if (targetStatus === 'REJECTED') {
        post.rejectedAt = now;
        post.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
        post.moderationStatus = 'REJECTED';
    }
    else if (targetStatus === 'ARCHIVED') {
        post.archivedAt = now;
    }
    return { success: true, post };
};
exports.transitionStorePost = transitionStorePost;
const createUserProductStory = async (command) => {
    const store = getMediaStore();
    if (command.idempotencyKey && store.ugcIdempotency.has(command.idempotencyKey)) {
        const existingId = store.ugcIdempotency.get(command.idempotencyKey);
        return { success: true, ugc: store.ugc.get(existingId) };
    }
    const errors = [];
    const warnings = [];
    if (!command.actorId)
        errors.push('ACTOR_REQUIRED');
    if (!command.productTag?.productId)
        errors.push('UGC_PRODUCT_TAG_REQUIRED');
    if (!command.media || command.media.length === 0)
        errors.push('UGC_MEDIA_REQUIRED');
    if (errors.length > 0)
        return { success: false, errors };
    let eligibility = command.eligibilitySnapshot;
    if (!eligibility || (!eligibility.orderId && !command.productTag.orderId)) {
        eligibility = {
            actorId: command.actorId,
            productId: command.productTag.productId,
            deliveredRequired: true,
            deliveredConfirmed: false,
            eligibilityState: 'REQUIRES_CHECK',
            reason: 'ORDER_DELIVERY_CONTEXT_MISSING'
        };
        warnings.push('UGC_ELIGIBILITY_REQUIRES_ORDER_DELIVERY_CHECK');
    }
    const ugcId = `ugc_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const ugc = {
        ugcId,
        actorId: command.actorId,
        contentType: 'USER_PRODUCT_STORY',
        status: 'SUBMITTED',
        moderationStatus: 'PENDING',
        visibilityState: 'NOT_VISIBLE',
        trustState: eligibility.deliveredConfirmed ? 'VERIFIED_PURCHASE' : 'TRUST_IMPACT_PENDING',
        productTag: command.productTag,
        eligibilitySnapshot: eligibility,
        trustMetadata: {
            verifiedPurchaseLabelVisible: eligibility.deliveredConfirmed,
            returnedProductTrustImpact: false,
            ratingImpactLinked: false,
            autoDeleteOnReturn: false,
            moderationCanHide: true
        },
        media: command.media,
        caption: command.caption,
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
        idempotencyKey: command.idempotencyKey,
        creatorPost: false,
        supportProcess: false,
        qnaProcess: false,
        errors: [],
        warnings
    };
    store.ugc.set(ugcId, ugc);
    if (command.idempotencyKey)
        store.ugcIdempotency.set(command.idempotencyKey, ugcId);
    return { success: true, ugc, warnings };
};
exports.createUserProductStory = createUserProductStory;
const listUgc = async (query) => {
    const store = getMediaStore();
    let items = Array.from(store.ugc.values());
    if (query.actorId)
        items = items.filter(u => u.actorId === query.actorId);
    if (query.productId)
        items = items.filter(u => u.productTag.productId === query.productId);
    if (query.storefrontId)
        items = items.filter(u => u.productTag.storefrontId === query.storefrontId);
    if (query.status)
        items = items.filter(u => u.status === query.status);
    if (query.visibilityState)
        items = items.filter(u => u.visibilityState === query.visibilityState);
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { items };
};
exports.listUgc = listUgc;
const getUgcById = async (ugcId) => {
    return getMediaStore().ugc.get(ugcId);
};
exports.getUgcById = getUgcById;
const transitionUgc = async (command) => {
    const store = getMediaStore();
    const ugc = store.ugc.get(command.ugcId);
    if (!ugc)
        return { success: false, errors: ['UGC_NOT_FOUND'] };
    const currentStatus = ugc.status;
    const targetStatus = command.targetStatus;
    const allowedTransitions = {
        'DRAFT': ['SUBMITTED'],
        'SUBMITTED': ['UNDER_REVIEW'],
        'UNDER_REVIEW': ['APPROVED', 'REJECTED'],
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
        ugc.moderationStatus = 'APPROVED';
        ugc.visibilityState = 'VISIBLE';
        ugc.approvedAt = now;
    }
    else if (targetStatus === 'REJECTED') {
        ugc.moderationStatus = 'REJECTED';
        ugc.visibilityState = 'NOT_VISIBLE';
        ugc.rejectedAt = now;
        ugc.rejectionReason = command.note || 'REJECTED_BY_MODERATION';
    }
    else if (targetStatus === 'HIDDEN') {
        ugc.visibilityState = 'HIDDEN_BY_MODERATION';
        ugc.hiddenAt = now;
    }
    else if (targetStatus === 'ARCHIVED') {
        ugc.visibilityState = 'ARCHIVED';
        ugc.archivedAt = now;
    }
    return { success: true, ugc };
};
exports.transitionUgc = transitionUgc;
