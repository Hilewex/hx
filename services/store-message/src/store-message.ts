import {
  StoreMessageThread,
  StoreMessageTopic,
  StoreMessageThreadStatus,
  StoreMessageSenderType,
  StoreMessageErrorCode,
  StoreMessageResult,
  StoreMessage
} from '@hx/contracts';

// In-memory foundation store
const threads: StoreMessageThread[] = [];

export const StoreMessageService = {
  startStoreMessageThread: async (
    actorId: string,
    storefrontId: string,
    topic: StoreMessageTopic,
    initialMessage: string
  ): Promise<StoreMessageResult<StoreMessageThread>> => {
    // Redirect topic guard
    if (topic === StoreMessageTopic.ORDER_SUPPORT) {
      const thread: StoreMessageThread = {
        id: `thread_${Date.now()}`,
        storefrontId,
        customerId: actorId,
        topic,
        status: StoreMessageThreadStatus.REDIRECTED_TO_SUPPORT,
        messages: [],
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      threads.push(thread);
      return { success: true, data: thread };
    }

    if (topic === StoreMessageTopic.OFFICIAL_PRODUCT_QUESTION) {
      const thread: StoreMessageThread = {
        id: `thread_${Date.now()}`,
        storefrontId,
        customerId: actorId,
        topic,
        status: StoreMessageThreadStatus.REDIRECTED_TO_QA,
        messages: [],
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      threads.push(thread);
      return { success: true, data: thread };
    }

    // Body required/max length guard
    if (!initialMessage || initialMessage.trim() === '') {
      return { success: false, error: { code: StoreMessageErrorCode.BODY_REQUIRED, message: 'Message body is required' } };
    }
    if (initialMessage.length > 1000) {
      return { success: false, error: { code: StoreMessageErrorCode.BODY_TOO_LONG, message: 'Message body too long' } };
    }

    const threadId = `thread_${Date.now()}`;
    const newMessage: StoreMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: actorId,
      senderType: StoreMessageSenderType.CUSTOMER,
      body: initialMessage,
      createdAt: new Date().toISOString(),
    };

    const thread: StoreMessageThread = {
      id: threadId,
      storefrontId,
      customerId: actorId,
      topic,
      status: StoreMessageThreadStatus.OPEN,
      messages: [newMessage],
      lastMessageAt: newMessage.createdAt,
      createdAt: newMessage.createdAt,
    };

    threads.push(thread);
    return { success: true, data: thread };
  },

  replyStoreMessage: async (
    actorId: string,
    actorType: StoreMessageSenderType,
    threadId: string,
    body: string,
    storefrontId?: string
  ): Promise<StoreMessageResult<StoreMessage>> => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
      return { success: false, error: { code: StoreMessageErrorCode.THREAD_NOT_FOUND, message: 'Thread not found' } };
    }

    // Closed/archived/redirected thread reply guard
    if (thread.status !== StoreMessageThreadStatus.OPEN) {
      return { success: false, error: { code: StoreMessageErrorCode.THREAD_CLOSED, message: 'Thread is not open' } };
    }

    // Scope guards
    if (actorType === StoreMessageSenderType.CUSTOMER && thread.customerId !== actorId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your thread' } };
    }
    if (actorType === StoreMessageSenderType.CREATOR && thread.storefrontId !== storefrontId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your storefront thread' } };
    }

    // Body required/max length guard
    if (!body || body.trim() === '') {
      return { success: false, error: { code: StoreMessageErrorCode.BODY_REQUIRED, message: 'Message body is required' } };
    }
    if (body.length > 1000) {
      return { success: false, error: { code: StoreMessageErrorCode.BODY_TOO_LONG, message: 'Message body too long' } };
    }

    const newMessage: StoreMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: actorId,
      senderType: actorType,
      body,
      createdAt: new Date().toISOString(),
    };

    thread.messages.push(newMessage);
    thread.lastMessageAt = newMessage.createdAt;

    return { success: true, data: newMessage };
  },

  closeStoreMessageThread: async (
    actorId: string,
    actorType: StoreMessageSenderType,
    threadId: string,
    reason: string,
    storefrontId?: string
  ): Promise<StoreMessageResult<StoreMessageThread>> => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
      return { success: false, error: { code: StoreMessageErrorCode.THREAD_NOT_FOUND, message: 'Thread not found' } };
    }

    // Scope guards
    if (actorType === StoreMessageSenderType.CUSTOMER && thread.customerId !== actorId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your thread' } };
    }
    if (actorType === StoreMessageSenderType.CREATOR && thread.storefrontId !== storefrontId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your storefront thread' } };
    }

    // Close reason guard
    if (!reason || reason.trim() === '') {
      return { success: false, error: { code: StoreMessageErrorCode.CLOSE_REASON_REQUIRED, message: 'Close reason is required' } };
    }

    thread.status = StoreMessageThreadStatus.CLOSED;
    thread.closedAt = new Date().toISOString();
    thread.closeReason = reason;

    return { success: true, data: thread };
  },

  getStoreMessageThread: async (
    actorId: string,
    actorType: StoreMessageSenderType,
    threadId: string,
    storefrontId?: string
  ): Promise<StoreMessageResult<StoreMessageThread>> => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
      return { success: false, error: { code: StoreMessageErrorCode.THREAD_NOT_FOUND, message: 'Thread not found' } };
    }

    // Scope guards
    if (actorType === StoreMessageSenderType.CUSTOMER && thread.customerId !== actorId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your thread' } };
    }
    if (actorType === StoreMessageSenderType.CREATOR && thread.storefrontId !== storefrontId) {
      return { success: false, error: { code: StoreMessageErrorCode.UNAUTHORIZED, message: 'Not your storefront thread' } };
    }

    return { success: true, data: thread };
  },

  listStoreMessageThreadsForCustomer: async (customerId: string): Promise<StoreMessageThread[]> => {
    return threads.filter(t => t.customerId === customerId);
  },

  listStoreMessageThreadsForCreatorStorefront: async (storefrontId: string): Promise<StoreMessageThread[]> => {
    return threads.filter(t => t.storefrontId === storefrontId);
  }
};
