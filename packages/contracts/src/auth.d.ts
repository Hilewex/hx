export type ActorRole = 'GUEST' | 'CUSTOMER' | 'ADMIN' | 'OPERATOR' | 'SUPPLIER';
export interface BaseActor {
    role: ActorRole;
    isAuthenticated: boolean;
}
export interface GuestActor extends BaseActor {
    role: 'GUEST';
    isAuthenticated: false;
    sessionId?: string;
}
export interface AuthenticatedActor extends BaseActor {
    role: Exclude<ActorRole, 'GUEST'>;
    isAuthenticated: true;
    actorId: string;
    sessionId: string;
}
export type ActorContext = GuestActor | AuthenticatedActor;
export type SessionState = 'ACTIVE' | 'EXPIRED' | 'INVALID' | 'ABSENT';
//# sourceMappingURL=auth.d.ts.map