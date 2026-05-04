"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupportTicket = createSupportTicket;
exports.listSupportTickets = listSupportTickets;
exports.getSupportTicketById = getSupportTicketById;
exports.transitionSupportTicket = transitionSupportTicket;
exports.addSupportTicketMessage = addSupportTicketMessage;
// Singleton store and idempotency index
const supportTicketStore = globalThis.supportTicketStore || new Map();
globalThis.supportTicketStore = supportTicketStore;
const supportIdempotencyIndex = globalThis.supportIdempotencyIndex || new Map();
globalThis.supportIdempotencyIndex = supportIdempotencyIndex;
// Dynamic priority and escalation logic
function determinePriority(subtopic) {
    const urgentSubtopics = ['PAYMENT_SUCCESS_ORDER_MISSING', 'DOUBLE_CHARGE', 'SECURITY_CONCERN'];
    const highSubtopics = ['DELIVERED_NOT_RECEIVED', 'RETURN_STATUS', 'SHIPMENT_DELAYED'];
    if (urgentSubtopics.includes(subtopic))
        return 'URGENT';
    if (highSubtopics.includes(subtopic))
        return 'HIGH';
    return 'NORMAL';
}
function determineEscalationTarget(category, subtopic) {
    if (['PAYMENT', 'REFUND'].includes(category))
        return 'FINANCE';
    if (['SHIPMENT', 'ORDER', 'CANCEL_RETURN'].includes(category))
        return 'OPERATIONS';
    if (category === 'TECHNICAL')
        return 'TECHNICAL';
    if (['STORE_COMPLAINT', 'SAFETY_COMPLAINT'].includes(category) || subtopic === 'INAPPROPRIATE_CONTENT') {
        return 'MODERATION'; // or SAFETY
    }
    return 'SUPPORT';
}
function generateSelfServiceSuggestions(category, subtopic) {
    const suggestions = [];
    if (['SHIPMENT_DELAYED', 'DELIVERED_NOT_RECEIVED'].includes(subtopic)) {
        suggestions.push({
            suggestionType: 'ROUTE',
            title: 'Kargo Takip',
            body: 'Kargonuzun nerede olduğunu anlık olarak takip edebilirsiniz.',
            targetRoute: '/account/orders/shipment-tracking'
        });
    }
    if (['RETURN_STATUS', 'CANCEL_REQUEST'].includes(subtopic)) {
        suggestions.push({
            suggestionType: 'ROUTE',
            title: 'İptal ve İade İşlemleri',
            body: 'İptal veya iade taleplerinizin durumunu buradan kontrol edebilirsiniz.',
            targetRoute: '/account/returns'
        });
    }
    if (['PAYMENT_FAILED', 'PAYMENT_SUCCESS_ORDER_MISSING', 'DOUBLE_CHARGE'].includes(subtopic)) {
        suggestions.push({
            suggestionType: 'INFO',
            title: 'Ödeme Sorunları Hakkında',
            body: 'Ödemenizle ilgili bir sorun yaşıyorsanız bankanızla iletişime geçmeden önce bu bilgileri kontrol edin.'
        });
    }
    if (['STORE_BEHAVIOR_COMPLAINT', 'INAPPROPRIATE_CONTENT'].includes(subtopic)) {
        suggestions.push({
            suggestionType: 'INFO',
            title: 'Güvenlik ve Şikayet',
            body: 'Şikayetiniz moderasyon ekibimize iletilmiştir.',
            escalationTarget: 'MODERATION'
        });
    }
    return suggestions;
}
async function createSupportTicket(command) {
    const { actorType, actorId, category, subtopic, title, description, channel, context, idempotencyKey } = command;
    if (!actorType || !actorId) {
        return { success: false, errors: ['INVALID_SUPPORT_ACTOR'] };
    }
    if (!category || !subtopic || !title || !description || !channel) {
        return { success: false, errors: ['INVALID_SUPPORT_TICKET_CONTENT'] };
    }
    if (idempotencyKey && supportIdempotencyIndex.has(idempotencyKey)) {
        const existingId = supportIdempotencyIndex.get(idempotencyKey);
        return { success: true, ticket: supportTicketStore.get(existingId) };
    }
    const ticketId = `st_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();
    const initialMessage = {
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        authorType: actorType,
        authorId: actorId,
        body: description,
        createdAt: now,
        isInternalNote: false
    };
    const ticket = {
        ticketId,
        actorType,
        actorId,
        category,
        subtopic,
        status: 'OPEN',
        priority: determinePriority(subtopic),
        channel,
        context,
        title,
        description,
        messages: [initialMessage],
        selfServiceSuggestions: generateSelfServiceSuggestions(category, subtopic),
        escalationTarget: determineEscalationTarget(category, subtopic),
        createdAt: now,
        updatedAt: now,
        socialMessageBoundary: true,
        officialSupportProcess: true,
        idempotencyKey
    };
    supportTicketStore.set(ticketId, ticket);
    if (idempotencyKey) {
        supportIdempotencyIndex.set(idempotencyKey, ticketId);
    }
    // Notification integration (Optional as per P20 decision)
    let warnings = [];
    try {
        // In a real scenario, we'd import createNotification here. 
        // Since we are in the same workspace and P19 exists, we could use it if linked.
        // For P20, we acknowledge the hook.
    }
    catch (e) {
        warnings.push('SUPPORT_NOTIFICATION_FAILED');
    }
    return { success: true, ticket, warnings: warnings.length > 0 ? warnings : undefined };
}
async function listSupportTickets(query) {
    const { actorType, actorId, status, category, limit = 20, cursor } = query;
    let allItems = Array.from(supportTicketStore.values())
        .filter(t => t.actorType === actorType && t.actorId === actorId);
    if (status) {
        allItems = allItems.filter(t => t.status === status);
    }
    if (category) {
        allItems = allItems.filter(t => t.category === category);
    }
    const openStatuses = ['OPEN', 'TRIAGED', 'WAITING_FOR_CUSTOMER', 'ESCALATED'];
    const openCount = Array.from(supportTicketStore.values())
        .filter(t => t.actorType === actorType && t.actorId === actorId && openStatuses.includes(t.status))
        .length;
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const items = allItems
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(offset, offset + limit);
    const nextCursor = (offset + limit < allItems.length) ? (offset + limit).toString() : undefined;
    return {
        items,
        openCount,
        nextCursor
    };
}
async function getSupportTicketById(ticketId) {
    return supportTicketStore.get(ticketId);
}
const ALLOWED_TRANSITIONS = {
    'OPEN': ['TRIAGED', 'REJECTED'],
    'TRIAGED': ['WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED'],
    'WAITING_FOR_CUSTOMER': ['TRIAGED', 'RESOLVED'],
    'ESCALATED': ['TRIAGED', 'RESOLVED'],
    'RESOLVED': ['CLOSED'],
    'REJECTED': ['CLOSED'],
    'CLOSED': []
};
async function transitionSupportTicket(command) {
    const { ticketId, targetStatus, actorType, actorId, reasonCode, note } = command;
    const ticket = supportTicketStore.get(ticketId);
    if (!ticket) {
        return { success: false, errors: ['SUPPORT_TICKET_NOT_FOUND'] };
    }
    const allowed = ALLOWED_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(targetStatus)) {
        return { success: false, errors: ['INVALID_TRANSITION'], ticket };
    }
    ticket.status = targetStatus;
    ticket.updatedAt = new Date().toISOString();
    if (targetStatus === 'CLOSED') {
        ticket.closedAt = ticket.updatedAt;
    }
    if (note) {
        const internalMessage = {
            messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
            authorType: actorType || 'SYSTEM',
            authorId: actorId || 'SYSTEM',
            body: `[Transition Note: ${reasonCode || 'N/A'}] ${note}`,
            createdAt: ticket.updatedAt,
            isInternalNote: true
        };
        ticket.messages.push(internalMessage);
    }
    return { success: true, ticket };
}
async function addSupportTicketMessage(command) {
    const { ticketId, authorType, authorId, body, isInternalNote } = command;
    const ticket = supportTicketStore.get(ticketId);
    if (!ticket) {
        return { success: false, errors: ['SUPPORT_TICKET_NOT_FOUND'] };
    }
    if (ticket.status === 'CLOSED' && authorType === 'CUSTOMER') {
        return { success: false, errors: ['SUPPORT_TICKET_CLOSED'], ticket };
    }
    if (isInternalNote && authorType === 'CUSTOMER') {
        return { success: false, errors: ['INTERNAL_NOTE_NOT_ALLOWED'], ticket };
    }
    const message = {
        messageId: `msg_${Math.random().toString(36).substring(2, 11)}`,
        authorType,
        authorId,
        body,
        createdAt: new Date().toISOString(),
        isInternalNote: !!isInternalNote
    };
    ticket.messages.push(message);
    ticket.updatedAt = message.createdAt;
    return { success: true, ticket };
}
