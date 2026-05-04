export enum StoreMessageTopic {
  STYLE_ADVICE = 'STYLE_ADVICE',
  ORDER_SUPPORT = 'ORDER_SUPPORT',
  OFFICIAL_PRODUCT_QUESTION = 'OFFICIAL_PRODUCT_QUESTION',
}

export enum StoreMessageThreadStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  REDIRECTED_TO_SUPPORT = 'REDIRECTED_TO_SUPPORT',
  REDIRECTED_TO_QA = 'REDIRECTED_TO_QA',
}

export enum StoreMessageSenderType {
  CUSTOMER = 'CUSTOMER',
  CREATOR = 'CREATOR',
  SYSTEM = 'SYSTEM',
}

export interface StoreMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderType: StoreMessageSenderType;
  body: string;
  createdAt: string;
}

export interface StoreMessageThread {
  id: string;
  storefrontId: string;
  customerId: string;
  topic: StoreMessageTopic;
  status: StoreMessageThreadStatus;
  messages: StoreMessage[];
  lastMessageAt: string;
  createdAt: string;
  closedAt?: string;
  closeReason?: string;
}

export interface StartStoreMessageThreadCommand {
  storefrontId: string;
  topic: StoreMessageTopic;
  initialMessage: string;
}

export interface ReplyStoreMessageCommand {
  threadId: string;
  body: string;
}

export interface CloseStoreMessageThreadCommand {
  threadId: string;
  reason: string;
}

export interface StoreMessageResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: StoreMessageErrorCode;
    message: string;
  };
}

export enum StoreMessageErrorCode {
  THREAD_NOT_FOUND = 'THREAD_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOPIC = 'INVALID_TOPIC',
  INVALID_STATUS = 'INVALID_STATUS',
  THREAD_CLOSED = 'THREAD_CLOSED',
  BODY_REQUIRED = 'BODY_REQUIRED',
  BODY_TOO_LONG = 'BODY_TOO_LONG',
  CLOSE_REASON_REQUIRED = 'CLOSE_REASON_REQUIRED',
  REDIRECTED_TOPIC = 'REDIRECTED_TOPIC',
}
