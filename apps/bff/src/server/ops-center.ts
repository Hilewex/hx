import type {
  ActorContext,
  OperationalQueueDomain,
  OperationalQueuePriority,
  OperationalQueueWorkflowState,
} from '@hx/contracts';
import * as response from './response';
import { requireActorType } from './guards';
import {
  buildFinanceOpsProjection,
  buildOperationalQueueDetailProjection,
  buildOperationalQueueProjection,
  priorities,
  queueDomains,
  workflowStates,
} from '@hx/admin';

function requireOpsCenterPermission(context: ActorContext) {
  return requireActorType(context, ['ADMIN', 'OPERATOR', 'FINANCE', 'MODERATOR', 'RISK_OPERATOR']);
}

function normalizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeDomain(value: unknown): OperationalQueueDomain | 'all' {
  const domain = normalizeText(value);
  return domain && queueDomains.includes(domain as OperationalQueueDomain) ? domain as OperationalQueueDomain : 'all';
}

function normalizeWorkflowState(value: unknown): OperationalQueueWorkflowState | 'all' {
  const workflowState = normalizeText(value);
  return workflowState && workflowStates.includes(workflowState as OperationalQueueWorkflowState)
    ? workflowState as OperationalQueueWorkflowState
    : 'all';
}

function normalizePriority(value: unknown): OperationalQueuePriority | 'all' {
  const priority = normalizeText(value);
  return priority && priorities.includes(priority as OperationalQueuePriority) ? priority as OperationalQueuePriority : 'all';
}

function clampLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.trunc(parsed), 1), 250);
}

export async function handleGetOperationalQueueProjection(context: ActorContext, query: Record<string, string>) {
  const permission = requireOpsCenterPermission(context);
  if (!permission.allowed) return permission.response;

  return response.ok(await buildOperationalQueueProjection({
    domain: normalizeDomain(query.domain),
    workflowState: normalizeWorkflowState(query.workflowState),
    priority: normalizePriority(query.priority),
    search: normalizeText(query.search),
    limit: clampLimit(query.limit),
  }));
}

export async function handleGetOperationalQueueDetailProjection(context: ActorContext, intentId: string) {
  const permission = requireOpsCenterPermission(context);
  if (!permission.allowed) return permission.response;

  const projection = await buildOperationalQueueDetailProjection(intentId);
  if (!projection) {
    return response.notFound('OPERATIONAL_INTENT_NOT_FOUND', 'Operational intent projection was not found');
  }

  return response.ok(projection);
}

export async function handleGetFinanceOpsProjection(context: ActorContext) {
  const permission = requireOpsCenterPermission(context);
  if (!permission.allowed) return permission.response;

  return response.ok(await buildFinanceOpsProjection());
}
