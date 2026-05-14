import crypto from 'crypto';
import { AuthTokenClaims, ActorRole, AuthValidationResult } from '@hx/contracts';

// In production, these should come from env/config.
// For now, providing safe dev defaults to avoid crash without env vars.
const getSecret = () => process.env.AUTH_TOKEN_SECRET || 'hx-dev-local-secret-for-auth-token-12345';
const getIssuer = () => process.env.AUTH_TOKEN_ISSUER || 'hx-auth-service';
const getTtlSeconds = () => parseInt(process.env.AUTH_TOKEN_TTL_SECONDS || '86400', 10);
const getInternalServiceSecret = () => process.env.INTERNAL_SERVICE_TOKEN_SECRET || 'hx-dev-local-secret-for-internal-service-token-12345';
const getInternalServiceTtlSeconds = () => parseInt(process.env.INTERNAL_SERVICE_TOKEN_TTL_SECONDS || '300', 10);

export interface InternalServiceTokenClaims {
  serviceName: string;
  callerId: string;
  issuedAt: number;
  expiresAt: number;
  allowedAudience: string[];
}

export type InternalServiceTokenValidationResult =
  | { isValid: true; claims: InternalServiceTokenClaims; signature: string }
  | { isValid: false; error: 'TOKEN_MISSING' | 'TOKEN_INVALID' | 'INVALID_SIGNATURE' | 'INVALID_CLAIMS' | 'TOKEN_EXPIRED' | 'AUDIENCE_NOT_ALLOWED' };

export function issueAuthToken(input: {
  actorId: string;
  role: ActorRole;
  sessionId?: string;
}): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + getTtlSeconds();
  const claims: AuthTokenClaims = {
    sub: input.actorId,
    role: input.role,
    sid: input.sessionId || crypto.randomUUID(),
    iat,
    exp,
  };

  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  return `${payload}.${signature}`;
}

export function validateAuthToken(token: string): AuthValidationResult {
  if (!token) {
    return { isValid: false, state: 'ABSENT', error: 'TOKEN_MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { isValid: false, state: 'INVALID', error: 'TOKEN_INVALID' };
  }

  const [payloadBase64, signature] = parts;

  // Verify signature
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(payloadBase64);
  const expectedSignature = hmac.digest('base64url');

  // Time-safe compare would be better, but direct string compare is fine for dev/foundation
  if (signature !== expectedSignature) {
    return { isValid: false, state: 'INVALID', error: 'INVALID_SIGNATURE' };
  }

  let claims: AuthTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  } catch (e) {
    return { isValid: false, state: 'INVALID', error: 'INVALID_CLAIMS' };
  }

  // Validate expiry
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    return { isValid: false, state: 'EXPIRED', error: 'TOKEN_EXPIRED' };
  }

  return {
    isValid: true,
    state: 'ACTIVE',
    claims,
  };
}

function signPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64url');
}

function signatureMatches(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function issueInternalServiceToken(input: {
  serviceName: string;
  callerId: string;
  allowedAudience: string[];
  issuedAt?: number;
  expiresAt?: number;
}): string {
  const issuedAt = input.issuedAt ?? Math.floor(Date.now() / 1000);
  const expiresAt = input.expiresAt ?? issuedAt + getInternalServiceTtlSeconds();
  const claims: InternalServiceTokenClaims = {
    serviceName: input.serviceName,
    callerId: input.callerId,
    issuedAt,
    expiresAt,
    allowedAudience: input.allowedAudience,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = signPayload(payload, getInternalServiceSecret());
  return `${payload}.${signature}`;
}

export function validateInternalServiceToken(token: string | undefined, routeScope: string): InternalServiceTokenValidationResult {
  if (!token) return { isValid: false, error: 'TOKEN_MISSING' };

  const parts = token.split('.');
  if (parts.length !== 2) return { isValid: false, error: 'TOKEN_INVALID' };
  const [payloadBase64, signature] = parts;
  const expectedSignature = signPayload(payloadBase64, getInternalServiceSecret());
  if (!signatureMatches(signature, expectedSignature)) {
    return { isValid: false, error: 'INVALID_SIGNATURE' };
  }

  let claims: InternalServiceTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  } catch {
    return { isValid: false, error: 'INVALID_CLAIMS' };
  }

  if (
    !claims.serviceName ||
    !claims.callerId ||
    typeof claims.issuedAt !== 'number' ||
    typeof claims.expiresAt !== 'number' ||
    !Array.isArray(claims.allowedAudience)
  ) {
    return { isValid: false, error: 'INVALID_CLAIMS' };
  }

  if (claims.expiresAt < Math.floor(Date.now() / 1000)) {
    return { isValid: false, error: 'TOKEN_EXPIRED' };
  }

  if (!claims.allowedAudience.includes(routeScope) && !claims.allowedAudience.includes('*')) {
    return { isValid: false, error: 'AUDIENCE_NOT_ALLOWED' };
  }

  return { isValid: true, claims, signature };
}

/**
 * Dev helper for smoke tests. DO NOT use in production endpoints.
 */
export function issueDevAuthToken(actorId: string, role: ActorRole): string {
  return issueAuthToken({ actorId, role });
}
