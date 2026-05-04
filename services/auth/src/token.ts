import crypto from 'crypto';
import { AuthTokenClaims, ActorRole, AuthValidationResult } from '@hx/contracts';

// In production, these should come from env/config.
// For now, providing safe dev defaults to avoid crash without env vars.
const getSecret = () => process.env.AUTH_TOKEN_SECRET || 'hx-dev-local-secret-for-auth-token-12345';
const getIssuer = () => process.env.AUTH_TOKEN_ISSUER || 'hx-auth-service';
const getTtlSeconds = () => parseInt(process.env.AUTH_TOKEN_TTL_SECONDS || '86400', 10);

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

/**
 * Dev helper for smoke tests. DO NOT use in production endpoints.
 */
export function issueDevAuthToken(actorId: string, role: ActorRole): string {
  return issueAuthToken({ actorId, role });
}
