import * as crypto from 'crypto';

export function issueDevAuthToken(actorId: string, role: string): string {
  const secret = process.env.AUTH_TOKEN_SECRET || 'hx-dev-local-secret-for-auth-token-12345';
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 86400;
  const claims = {
    sub: actorId,
    role: role,
    sid: crypto.randomUUID(),
    iat,
    exp,
  };

  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  return `${payload}.${signature}`;
}

export function getGuestHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json'
  };
}

export function getCustomerHeaders(actorId: string = `cust-${Date.now()}`): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'CUSTOMER')}`
  };
}

export function getCreatorHeaders(actorId: string = `creator-${Date.now()}`): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'CREATOR')}`
  };
}

export function getAdminHeaders(actorId: string = `admin-${Date.now()}`): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'ADMIN')}`
  };
}

export function issueDevInternalServiceToken(input: {
  serviceName: string;
  callerId: string;
  allowedAudience: string[];
}): string {
  const secret = process.env.INTERNAL_SERVICE_TOKEN_SECRET || 'hx-dev-local-secret-for-internal-service-token-12345';
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 300;
  const claims = {
    serviceName: input.serviceName,
    callerId: input.callerId,
    issuedAt,
    expiresAt,
    allowedAudience: input.allowedAudience,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('base64url');
  return `${payload}.${signature}`;
}

export function getInternalServiceHeaders(
  actorId: string = `internal-${Date.now()}`,
  allowedAudience: string[] = ['*'],
  serviceName = '@hx/smoke-internal-service',
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${issueDevAuthToken(actorId, 'INTERNAL_SERVICE')}`,
    'x-internal-service-token': issueDevInternalServiceToken({
      serviceName,
      callerId: actorId,
      allowedAudience,
    }),
  };
}
