import { StoreMessageService } from '../../../../services/store-message/src/store-message';
import { StoreMessageSenderType } from '@hx/contracts';

export const storeMessageRouter = {
  fetch: async (req: any, res: any) => {
    const { method, url, body, header, param } = req;
    const parts = url.split('?')[0].split('/').filter((p: string) => p);

    // Customer routes
    if (url.includes('/customer/threads')) {
      const actorType = header('x-actor-type');
      const actorId = header('x-actor-id');

      if (actorType !== StoreMessageSenderType.CUSTOMER || !actorId) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Customer actor required' } });
      }

      if (method === 'POST' && parts.length === 3) { // /store-message/customer/threads
        const result = await StoreMessageService.startStoreMessageThread(
          actorId,
          body.storefrontId,
          body.topic,
          body.initialMessage
        );
        return res.status(200).json(result);
      }

      if (method === 'GET' && parts.length === 3) { // /store-message/customer/threads
        const result = await StoreMessageService.listStoreMessageThreadsForCustomer(actorId);
        return res.status(200).json({ success: true, data: result });
      }

      if (method === 'GET' && parts.length === 4) { // /store-message/customer/threads/:threadId
        const threadId = param('threadId');
        const result = await StoreMessageService.getStoreMessageThread(actorId, actorType as StoreMessageSenderType, threadId);
        return res.status(200).json(result);
      }

      if (method === 'POST' && parts.length === 5 && parts[4] === 'reply') { // /store-message/customer/threads/:threadId/reply
        const threadId = param('threadId');
        const result = await StoreMessageService.replyStoreMessage(
          actorId,
          actorType as StoreMessageSenderType,
          threadId,
          body.body
        );
        return res.status(200).json(result);
      }

      if (method === 'POST' && parts.length === 5 && parts[4] === 'close') { // /store-message/customer/threads/:threadId/close
        const threadId = param('threadId');
        const result = await StoreMessageService.closeStoreMessageThread(
          actorId,
          actorType as StoreMessageSenderType,
          threadId,
          body.reason
        );
        return res.status(200).json(result);
      }
    }

    // Creator routes
    if (url.includes('/creator/threads')) {
      const actorType = header('x-actor-type');
      const actorId = header('x-actor-id');
      const storefrontId = header('x-storefront-id');

      if (actorType !== StoreMessageSenderType.CREATOR || !actorId || !storefrontId) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Creator actor and storefront-id required' } });
      }

      if (method === 'GET' && parts.length === 3) { // /store-message/creator/threads
        const result = await StoreMessageService.listStoreMessageThreadsForCreatorStorefront(storefrontId);
        return res.status(200).json({ success: true, data: result });
      }

      if (method === 'GET' && parts.length === 4) { // /store-message/creator/threads/:threadId
        const threadId = param('threadId');
        const result = await StoreMessageService.getStoreMessageThread(actorId, actorType as StoreMessageSenderType, threadId, storefrontId);
        return res.status(200).json(result);
      }

      if (method === 'POST' && parts.length === 5 && parts[4] === 'reply') { // /store-message/creator/threads/:threadId/reply
        const threadId = param('threadId');
        const result = await StoreMessageService.replyStoreMessage(
          actorId,
          actorType as StoreMessageSenderType,
          threadId,
          body.body,
          storefrontId
        );
        return res.status(200).json(result);
      }

      if (method === 'POST' && parts.length === 5 && parts[4] === 'close') { // /store-message/creator/threads/:threadId/close
        const threadId = param('threadId');
        const result = await StoreMessageService.closeStoreMessageThread(
          actorId,
          actorType as StoreMessageSenderType,
          threadId,
          body.reason,
          storefrontId
        );
        return res.status(200).json(result);
      }
    }

    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
  }
};
