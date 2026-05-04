import * as http from 'http';
import { config } from '../config';
import { resolveContext } from './context';
import { checkAccess } from './access';
import { handleProtectedAction } from './actions';
import { handleCatalogProductCards, handleCatalogProductRead, handlePdpRead } from './catalog';
import { handleGetCart, handleAddToCart, handleUpdateCartLine, handleRemoveCartLine } from './cart';
import { handleStartCheckout } from './checkout';
import { handleInitiatePayment } from './payment';
import { handleCreateOrder, handleSimulatePaymentSuccess, handleGetOrderDetail } from './order';
import { 
  handleCreateShipmentFromOrder, 
  handleGetShipmentDetail, 
  handleTransitionShipmentState 
} from './shipment';
import {
  handleCreateCancelRequest,
  handleCreateReturnRequest,
  handleGetCancelReturnRequest,
  handleTransitionCancelReturnRequest
} from './cancel-return';
import {
  handleCreateRefundFromCancelReturn,
  handleGetRefundDetail,
  handleProcessRefund,
  handleTransitionRefund
} from './refund';
import {
  handleCreateNotification,
  handleListNotifications,
  handleGetNotification,
  handleMarkNotificationRead,
  handleArchiveNotification
} from './notification';
import {
  handleCreateSupportTicket,
  handleListSupportTickets,
  handleGetSupportTicket,
  handleTransitionSupportTicket,
  handleAddSupportTicketMessage
} from './support';
import {
  handleCreateStorePost,
  handleListStorePosts,
  handleGetStorePost,
  handleTransitionStorePost
} from './post';
import {
  handleCreateUserProductStory,
  handleListUgc,
  handleGetUgc,
  handleTransitionUgc
} from './ugc';
import {
  handleCreateReview,
  handleUpdateReview,
  handleListReviews,
  handleGetReview,
  handleTransitionReview,
  handleApplyReviewReturnImpact,
  handleGetProductRatingSummary
} from './review';
import {
  handleCreateQaQuestion,
  handleListQaQuestions,
  handleGetQaQuestion,
  handleTransitionQaQuestion,
  handleCreateQaAnswer,
  handleTransitionQaAnswer
} from './qa';
import {
  handleToggleInteraction,
  handleRemoveInteraction,
  handleRecordShareInteraction,
  handleGetInteractionState,
  handleListActorInteractions
} from './interaction';
import {
  handleFollowCreator,
  handleUnfollowCreator,
  handleGetFollowState,
  handleListFollowing
} from './follow';
import {
  handleGetFollowFeed
} from './feed';
import {
  handleSearch
} from './search';
import { handleListCategories, handleGetCategoryDetail } from './category';
import { handleGetPlp } from './plp';
import { storefrontRouter } from './storefront';
import { handleListStoryTray, handleGetStoryViewer } from './story';
import { customerRewardRouter } from './customer-reward';  
import { customerSupportRouter } from './customer-support';

export { customerRewardRouter, customerSupportRouter };
import { 
  handleIntakeMediaUpload, 
  handleProcessMediaAsset, 
  handleGetMediaAsset, 
  handleListMediaAssets, 
  handleGetMediaVisibility 
} from './media';
import {
  handleCreateModerationCase,
  handleReviewModerationCase,
  handleGetModerationCase,
  handleListModerationCases
} from './moderation';
import {
  handleCreateRiskSignal,
  handleListRiskSignals,
  handleCreateRiskCase,
  handleReviewRiskCase,
  handleGetRiskCase,
  handleListRiskCases
} from './risk';
import { handleGetOrderOpsOverview } from './order-ops';
import {
  handleCreateSettlementFromOrder,
  handleApplySettlementAction,
  handleGetSettlementLine,
  handleListSettlementLines
} from './settlement';
import {
  handleCreatePayoutItemsFromSettlement,
  handleCreatePayoutBatch,
  handleApplyPayoutItemAction,
  handleApplyPayoutBatchAction,
  handleGetPayoutItem,
  handleGetPayoutBatch,
  handleListPayoutItems,
  handleListPayoutBatches,
  handleCreateSmokeTestPayoutItem
} from './payout';
import {
  handleIngestAnalyticsEvent,
  handleGetMetricSnapshot,
  handleListMetricSnapshots,
  handleGetDashboardSeed
} from './analytics';
import {
  handleCreateFinanceCorrection,
  handleCreateFinanceCorrectionFromRefund,
  handleReviewFinanceCorrection,
  handleGetFinanceCorrection,
  handleListFinanceCorrections
} from './finance-correction';
import * as pool from './pool';
import * as storeStory from './store-story';
import storePostRouter from './store-post';
import { storeMessageRouter } from './store-message';
import customerRouter from './customer';
import customerAddressRouter from './customer-address';
import customerContributionRouter from './customer-contribution';
import { customerSocialRouter } from './customer-social';




