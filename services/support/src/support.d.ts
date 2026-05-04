import { SupportTicketRecord, CreateSupportTicketCommand, SupportTicketListQuery, SupportTicketListResponse, SupportTicketTransitionCommand, AddSupportTicketMessageCommand, SupportTicketMutationResult } from '@hx/contracts';
export declare function createSupportTicket(command: CreateSupportTicketCommand): Promise<SupportTicketMutationResult>;
export declare function listSupportTickets(query: SupportTicketListQuery): Promise<SupportTicketListResponse>;
export declare function getSupportTicketById(ticketId: string): Promise<SupportTicketRecord | undefined>;
export declare function transitionSupportTicket(command: SupportTicketTransitionCommand): Promise<SupportTicketMutationResult>;
export declare function addSupportTicketMessage(command: AddSupportTicketMessageCommand): Promise<SupportTicketMutationResult>;
//# sourceMappingURL=support.d.ts.map