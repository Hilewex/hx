export type ActorRole = 'GUEST' | 'CUSTOMER' | 'CREATOR' | 'ADMIN' | 'OPERATOR' | 'SUPPLIER' | 'INTERNAL_SERVICE' | 'FINANCE' | 'MODERATOR' | 'RISK_OPERATOR';
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
export interface AuthTokenClaims {
    sub: string;
    role: ActorRole;
    sid: string;
    iat: number;
    exp: number;
}
export interface AuthSession {
    actor: ActorContext;
    state: SessionState;
    token?: string;
}
export type AuthErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MISSING' | 'INVALID_CLAIMS' | 'INVALID_SIGNATURE';
export interface AuthValidationResult {
    isValid: boolean;
    state: SessionState;
    claims?: AuthTokenClaims;
    error?: AuthErrorCode;
}
//# sourceMappingURL=auth.d.ts.map