import * as response from './response';


async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('INVALID_JSON')); }
    });
  });
}

export function createServer() {
  const server = http.createServer(async (req, res) => {
    console.log(`[BFF] Received request: ${req.method} ${req.url}`);
    const authHeader = req.headers['authorization'] as string | undefined;
    const actorIdHeader = req.headers['x-actor-id'] as string | undefined;
    const actorTypeHeader = req.headers['x-actor-type'] as string | undefined;
    const sessionIdHeader = req.headers['session-id'] as string | undefined;
    
    let { context } = resolveContext(authHeader, actorIdHeader, sessionIdHeader);
    
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // We remove the hardcoded actorIdHeader block to respect context resolve entirely,
    // or we can let context resolver handle legacy header if env var is true.
    if (actorIdHeader && !context.isAuthenticated && process.env.ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE !== 'true') {
        // Fallback for some hardcoded endpoints if needed, but better to rely on context.
    }

    const sendBffResponse = (result: response.BffResponse) => {
      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.body));
    };

    const sendJson = (status: number, data: any) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Helper for body parsing with error handling
    let body: any = {};
    if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE') {
      try {
        body = await parseBody(req);
      } catch (e) {
        return sendBffResponse(response.badRequest('INVALID_JSON', 'Malformed JSON body'));
      }
    }

    if (req.url === '/health' && req.method === 'GET') {
      return sendBffResponse(response.ok({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }));
    }

    if (req.url === '/public' && req.method === 'GET') {
      return sendBffResponse(response.ok({ message: 'Public data', context }));
    }

    if (req.url === '/protected' && req.method === 'GET') {
      const decision = checkAccess(context, ['CUSTOMER', 'ADMIN', 'OPERATOR', 'SUPPLIER']);
      if (!decision.isAllowed) {
        return sendBffResponse(decision.reason === 'UNAUTHORIZED' 
          ? response.unauthorized('UNAUTHORIZED', 'Unauthorized access')
          : response.forbidden('FORBIDDEN', 'Forbidden access')
        );
      }
      return sendBffResponse(response.ok({ message: 'Protected data', context }));
    }

    if (req.url === '/admin-only' && req.method === 'GET') {
      const decision = checkAccess(context, ['ADMIN']);
      if (!decision.isAllowed) {
        return sendBffResponse(decision.reason === 'UNAUTHORIZED' 
          ? response.unauthorized('UNAUTHORIZED', 'Unauthorized access')
          : response.forbidden('FORBIDDEN', 'Forbidden access')
        );
      }
      return sendBffResponse(response.ok({ message: 'Admin data', context }));
    }

    
    if (req.url?.startsWith('/catalog/pdp/') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const productId = url.pathname.replace('/catalog/pdp/', '');
      const storefrontId = url.searchParams.get('storefrontId') || undefined;
      return sendBffResponse(handlePdpRead(productId, storefrontId));
    }

    if (req.url?.startsWith('/catalog/product-cards') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(handleCatalogProductCards(query));
    }

    if (req.url?.startsWith('/catalog/product/') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const productId = url.pathname.replace('/catalog/product/', '');
      return sendBffResponse(handleCatalogProductRead(productId));
    }

    if (req.url === '/cart' && req.method === 'GET') {
      return sendBffResponse(await handleGetCart(context));
    }

    if (req.url === '/cart/items' && req.method === 'POST') {
      return sendBffResponse(await handleAddToCart(context, body));
    }

    if (req.url === '/cart/items' && req.method === 'PATCH') {
      return sendBffResponse(await handleUpdateCartLine(context, body));
    }

    if (req.url === '/cart/items' && req.method === 'DELETE') {
      return sendBffResponse(await handleRemoveCartLine(context, body));
    }

    if (req.url === '/action/initiate' && req.method === 'POST') {
      const result: any = handleProtectedAction(context, body);
      return sendBffResponse(result);
    }

    if (req.url === '/checkout/start' && req.method === 'POST') {
      return sendBffResponse(await handleStartCheckout(context, body));
    }

    if (req.url === '/payment/initiate' && req.method === 'POST') {
      console.log('[BFF] Routing to handleInitiatePayment');
      return sendBffResponse(await handleInitiatePayment(context, body));
    }

    if (req.url === '/payment/simulate-success' && req.method === 'POST') {
      return sendBffResponse(await handleSimulatePaymentSuccess(context, body));
    }

    if (req.url === '/order/create-from-payment' && req.method === 'POST') {
      return sendBffResponse(await handleCreateOrder(context, body));
    }

    if (req.url?.startsWith('/order/') && req.method === 'GET') {
      const orderId = req.url.replace('/order/', '');
      return sendBffResponse(await handleGetOrderDetail(context, orderId));
    }

    if (req.url === '/shipment/create-from-order' && req.method === 'POST') {
      return sendBffResponse(await handleCreateShipmentFromOrder(context, body));
    }

    if (req.url?.startsWith('/shipment/') && req.method === 'GET') {
      const shipmentId = req.url.replace('/shipment/', '');
      return sendBffResponse(await handleGetShipmentDetail(context, shipmentId));
    }

    if (req.url === '/shipment/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionShipmentState(context, body));
    }

    if (req.url === '/cancel-return/cancel' && req.method === 'POST') {
      return sendBffResponse(await handleCreateCancelRequest(context, body));
    }

    if (req.url === '/cancel-return/return' && req.method === 'POST') {
      return sendBffResponse(await handleCreateReturnRequest(context, body));
    }

    if (req.url?.startsWith('/cancel-return/') && req.method === 'GET') {
      const requestId = req.url.replace('/cancel-return/', '');
      return sendBffResponse(await handleGetCancelReturnRequest(context, requestId));
    }

    if (req.url === '/cancel-return/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionCancelReturnRequest(context, body));
    }

    if (req.url === '/refund/create-from-cancel-return' && req.method === 'POST') {
      return sendBffResponse(await handleCreateRefundFromCancelReturn(context, body));
    }

    if (req.url?.startsWith('/refund/') && req.method === 'GET') {
      const refundId = req.url.replace('/refund/', '');
      return sendBffResponse(await handleGetRefundDetail(context, refundId));
    }

    if (req.url === '/refund/process' && req.method === 'POST') {
      return sendBffResponse(await handleProcessRefund(context, body));
    }

    if (req.url === '/refund/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionRefund(context, body));
    }

    if (req.url === '/notification/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateNotification(context, body));
    }

    if (req.url?.startsWith('/notification/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListNotifications(context, query));
    }

    if (req.url?.startsWith('/notification/') && req.method === 'GET') {
      const notificationId = req.url.replace('/notification/', '');
      if (!notificationId.includes('/')) {
        return sendBffResponse(await handleGetNotification(context, notificationId));
      }
    }

    if (req.url === '/notification/read' && req.method === 'POST') {
      return sendBffResponse(await handleMarkNotificationRead(context, body));
    }

    if (req.url === '/notification/archive' && req.method === 'POST') {
      return sendBffResponse(await handleArchiveNotification(context, body));
    }

    if (req.url === '/support/ticket/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateSupportTicket(context, body));
    }

    if (req.url?.startsWith('/support/ticket/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListSupportTickets(context, query));
    }

    if (req.url?.startsWith('/support/ticket/') && req.method === 'GET') {
      const ticketId = req.url.replace('/support/ticket/', '');
      if (!ticketId.includes('/')) {
        return sendBffResponse(await handleGetSupportTicket(context, ticketId));
      }
    }

    if (req.url === '/support/ticket/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionSupportTicket(context, body));
    }

    if (req.url === '/support/ticket/message' && req.method === 'POST') {
      return sendBffResponse(await handleAddSupportTicketMessage(context, body));
    }

    if (pathname === '/post/create' && req.method === 'POST') {
      console.log(`[BFF] Routing /post/create with body: ${JSON.stringify(body)}`);
      return sendBffResponse(await handleCreateStorePost(context, body));
    }

    if (pathname === '/post/list' && req.method === 'GET') {
      const query = Object.fromEntries(url.searchParams);
      console.log(`[BFF] Routing /post/list with query: ${JSON.stringify(query)}`);
      const bffRes = await handleListStorePosts(context, query);
      console.log(`[BFF] handleListStorePosts returned count: ${bffRes.body?.data?.items?.length || 0}`);
      return sendBffResponse(bffRes);
    }

    if (req.url?.startsWith('/post/') && req.method === 'GET') {
      const postId = req.url.replace('/post/', '');
      if (!postId.includes('/')) {
        return sendBffResponse(await handleGetStorePost(context, postId));
      }
    }

    if (req.url === '/post/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionStorePost(context, body));
    }

    if (req.url === '/ugc/user-product-story/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateUserProductStory(context, body));
    }

    if (req.url?.startsWith('/ugc/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListUgc(context, query));
    }

    if (req.url?.startsWith('/ugc/') && req.method === 'GET') {
      const ugcId = req.url.replace('/ugc/', '');
      if (!ugcId.includes('/')) {
        return sendBffResponse(await handleGetUgc(context, ugcId));
      }
    }

    if (req.url === '/ugc/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionUgc(context, body));
    }

    if (req.url === '/review/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateReview(context, body));
    }

    if (req.url === '/review/update' && req.method === 'POST') {
      return sendBffResponse(await handleUpdateReview(context, body));
    }

    if (req.url?.startsWith('/review/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListReviews(context, query));
    }

    if (req.url?.startsWith('/review/') && req.method === 'GET') {
      const reviewId = req.url.replace('/review/', '');
      if (!reviewId.includes('/')) {
        return sendBffResponse(await handleGetReview(context, reviewId));
      }
    }

    if (req.url === '/review/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionReview(context, body));
    }

    if (req.url === '/review/return-impact' && req.method === 'POST') {
      return sendBffResponse(await handleApplyReviewReturnImpact(context, body));
    }

    if (req.url?.startsWith('/rating/product/') && req.method === 'GET') {
      const productId = req.url.replace('/rating/product/', '');
      return sendBffResponse(await handleGetProductRatingSummary(context, productId));
    }

    if (req.url === '/qa/question/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateQaQuestion(context, body));
    }

    if (req.url?.startsWith('/qa/question/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListQaQuestions(context, query));
    }

    if (req.url?.startsWith('/qa/question/') && req.method === 'GET') {
      const questionId = req.url.replace('/qa/question/', '');
      if (!questionId.includes('/')) {
        return sendBffResponse(await handleGetQaQuestion(context, questionId));
      }
    }

    if (req.url === '/qa/question/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionQaQuestion(context, body));
    }

    if (req.url === '/qa/answer/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateQaAnswer(context, body));
    }

    if (req.url === '/qa/answer/transition' && req.method === 'POST') {
      return sendBffResponse(await handleTransitionQaAnswer(context, body));
    }

    if (req.url === '/interaction/toggle' && req.method === 'POST') {
      return sendBffResponse(await handleToggleInteraction(context, body));
    }

    if (req.url === '/interaction/remove' && req.method === 'POST') {
      return sendBffResponse(await handleRemoveInteraction(context, body));
    }

    if (req.url === '/interaction/share' && req.method === 'POST') {
      return sendBffResponse(await handleRecordShareInteraction(context, body));
    }

    if (req.url?.startsWith('/interaction/state') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetInteractionState(context, query as any));
    }

    if (req.url?.startsWith('/interaction/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListActorInteractions(context, query as any));
    }

    if (req.url === '/follow/creator' && req.method === 'POST') {
      return sendBffResponse(await handleFollowCreator(context, body));
    }

    if (req.url === '/follow/creator/remove' && req.method === 'POST') {
      return sendBffResponse(await handleUnfollowCreator(context, body));
    }

    if (req.url?.startsWith('/follow/state') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetFollowState(context, query as any));
    }

    if (req.url?.startsWith('/follow/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListFollowing(context, query as any));
    }

    if (req.url?.startsWith('/feed/following') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetFollowFeed(context, query as any));
    }

    if (req.url?.startsWith('/search') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleSearch(context, query as any));
    }

    if (req.url?.startsWith('/category/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListCategories(context, query as any));
    }

    if (req.url?.startsWith('/category/detail') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetCategoryDetail(context, query as any));
    }

    if (req.url?.startsWith('/plp') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetPlp(context, query as any));
    }

    if (req.url?.startsWith('/storefront')) {
      const parts = req.url.split('?')[0].split('/').filter(p => p);
      // Construct params for storefrontRouter
      let params: any = {};
      if (parts[2] === 'profile' && parts[3]) params.storefrontId = parts[3];
      if (parts[1] === 'public' && parts[2]) params.slug = parts[2];
      if (parts[1] === 'admin' && parts[3]) params.storefrontId = parts[3];

      const mockReq = {
        method: req.method,
        url: req.url.split('?')[0],
        body,
        params,
        context
      };
      const mockRes = {
        status: (s: number) => ({
          json: (d: any) => sendJson(s, d)
        })
      };
      return storefrontRouter(mockReq, mockRes);
    }

    if (req.url?.startsWith('/story/tray') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListStoryTray(context, query as any));
    }

    if (req.url?.startsWith('/story/viewer') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetStoryViewer(context, query as any));
    }

    if (req.url === '/media/intake' && req.method === 'POST') {
      return sendBffResponse(await handleIntakeMediaUpload(context, body));
    }

    if (req.url === '/media/process' && req.method === 'POST') {
      return sendBffResponse(await handleProcessMediaAsset(context, body));
    }

    if (req.url?.startsWith('/media/asset') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetMediaAsset(context, query));
    }

    if (req.url?.startsWith('/media/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListMediaAssets(context, query));
    }

    if (req.url?.startsWith('/media/visibility') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetMediaVisibility(context, query));
    }

    if (req.url === '/moderation/list') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListModerationCases(context, query));
    }

    if (req.url === '/moderation/get') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetModerationCase(context, query));
    }

    if (req.url === '/moderation/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateModerationCase(context, body));
    }

    if (req.url === '/moderation/case/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateModerationCase(context, body));
    }

    if (req.url === '/moderation/review' && req.method === 'POST') {
      return sendBffResponse(await handleReviewModerationCase(context, body));
    }

    if (req.url === '/moderation/list') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListModerationCases(context, query));
    }

    if (req.url === '/moderation/get') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetModerationCase(context, query));
    }

    if (req.url === '/moderation/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateModerationCase(context, body));
    }

    if (req.url === '/moderation/case/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateModerationCase(context, body));
    }

    if (req.url === '/moderation/review' && req.method === 'POST') {
      return sendBffResponse(await handleReviewModerationCase(context, body));
    }

    if (pathname === '/risk/signal' && req.method === 'POST') {
      console.log('[BFF] Routing to handleCreateRiskSignal', { hasContext: !!context });
      const result = await handleCreateRiskSignal({ body, context });
      console.log('[BFF] handleCreateRiskSignal result status:', result.status);
      return sendBffResponse(result);
    }

    if (pathname === '/risk/signal/list' && req.method === 'GET') {
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListRiskSignals({ query, context }));
    }

    if (req.url === '/risk/case' && req.method === 'POST') {
      return sendBffResponse(await handleCreateRiskCase({ body, context }));
    }

    if (req.url === '/risk/case/review' && req.method === 'POST') {
      return sendBffResponse(await handleReviewRiskCase({ body, context }));
    }

    if (req.url?.startsWith('/risk/case?') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetRiskCase({ query, context }));
    }

    if (req.url?.startsWith('/risk/case/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListRiskCases({ query, context }));
    }

    if (req.url?.startsWith('/order-ops/overview') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetOrderOpsOverview(context, query));
    }

    if (req.url === '/settlement/create-from-order' && req.method === 'POST') {
      return sendBffResponse(await handleCreateSettlementFromOrder(context, body));
    }

    if (req.url === '/settlement/action' && req.method === 'POST') {
      return sendBffResponse(await handleApplySettlementAction(context, body));
    }

    if (req.url?.startsWith('/settlement/line?') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetSettlementLine(context, query));
    }

    if (req.url?.startsWith('/settlement/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListSettlementLines(context, query));
    }

    if (req.url === '/payout/items/create-from-settlement' && req.method === 'POST') {
      return sendBffResponse(await handleCreatePayoutItemsFromSettlement(context, body));
    }

    if (req.url === '/payout/batch/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreatePayoutBatch(context, body));
    }

    if (req.url === '/payout/item/action' && req.method === 'POST') {
      return sendBffResponse(await handleApplyPayoutItemAction(context, body));
    }

    if (req.url === '/payout/batch/action' && req.method === 'POST') {
      return sendBffResponse(await handleApplyPayoutBatchAction(context, body));
    }

    if (req.url?.startsWith('/payout/item?') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetPayoutItem(context, query));
    }

    if (req.url?.startsWith('/payout/batch?') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetPayoutBatch(context, query));
    }

    if (req.url?.startsWith('/payout/items/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListPayoutItems(context, query));
    }

    if (req.url?.startsWith('/payout/batches/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListPayoutBatches(context, query));
    }
    if (req.url?.startsWith('/payout/smoke-test-item') && req.method === 'POST') {
        return sendBffResponse(await handleCreateSmokeTestPayoutItem(context, body));
    }

    if (req.url === '/analytics/event/ingest' && req.method === 'POST') {
      return sendBffResponse(await handleIngestAnalyticsEvent(context, body));
    }

    if (req.url?.startsWith('/analytics/metric/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListMetricSnapshots(context, query));
    }

    if (req.url?.startsWith('/analytics/metric') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetMetricSnapshot(context, query));
    }

    if (req.url?.startsWith('/analytics/dashboard-seed') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetDashboardSeed(context, query));
    }

    // P49 Finance Correction routes
    if (req.url === '/finance-correction/create' && req.method === 'POST') {
      return sendBffResponse(await handleCreateFinanceCorrection(context, body));
    }

    if (req.url === '/finance-correction/create-from-refund' && req.method === 'POST') {
      return sendBffResponse(await handleCreateFinanceCorrectionFromRefund(context, body));
    }

    if (req.url === '/finance-correction/review' && req.method === 'POST') {
      return sendBffResponse(await handleReviewFinanceCorrection(context, body));
    }

    if (req.url?.startsWith('/finance-correction/item?') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleGetFinanceCorrection(context, query));
    }

    if (req.url?.startsWith('/finance-correction/list') && req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = Object.fromEntries(url.searchParams);
      return sendBffResponse(await handleListFinanceCorrections(context, query));
    }

    if (req.url?.startsWith('/pool/')) {
      const actorContext = pool.extractPoolActorContext(req);
      if (!actorContext) {
        return sendJson(400, {
          code: 'POOL_ACTOR_CONTEXT_REQUIRED',
          message: 'Actor context headers are missing or invalid.',
        });
      }

      const parts = req.url.split('/').filter(p => p);
      const [_, group, resource, id, action] = parts;

      try {
        let result;
        // Supplier Routes
        if (group === 'supplier') {
          if (actorContext.actorType !== 'SUPPLIER') return sendJson(403, { code: 'FORBIDDEN', message: 'Only suppliers can access this route.' });

          if (resource === 'products') {
            if (req.method === 'POST' && !id) result = await pool.createSupplierProductDraft(actorContext, body);
            else if (req.method === 'PATCH' && id && !action) result = await pool.updateSupplierProduct(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'submit') result = await pool.submitSupplierProduct(actorContext, id);
            else if (req.method === 'POST' && id && action === 'submit-revision') result = await pool.submitSupplierProductRevision(actorContext, id, body);
            else if (req.method === 'GET' && id && !action) result = await pool.getSupplierProduct(actorContext, id);
            else if (req.method === 'GET' && !id) result = await pool.listSupplierProducts(actorContext);
          }
        }
        // Admin Routes
        else if (group === 'admin') {
           if (actorContext.actorType !== 'ADMIN' && actorContext.actorType !== 'OPERATOR') return sendJson(403, { code: 'FORBIDDEN', message: 'Only admins or operators can access this route.' });
          
          if (resource === 'products') {
            if (req.method === 'GET' && !id) result = await pool.listAdminProducts(actorContext);
            else if (req.method === 'GET' && id && !action) result = await pool.getAdminProduct(actorContext, id);
            else if (req.method === 'POST' && id && action === 'start-review') result = await pool.startProductReview(actorContext, id);
            else if (req.method === 'POST' && id && action === 'request-revision') result = await pool.requestProductRevision(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'approve') result = await pool.approveSupplierProduct(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'reject') result = await pool.rejectSupplierProduct(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'suspend') result = await pool.suspendSubmittedProduct(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'commercialize') result = await pool.commercializeProduct(actorContext, id);
          } else if (resource === 'commercial-products') {
            if (req.method === 'GET' && !id) result = await pool.listAdminCommercialProducts(actorContext);
            else if (req.method === 'GET' && id && !action) result = await pool.getAdminCommercialProduct(actorContext, id);
            else if (req.method === 'POST' && id && action === 'bind') result = await pool.bindCommercialProduct(actorContext, id);
            else if (req.method === 'GET' && id && action === 'binding') result = await pool.getCommercialProductBinding(actorContext, id);
            else if (req.method === 'POST' && id && action === 'activate') result = await pool.activateCommercialProduct(actorContext, id);
            else if (req.method === 'POST' && id && action === 'suspend') result = await pool.suspendCommercialProduct(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'archive') result = await pool.archiveCommercialProduct(actorContext, id);
          }
        }
        
        if (result) {
          if (result.success) {
            return sendJson(200, result.data);
          } else {
            return sendJson(400, result.error);
          }
        }

      } catch (e: any) {
        return sendJson(500, { code: 'INTERNAL_SERVER_ERROR', message: e.message });
      }
    }

    if (req.url?.startsWith('/store-story/')) {
      const actorContext = storeStory.extractStoreStoryActorContext(req);
      const parts = req.url.split('/').filter(p => p);
      const [_, group, resource, id, action] = parts;

      try {
        let result;

        if (group === 'creator') {
          if (!actorContext) {
            return sendJson(400, {
              code: 'STORE_STORY_ACTOR_CONTEXT_REQUIRED',
              message: 'Actor context headers are missing or invalid.',
            });
          }

          if (resource === 'stories') {
            if (req.method === 'POST' && !id) result = await storeStory.createStoreStory(actorContext, body);
            else if (req.method === 'GET' && !id) result = await storeStory.listCreatorStoreStories(actorContext);
            else if (req.method === 'GET' && id && !action) result = await storeStory.getCreatorStoreStory(actorContext, id);
            else if (req.method === 'POST' && id && action === 'publish') result = await storeStory.publishStoreStory(actorContext, id);
            else if (req.method === 'POST' && id && action === 'unpublish') result = await storeStory.unpublishStoreStory(actorContext, id, body);
            else if (req.method === 'POST' && id && action === 'archive') result = await storeStory.archiveStoreStory(actorContext, id);
            else if (req.method === 'POST' && resource === 'stories' && id === 'reorder') result = await storeStory.reorderStoreStories(actorContext, body);
          }
        } else if (group === 'public') {
          const storefrontId = resource;
          if (req.method === 'GET' && storefrontId) {
            result = await storeStory.listPublicStoreStories(storefrontId);
          }
        }

        if (result) {
          if (result.success) {
            return sendJson(200, result.data);
          } else {
            return sendJson(400, result.error);
          }
        }
      } catch (e: any) {
        return sendJson(500, { code: 'INTERNAL_SERVER_ERROR', message: e.message });
      }
    }




    if (req.url?.startsWith('/customer/contribution-eligibility')) {
      try {
        const mockReq = {
          method: req.method,
          url: req.url,
          body,
          headers: req.headers,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        return customerContributionRouter(mockReq as any, mockRes as any, () => {});
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer contribution router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/customer/address') || req.url?.startsWith('/customer/addresses') || req.url?.startsWith('/customer/checkout-eligibility')) {
      try {
        const urlParts = req.url.split('?')[0].split('/').filter(p => p);
        let params: any = {};
        if (urlParts[2]) {
            params.addressId = urlParts[2];
        }

        const mockReq = {
          method: req.method,
          url: req.url,
          body,
          headers: req.headers,
          params,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        return customerAddressRouter(mockReq as any, mockRes as any, () => {});
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer address router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/customer/reward-eligibility')) {
      try {
        const mockReq = {
          method: req.method,
          url: req.url,
          body,
          headers: req.headers,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        return customerRewardRouter(mockReq as any, mockRes as any, () => {});
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer reward router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/customer/support-eligibility')) {
      try {
        const mockReq = {
          method: req.method,
          url: req.url,
          body,
          headers: req.headers,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        return customerSupportRouter(mockReq as any, mockRes as any, () => {});
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer support router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/customer/social-eligibility')) {
      try {
        const mockReq = {
          method: req.method,
          url: req.url,
          body,
          headers: req.headers,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        return customerSocialRouter(mockReq as any, mockRes as any, () => {});
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer social router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/customer/')) {
      try {
        const mockReq = {
          method: req.method,
          url: req.url.replace('/customer', ''), // Strip prefix
          body,
          headers: req.headers,
          params: {} as any,
          context
        };
        const mockRes = {
          status: (s: number) => ({
            json: (d: any) => sendJson(s, d)
          }),
          json: (d: any) => sendJson(200, d)
        };
        // Simple routing
        const urlParts = req.url.split('?')[0].split('/');
        if (urlParts[3] && urlParts[2] === 'profile') {
            mockReq.params = { customerProfileId: urlParts[3] };
        }
        
        console.log(`[BFF] Customer Router URL: ${mockReq.url}, Method: ${req.method}`);
        
        return customerRouter(mockReq as any, mockRes as any, () => {
            sendJson(404, { error: 'Not found in customerRouter' });
        });
      } catch (e: any) {
        console.error('[BFF] Unhandled exception in customer router:', e);
        return sendJson(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e.message } });
      }
    }

    if (req.url?.startsWith('/store-post/')) {
      console.log(`[BFF] Legacy /store-post/ path detected: ${req.url}`);
    }

    if (req.url?.startsWith('/store-message/')) {
      const parts = req.url.split('?')[0].split('/').filter(p => p);
      let params: any = {};
      if (parts[2] === 'threads' && parts[3]) {
        params.threadId = parts[3];
      }

      const mockReq = {
        method: req.method,
        url: req.url,
        body,
        headers: req.headers,
        params,
        context,
        header: (name: string) => req.headers[name.toLowerCase()] as string,
        json: async () => body,
        param: (name: string) => params[name]
      };
      const mockRes = {
        status: (s: number) => ({
          json: (d: any) => sendJson(s, d)
        }),
        json: (d: any) => sendJson(200, d)
      };
      return storeMessageRouter.fetch(mockReq as any, mockRes as any);
    }

    return sendBffResponse(response.notFound('NOT_FOUND', 'Endpoint not found'));
  });

  return {
    start: () => { server.listen(config.PORT, () => { console.log(`[BFF] Server listening on port ${config.PORT}`); }); },
    stop: () => { console.log(`[BFF] Shutting down...`); server.close(); }
  };
}
