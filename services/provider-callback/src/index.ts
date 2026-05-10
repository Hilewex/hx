import { ProviderCallbackRecord, ProviderDomain } from '@hx/contracts';
import { getProviderCallbackEventRepository } from '@hx/persistence';

export interface ProviderCallbackIdentity {
  providerEventId?: string;
  idempotencyKey?: string;
}

export interface ExistingProviderCallbackIdentityResult {
  existingByProviderEventId: ProviderCallbackRecord | null;
  existingByIdempotencyKey: ProviderCallbackRecord | null;
}

export async function findExistingProviderCallbackByIdentity(input: {
  providerDomain: ProviderDomain;
  providerName: string;
  identity: ProviderCallbackIdentity;
}): Promise<ExistingProviderCallbackIdentityResult> {
  const repository = getProviderCallbackEventRepository();
  const existingByProviderEventId = input.identity.providerEventId
    ? await repository.findProviderCallbackEventByProviderEventId(
        input.providerDomain,
        input.providerName,
        input.identity.providerEventId
      )
    : null;
  const existingByIdempotencyKey = input.identity.idempotencyKey
    ? await repository.findProviderCallbackEventByIdempotencyKey(
        input.providerDomain,
        input.providerName,
        input.identity.idempotencyKey
      )
    : null;

  return {
    existingByProviderEventId,
    existingByIdempotencyKey,
  };
}

export async function recordProviderCallbackEvent(
  record: Omit<ProviderCallbackRecord, 'id'>
): Promise<ProviderCallbackRecord> {
  return getProviderCallbackEventRepository().insertProviderCallbackEvent(record);
}
