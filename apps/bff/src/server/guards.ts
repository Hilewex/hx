import { ActorContext } from '@hx/contracts';
import { unauthorized, forbidden, BffResponse } from './response';
import { Request, Response, NextFunction } from 'express';

export type GuardResult = { allowed: true } | { allowed: false; response: BffResponse };

export function requireAuthenticated(context: ActorContext): GuardResult {
  if (!context.isAuthenticated) {
    return {
      allowed: false,
      response: unauthorized('UNAUTHORIZED', 'Authentication is required to perform this action'),
    };
  }
  return { allowed: true };
}

export function requireActorType(context: ActorContext, allowedTypes: Array<ActorContext['role']>): GuardResult {
  const authCheck = requireAuthenticated(context);
  if (!authCheck.allowed) return authCheck;

  if (!allowedTypes.includes(context.role)) {
    return {
      allowed: false,
      response: forbidden('FORBIDDEN', `Actor type ${context.role} is not allowed to perform this action`),
    };
  }
  return { allowed: true };
}

export function requireRole(context: ActorContext, allowedRoles: Array<ActorContext['role']>): GuardResult {
  return requireActorType(context, allowedRoles);
}

export function requireSelfOrAdmin(context: ActorContext, targetActorId: string): GuardResult {
  const authCheck = requireAuthenticated(context);
  if (!authCheck.allowed) return authCheck;

  if (context.role === 'ADMIN') {
    return { allowed: true };
  }

  if ('actorId' in context && context.actorId !== targetActorId) {
    return {
      allowed: false,
      response: forbidden('FORBIDDEN_OWNERSHIP', 'You can only modify your own resources'),
    };
  }

  return { allowed: true };
}

export function requireCreator(context: ActorContext): GuardResult {
  return requireActorType(context, ['CREATOR']);
}

export function requireCustomer(context: ActorContext): GuardResult {
  return requireActorType(context, ['CUSTOMER']);
}

export function requireAdmin(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN']);
}

export function requireOperator(context: ActorContext): GuardResult {
  return requireActorType(context, ['OPERATOR']);
}

export function requireAdminOrOperator(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN', 'OPERATOR']);
}

export function requireSocialCustomerActor(context: ActorContext): GuardResult {
  return requireCustomer(context);
}

export function requireOfficialAnswerActor(context: ActorContext): GuardResult {
  return requireAdminOrOperator(context);
}

export function requireFinanceRole(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN', 'FINANCE']);
}

export function requireRefundOperationalRole(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN', 'FINANCE', 'OPERATOR']);
}

export function requireRiskOperator(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN', 'RISK_OPERATOR']);
}

export function requireModerationOperator(context: ActorContext): GuardResult {
  return requireActorType(context, ['ADMIN', 'MODERATOR']);
}

export function requireInternalService(context: ActorContext): GuardResult {
  const roleCheck = requireActorType(context, ['INTERNAL_SERVICE']);
  if (!roleCheck.allowed) return roleCheck;
  if (!context.isAuthenticated || !context.actorId || !context.internalService) {
    return {
      allowed: false,
      response: forbidden(
        'INTERNAL_SERVICE_SIGNED_TOKEN_REQUIRED',
        'Signed internal service token with explicit caller identity is required',
      ),
    };
  }

  if (context.internalService.callerId !== context.actorId) {
    return {
      allowed: false,
      response: forbidden(
        'INTERNAL_SERVICE_CALLER_ID_MISMATCH',
        'Internal service caller identity must match the authenticated internal actor',
      ),
    };
  }

  const allowedCallers = (process.env.INTERNAL_SERVICE_ACTOR_ALLOWLIST || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowedCallers.length === 0) {
    console.warn('[BFF] INTERNAL_SERVICE_ACTOR_ALLOWLIST is empty; signed internal token is required but caller allowlist is not enforced.');
  }
  if (allowedCallers.length > 0 && !allowedCallers.includes(context.actorId)) {
    return {
      allowed: false,
      response: forbidden(
        'INTERNAL_SERVICE_CALLER_NOT_ALLOWLISTED',
        'Internal service caller is not allowlisted for owner-domain legacy routes',
      ),
    };
  }

  return { allowed: true };
}

export function denyUnauthorized(reason: string): GuardResult {
  return { allowed: false, response: unauthorized('UNAUTHORIZED', reason) };
}

export function denyForbidden(reason: string): GuardResult {
  return { allowed: false, response: forbidden('FORBIDDEN', reason) };
}

export function requireGuestOrCustomer(context: ActorContext): GuardResult {
  if (context.isAuthenticated) {
    if (context.role !== 'CUSTOMER') {
      return {
        allowed: false,
        response: forbidden('FORBIDDEN', `Actor type ${context.role} is not allowed to perform commerce actions`),
      };
    }
  }
  return { allowed: true };
}

export function extractCommerceContext(context: ActorContext): { actorType: 'CUSTOMER' | 'GUEST', actorId: string } {
  if (context.isAuthenticated) {
    if (context.role === 'CUSTOMER' && context.actorId) {
      return { actorType: 'CUSTOMER', actorId: context.actorId };
    }
    throw new Error(`Actor type ${context.role} cannot be extracted as commerce context or actorId missing`);
  } else {
    if (!context.sessionId) {
      throw new Error('Unauthenticated context missing sessionId');
    }
    return { actorType: 'GUEST', actorId: context.sessionId };
  }
}

export function requireResourceOwnership(context: ActorContext, resourceOwnerId: string): GuardResult {
  try {
    const commerceContext = extractCommerceContext(context);
    if (commerceContext.actorId !== resourceOwnerId) {
      return {
        allowed: false,
        response: forbidden('FORBIDDEN_OWNERSHIP', 'You can only access your own commerce resources'),
      };
    }
    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      response: forbidden('FORBIDDEN', (error as Error).message),
    };
  }
}

export function withGuard(guardFn: (context: ActorContext, req?: Request) => GuardResult) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.context) {
       const response = unauthorized('UNAUTHORIZED', 'Actor context is missing');
       return res.status(response.status).json(response.body);
    }
    const result = guardFn(req.context, req);
    if (!result.allowed) {
      return res.status(result.response.status).json(result.response.body);
    }
    next();
  };
}
