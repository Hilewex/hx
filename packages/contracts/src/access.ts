export type Scope = string;
export type Permission = string;
export type DenyReason = 'UNAUTHORIZED' | 'FORBIDDEN_ROLE' | 'FORBIDDEN_SCOPE' | 'MISSING_PERMISSION';

export interface AuthorizationDecisionAllowed {
  isAllowed: true;
}

export interface AuthorizationDecisionDenied {
  isAllowed: false;
  reason: DenyReason;
  message: string;
}

export type AuthorizationDecision = AuthorizationDecisionAllowed | AuthorizationDecisionDenied;
