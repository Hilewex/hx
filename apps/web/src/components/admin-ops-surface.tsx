'use client';

import type {
  AdminDashboardProjection,
  AdminFinanceOpsProjection,
  OperationalQueueDetailProjection,
  OperationalQueueItemProjection,
  OperationalQueuePriority,
  OperationalQueueProjection,
  OperationalQueueWorkflowState,
  AdminProductApprovalDetailProjection,
  AdminProductApprovalQueueItemProjection,
  AdminProductApprovalQueueProjection,
  PublicProjectionEnvelope,
  RefundCommandIntentStatus,
  RefundReviewDetailProjection,
  RefundReviewQueueItemProjection,
  RefundReviewQueueProjection,
  ModerationCommandIntentStatus,
  ModerationReviewDetailProjection,
  ModerationReviewQueueItemProjection,
  ModerationReviewQueueProjection,
  RiskCommandIntentStatus,
  RiskReviewDetailProjection,
  RiskReviewQueueItemProjection,
  RiskReviewQueueProjection,
} from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  readAdminDashboardProjection,
  readAdminFinanceOpsProjection,
  readAdminOperationalQueueDetailProjection,
  readAdminOperationalQueueProjection,
  readAdminProductApprovalDetailProjection,
  readAdminProductApprovalQueueProjection,
  readAdminRefundReviewDetailProjection,
  readAdminRefundReviewQueueProjection,
  readAdminModerationReviewDetailProjection,
  readAdminModerationReviewQueueProjection,
  readAdminRiskReviewDetailProjection,
  readAdminRiskReviewQueueProjection,
  executeAdminProtectedAction,
  executeModerationCommandIntent,
  executeRefundCommandIntent,
  executeRiskCommandIntent,
} from '../lib/bff/admin';
import { useState } from 'react';
import type { AdminOwnerHandoffStatus } from '@hx/contracts';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

type AdminSurface = 'dashboard' | 'ops' | 'ops-detail' | 'products' | 'product-detail' | 'refunds' | 'refund-detail' | 'moderation' | 'moderation-detail' | 'risk' | 'risk-detail';

export function AdminOpsSurface({
  surface,
  productId,
  refundId,
  moderationCaseId,
  riskCaseId,
  opsIntentId,
}: {
  surface: AdminSurface;
  productId?: string;
  refundId?: string;
  moderationCaseId?: string;
  riskCaseId?: string;
  opsIntentId?: string;
}) {
  const query = useQuery({
    queryKey: projectionQueryKeys.admin(surface, productId ?? refundId ?? moderationCaseId ?? riskCaseId ?? opsIntentId),
    queryFn: (): Promise<PublicProjectionEnvelope<unknown>> => readSurfaceProjection(surface, productId, refundId, moderationCaseId, riskCaseId, opsIntentId),
    staleTime: 20_000,
  });

  return (
    <div className="page-stack admin-page">
      <AdminRouteTitle surface={surface} />
      <AdminScopeGuidance />
      {query.isLoading ? <LoadingState title="Loading admin projection" description="Waiting for BFF read data." /> : null}
      <AdminProjectionNotice projection={query.data} isError={query.isError} retry={() => void query.refetch()} />
      {surface === 'dashboard' ? <AdminDashboard projection={query.data as PublicProjectionEnvelope<AdminDashboardProjection> | undefined} /> : null}
      {surface === 'ops' ? <AdminOperationalQueue projection={query.data as PublicProjectionEnvelope<OperationalQueueProjection> | undefined} /> : null}
      {surface === 'ops-detail' ? (
        <AdminOperationalDetail projection={query.data as PublicProjectionEnvelope<OperationalQueueDetailProjection> | undefined} intentId={opsIntentId} />
      ) : null}
      {surface === 'products' ? <AdminProductQueue projection={query.data as PublicProjectionEnvelope<AdminProductApprovalQueueProjection> | undefined} /> : null}
      {surface === 'product-detail' ? (
        <AdminProductDetail projection={query.data as PublicProjectionEnvelope<AdminProductApprovalDetailProjection> | undefined} productId={productId} />
      ) : null}
      {surface === 'refunds' ? <AdminRefundQueue projection={query.data as PublicProjectionEnvelope<RefundReviewQueueProjection> | undefined} /> : null}
      {surface === 'refund-detail' ? (
        <AdminRefundDetail projection={query.data as PublicProjectionEnvelope<RefundReviewDetailProjection> | undefined} refundId={refundId} />
      ) : null}
      {surface === 'moderation' ? <AdminModerationQueue projection={query.data as PublicProjectionEnvelope<ModerationReviewQueueProjection> | undefined} /> : null}
      {surface === 'moderation-detail' ? (
        <AdminModerationDetail projection={query.data as PublicProjectionEnvelope<ModerationReviewDetailProjection> | undefined} caseId={moderationCaseId} />
      ) : null}
      {surface === 'risk' ? <AdminRiskQueue projection={query.data as PublicProjectionEnvelope<RiskReviewQueueProjection> | undefined} /> : null}
      {surface === 'risk-detail' ? (
        <AdminRiskDetail projection={query.data as PublicProjectionEnvelope<RiskReviewDetailProjection> | undefined} caseId={riskCaseId} />
      ) : null}
      <AdminStateReview />
    </div>
  );
}

function readSurfaceProjection(surface: AdminSurface, productId?: string, refundId?: string, moderationCaseId?: string, riskCaseId?: string, opsIntentId?: string): Promise<PublicProjectionEnvelope<unknown>> {
  if (surface === 'ops') {
    return readAdminOperationalQueueProjection();
  }

  if (surface === 'ops-detail') {
    return readAdminOperationalQueueDetailProjection(opsIntentId ?? 'missing-operational-intent');
  }

  if (surface === 'products') {
    return readAdminProductApprovalQueueProjection();
  }

  if (surface === 'product-detail') {
    return readAdminProductApprovalDetailProjection(productId ?? 'missing-product');
  }

  if (surface === 'refunds') {
    return readAdminRefundReviewQueueProjection();
  }

  if (surface === 'refund-detail') {
    return readAdminRefundReviewDetailProjection(refundId ?? 'missing-refund');
  }

  if (surface === 'moderation') {
    return readAdminModerationReviewQueueProjection();
  }

  if (surface === 'moderation-detail') {
    return readAdminModerationReviewDetailProjection(moderationCaseId ?? 'missing-moderation-case');
  }

  if (surface === 'risk') {
    return readAdminRiskReviewQueueProjection();
  }

  if (surface === 'risk-detail') {
    return readAdminRiskReviewDetailProjection(riskCaseId ?? 'missing-risk-case');
  }

  return readAdminDashboardProjection();
}

function formatOperationalIntentStatus(status: RefundCommandIntentStatus | ModerationCommandIntentStatus | RiskCommandIntentStatus | 'submitting' | 'idle'): string {
  switch (status) {
    case 'submitting':
      return 'intent recorded';
    case 'checker_required':
      return 'checker required';
    case 'checked_for_owner_handoff':
      return 'checked';
    case 'escalated':
      return 'escalated';
    case 'accepted_for_owner_handoff':
    case 'maker_submitted':
    case 'payout_hold_recommended':
      return 'owner handoff pending';
    case 'rejected_by_checker':
    case 'evidence_required':
    case 'validation_failed':
    case 'permission_denied':
    case 'owner_unavailable':
      return 'intent recorded';
    case 'idle':
    default:
      return 'intent recorded';
  }
}

function AdminRouteTitle({ surface }: { surface: AdminSurface }) {
  const title =
    surface === 'ops'
      ? 'Operational queue center'
      : surface === 'ops-detail'
        ? 'Operational queue detail'
        : surface === 'products'
      ? 'Product approval queue'
      : surface === 'product-detail'
        ? 'Product approval detail'
        : surface === 'refunds'
          ? 'Refund review queue'
          : surface === 'refund-detail'
            ? 'Refund review detail'
            : surface === 'moderation'
              ? 'Moderation review queue'
              : surface === 'moderation-detail'
                ? 'Moderation review detail'
                : surface === 'risk'
                  ? 'Risk review queue'
                  : surface === 'risk-detail'
                    ? 'Risk review detail'
        : 'Admin operations';

  return (
    <section className="route-title">
      <span className="placeholder-label">Admin projection surface</span>
      <h1>{title}</h1>
      <p>Admin review is not product approval, product activation, refund execution, moderation enforcement, fraud confirmation, payout blocking, or owner state mutation.</p>
    </section>
  );
}

function AdminScopeGuidance() {
  return (
    <section className="admin-guidance" aria-labelledby="admin-guidance-title">
      <span className="placeholder-label">Scope guidance</span>
      <h2 id="admin-guidance-title">Admin ops boundary</h2>
      <ul>
        <li>Bu yuzey projection gosterir; query cache ve projection owner truth degildir.</li>
        <li>Approve, reject, revision ve evidence aksiyonlari owner/BFF command ile yurutulur.</li>
        <li>Admin UI direct write, local permission engine veya owner state mutation uretmez.</li>
        <li>product submitted != product approved.</li>
        <li>product approved != product active/sellable.</li>
        <li>admin reviewed != owner state mutated.</li>
        <li>risk signal != rejection decision; moderation flag != final moderation decision.</li>
        <li>audit visible != audit owner mutation.</li>
      </ul>
    </section>
  );
}

function AdminDashboard({ projection }: { projection?: PublicProjectionEnvelope<AdminDashboardProjection> }) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-dashboard-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Ops summary projection</span>
          <h2 id="admin-dashboard-title">Admin operations summary</h2>
          <dl className="admin-facts">
            <Fact label="Actor" value={data?.context.actorId ?? 'Admin actor projection unavailable'} />
            <Fact label="Role" value={data?.context.roleProjection ?? 'Role projection unavailable'} />
            <Fact label="Scope" value={data?.context.opsScopeStatus ?? 'Scope projection unavailable'} />
            <Fact label="Audit/evidence" value={data?.opsSummary.auditEvidenceText ?? 'Audit evidence projection unavailable'} />
          </dl>
        </section>
        <section className="admin-panel" aria-labelledby="admin-summary-title">
          <span className="placeholder-label">Queues</span>
          <h2 id="admin-summary-title">Operational queue projections</h2>
          <div className="admin-card-grid">
            <SummaryCard title="Ops center" value="Cross-domain intent queue projection" href="/admin/ops" />
            <SummaryCard title="Products" value={data?.opsSummary.productApprovalQueueText ?? 'Product queue unavailable'} href="/admin/products" />
            <SummaryCard title="Moderation" value={data?.opsSummary.moderationRiskQueueText ?? 'Moderation queue projection'} href="/admin/moderation" />
            <SummaryCard title="Risk" value="Risk review queue projection" href="/admin/risk" />
            <SummaryCard title="Refund review" value={data?.supportFinanceOpsPlaceholderText ?? 'Support and finance placeholder'} href="/admin/refunds" />
            <SummaryCard title="Audit evidence" value={data?.auditEvidenceSummaryPlaceholderText ?? 'Evidence placeholder'} />
          </div>
        </section>
        {data?.degradedStateText ? <DegradedState title="Degraded admin state" description={data.degradedStateText} /> : null}
      </div>
      <AdminActionPanel />
    </section>
  );
}

function AdminOperationalQueue({ projection }: { projection?: PublicProjectionEnvelope<OperationalQueueProjection> }) {
  const financeOpsQuery = useQuery({
    queryKey: projectionQueryKeys.admin('ops-finance'),
    queryFn: (): Promise<PublicProjectionEnvelope<AdminFinanceOpsProjection>> => readAdminFinanceOpsProjection(),
    staleTime: 20_000,
  });
  const [domainFilter, setDomainFilter] = useState<'all' | 'refund' | 'moderation' | 'risk'>('all');
  const [workflowFilter, setWorkflowFilter] = useState<'all' | OperationalQueueWorkflowState>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | OperationalQueuePriority>('all');
  const [search, setSearch] = useState('');
  const items = (projection?.data?.items ?? []).filter((item) => {
    const needle = search.trim().toLowerCase();
    return (domainFilter === 'all' || item.domain === domainFilter)
      && (workflowFilter === 'all' || item.workflowState === workflowFilter)
      && (priorityFilter === 'all' || item.priority.priority === priorityFilter)
      && (!needle || [
        item.intentId,
        item.domain,
        item.targetId,
        item.actionType,
        item.workflowState,
        item.reasonCode,
        item.makerCheckerSummary.makerActorId,
        item.makerCheckerSummary.checkerActorId ?? '',
      ].some((value) => value.toLowerCase().includes(needle)));
  });

  return (
    <section className="admin-layout" aria-labelledby="admin-ops-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Cross-domain projection</span>
          <h2 id="admin-ops-title">Operational intent queue</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Operational queue boundary" description={projection.data.degradedStateText} /> : null}
          <OperationalQueueFilters
            domainFilter={domainFilter}
            workflowFilter={workflowFilter}
            priorityFilter={priorityFilter}
            search={search}
            onDomainFilter={setDomainFilter}
            onWorkflowFilter={setWorkflowFilter}
            onPriorityFilter={setPriorityFilter}
            onSearch={setSearch}
          />
          {items.length === 0 ? (
            <EmptyState title="Operational queue empty" description="No refund, moderation, or risk operational intent projection matches the current filters." />
          ) : (
            <div className="admin-list" role="list" aria-label="Operational queue projections">
              {items.map((item) => <AdminOperationalQueueItem item={item} key={item.intentId} />)}
            </div>
          )}
        </section>
        <AdminFinanceOpsCockpit projection={financeOpsQuery.data} isLoading={financeOpsQuery.isLoading} isError={financeOpsQuery.isError} retry={() => void financeOpsQuery.refetch()} />
      </div>
      <aside className="admin-actions" aria-labelledby="admin-ops-boundary-title">
        <span className="placeholder-label">Projection boundary</span>
        <h2 id="admin-ops-boundary-title">Ops center boundary</h2>
        <p>SLA, priority, audit, and escalation values are visibility projections only.</p>
        <p>This surface does not execute operational commands or mutate owner state.</p>
      </aside>
    </section>
  );
}

function AdminFinanceOpsCockpit({
  projection,
  isLoading,
  isError,
  retry,
}: {
  projection?: PublicProjectionEnvelope<AdminFinanceOpsProjection>;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  const data = projection?.data;

  return (
    <section className="admin-panel" aria-labelledby="admin-finance-ops-title">
      <span className="placeholder-label">Finance ops read-only / projection-only</span>
      <h2 id="admin-finance-ops-title">Finance operations cockpit</h2>
      <p className="admin-status">Read-only visibility for settlement, payout, finance correction, ledger, and reconciliation signals.</p>
      {isLoading ? <LoadingState title="Loading finance ops projection" description="Waiting for read-only finance visibility." /> : null}
      {isError ? <ErrorState title="Finance ops projection failed" description="No settlement, payout, correction, ledger, or reconciliation truth is inferred locally." action={<button className="shell-action" type="button" onClick={retry}>Retry</button>} /> : null}
      {data?.degradedStateText ? <DegradedState title="Finance ops boundary" description={data.degradedStateText} /> : null}
      {!data ? <EmptyState title="Finance ops unavailable" description="Read-only finance projection has not returned data." /> : null}
      {data ? (
        <>
          <dl className="admin-facts">
            <Fact label="Projection only" value={data.boundaryFlags.projectionOnly ? 'true' : 'false'} />
            <Fact label="Settlement truth mutated" value={String(data.boundaryFlags.settlementTruthMutated)} />
            <Fact label="Payout truth mutated" value={String(data.boundaryFlags.payoutTruthMutated)} />
            <Fact label="Provider payout executed" value={String(data.boundaryFlags.providerPayoutExecuted)} />
            <Fact label="Ledger truth mutated" value={String(data.boundaryFlags.ledgerTruthMutated)} />
            <Fact label="Payout batches visible" value={`${data.payoutBatchSummary.totalProjection}; failed/partial ${data.payoutBatchSummary.blockedOrFailedProjection}`} />
          </dl>
          {data.emptyState ? <EmptyState title="Finance ops queues empty" description="No fallback settlement, payout, correction, ledger, or reconciliation state is fabricated." /> : null}
          <FinanceOpsGroupList title="Settlement visibility" groups={data.settlement} />
          <FinanceOpsGroupList title="Payout visibility" groups={data.payout} />
          <FinanceOpsGroupList title="Finance correction visibility" groups={data.financeCorrection} />
          <FinanceOpsGroupList title="Ledger visibility" groups={[data.ledger]} />
          <FinanceOpsGroupList title="Reconciliation visibility" groups={[data.reconciliation]} />
          <p>There are no approve, release, finalize, pay, retry, append, or apply controls in this cockpit.</p>
        </>
      ) : null}
    </section>
  );
}

function FinanceOpsGroupList({ title, groups }: { title: string; groups: AdminFinanceOpsProjection['settlement'] }) {
  return (
    <section className="admin-subpanel" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <h3 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h3>
      <div className="admin-card-grid">
        {groups.map((group) => (
          <div className="admin-summary-card" key={group.groupId}>
            <span>{group.title}</span>
            <strong>{group.totalProjection} visible</strong>
          </div>
        ))}
      </div>
      {groups.map((group) => (
        <div className="admin-list" role="list" aria-label={group.title} key={`${group.groupId}-items`}>
          {group.degradedStateText ? <DegradedState title={group.title} description={group.degradedStateText} /> : null}
          {group.emptyState ? <EmptyState title={`${group.title} empty`} description="No projection-safe source item is currently visible." /> : null}
          {group.items.map((item) => (
            <article className="admin-mini-item" role="listitem" key={item.id}>
              <strong>{item.id}</strong>
              <span>{item.status}. {item.target}. {item.amountText ?? 'Amount unavailable'}.</span>
              <span>{item.reasonText}. {item.flags.join(' | ')}.</span>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}

function OperationalQueueFilters({
  domainFilter,
  workflowFilter,
  priorityFilter,
  search,
  onDomainFilter,
  onWorkflowFilter,
  onPriorityFilter,
  onSearch,
}: {
  domainFilter: 'all' | 'refund' | 'moderation' | 'risk';
  workflowFilter: 'all' | OperationalQueueWorkflowState;
  priorityFilter: 'all' | OperationalQueuePriority;
  search: string;
  onDomainFilter: (value: 'all' | 'refund' | 'moderation' | 'risk') => void;
  onWorkflowFilter: (value: 'all' | OperationalQueueWorkflowState) => void;
  onPriorityFilter: (value: 'all' | OperationalQueuePriority) => void;
  onSearch: (value: string) => void;
}) {
  return (
    <div className="admin-subpanel" aria-label="Operational queue filters">
      <div className="admin-facts">
        <label>
          <dt>Domain</dt>
          <dd>
            <select value={domainFilter} onChange={(event) => onDomainFilter(event.target.value as 'all' | 'refund' | 'moderation' | 'risk')}>
              <option value="all">all</option>
              <option value="refund">refund</option>
              <option value="moderation">moderation</option>
              <option value="risk">risk</option>
            </select>
          </dd>
        </label>
        <label>
          <dt>Workflow</dt>
          <dd>
            <select value={workflowFilter} onChange={(event) => onWorkflowFilter(event.target.value as 'all' | OperationalQueueWorkflowState)}>
              <option value="all">all</option>
              <option value="prepared">prepared</option>
              <option value="checker_required">checker required</option>
              <option value="checked">checked</option>
              <option value="rejected">rejected</option>
              <option value="escalated">escalated</option>
              <option value="owner_handoff_pending">owner handoff pending</option>
              <option value="owner_handoff_ready">owner handoff ready</option>
            </select>
          </dd>
        </label>
        <label>
          <dt>Priority</dt>
          <dd>
            <select value={priorityFilter} onChange={(event) => onPriorityFilter(event.target.value as 'all' | OperationalQueuePriority)}>
              <option value="all">all</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </dd>
        </label>
        <label>
          <dt>Search</dt>
          <dd>
            <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="intent, target, actor, reason" />
          </dd>
        </label>
      </div>
    </div>
  );
}

function AdminOperationalQueueItem({ item }: { item: OperationalQueueItemProjection }) {
  return (
    <article className="admin-list-item" role="listitem" data-status={item.workflowState}>
      <div className="admin-item-media" aria-hidden="true">{item.domain}</div>
      <div>
        <h3>{item.intentId}</h3>
        <p className="admin-status">{item.workflowState}. {item.priority.priorityText}</p>
        <p>{item.targetId}. {item.actionType}. Reason: {item.reasonCode}.</p>
        <p>{item.makerCheckerSummary.summaryText} Evidence refs: {item.evidenceCount}.</p>
        <p>SLA: {item.sla.projectionText} Escalation: {item.escalation.state}.</p>
        <p>Audit: {item.auditStatus.projectionText}</p>
        <Link className="state-action secondary" href={item.detailHref}>Open intent detail</Link>
      </div>
    </article>
  );
}

function AdminOperationalDetail({
  projection,
  intentId,
}: {
  projection?: PublicProjectionEnvelope<OperationalQueueDetailProjection>;
  intentId?: string;
}) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-ops-detail-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Operational intent detail</span>
          <h2 id="admin-ops-detail-title">{data?.intentId ?? intentId ?? 'Operational intent unavailable'}</h2>
          {!data ? <EmptyState title="Operational intent unavailable" description="No operational intent projection was returned for this identifier." /> : null}
          {data ? (
            <>
              <dl className="admin-facts">
                <Fact label="Domain" value={data.domain} />
                <Fact label="Target" value={data.targetId} />
                <Fact label="Action" value={data.actionType} />
                <Fact label="Workflow" value={data.workflowState} />
                <Fact label="Maker/checker" value={data.makerCheckerSummary.summaryText} />
                <Fact label="Reason" value={data.reasonCode} />
                <Fact label="Evidence refs" value={String(data.evidenceCount)} />
                <Fact label="Priority" value={data.priority.priorityText} />
                <Fact label="SLA" value={data.sla.projectionText} />
                <Fact label="Escalation" value={`${data.escalation.state}. ${data.escalation.visibilityText}`} />
                <Fact label="Audit" value={data.auditOutboxProjection.projectionText} />
              </dl>
              <section className="admin-subpanel" aria-labelledby="ops-detail-notes-title">
                <h3 id="ops-detail-notes-title">Projection notes</h3>
                {data.projectionNotes.map((note) => <p key={note}>{note}</p>)}
              </section>
            </>
          ) : null}
        </section>
      </div>
      <aside className="admin-actions" aria-labelledby="admin-ops-detail-boundary-title">
        <span className="placeholder-label">Read only</span>
        <h2 id="admin-ops-detail-boundary-title">Detail boundary</h2>
        <p>This page reads queue, SLA, escalation, and audit projection fields only.</p>
        <Link className="state-action secondary" href="/admin/ops">Back to ops center</Link>
      </aside>
    </section>
  );
}

function AdminRefundQueue({ projection }: { projection?: PublicProjectionEnvelope<RefundReviewQueueProjection> }) {
  const items = projection?.data?.items ?? [];

  return (
    <section className="admin-layout" aria-labelledby="admin-refunds-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Refund review projection</span>
          <h2 id="admin-refunds-title">Refund operational review queue</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded refund queue" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Refund review queue empty" description="No local finance, provider, settlement, payout, or audit mutation truth is inferred." />
          ) : (
            <div className="admin-list" role="list" aria-label="Refund review queue projections">
              {items.map((item) => <AdminRefundQueueItem item={item} key={item.refundId} />)}
            </div>
          )}
        </section>
      </div>
      <AdminRefundActionPanel />
    </section>
  );
}

function AdminRefundQueueItem({ item }: { item: RefundReviewQueueItemProjection }) {
  return (
    <article className="admin-list-item" role="listitem" data-status={item.statusProjection}>
      <div className="admin-item-media" aria-hidden="true">Refund</div>
      <div>
        <h3>{item.refundId}</h3>
        <p className="admin-status">Status projection: {item.statusProjection}. Review state does not create finance truth.</p>
        <p>{item.amountProjectionText}. {item.orderContextProjectionText}</p>
        <p>{item.reasonPreviewText}</p>
        <p>{item.evidencePreviewText}</p>
        <p>{item.escalation.visibilityText}</p>
        <Link className="state-action secondary" href={item.detailHref}>Open refund detail</Link>
      </div>
    </article>
  );
}

function AdminRefundDetail({
  projection,
  refundId,
}: {
  projection?: PublicProjectionEnvelope<RefundReviewDetailProjection>;
  refundId?: string;
}) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-refund-detail-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Finance review detail projection</span>
          <h2 id="admin-refund-detail-title">{data?.refundId ?? refundId ?? 'Refund detail unavailable'}</h2>
          {!data ? <EmptyState title="Refund detail unavailable" description="No local refund execution, provider, settlement, payout, or audit mutation truth is created." /> : null}
          {data ? (
            <>
              <dl className="admin-facts">
                <Fact label="Request" value={data.cancelReturnRequestId} />
                <Fact label="Source" value={data.sourceTypeProjection} />
                <Fact label="Status" value={`${data.statusProjection}. Projection only.`} />
                <Fact label="Amount" value={data.amountProjectionText} />
                <Fact label="Escalation" value={data.escalation.visibilityText} />
              </dl>
              <RefundContextPanels data={data} />
              <RefundAuditEvidencePanel data={data} />
            </>
          ) : null}
        </section>
      </div>
      <AdminRefundActionPanel detail={data} />
    </section>
  );
}

function RefundContextPanels({ data }: { data: RefundReviewDetailProjection }) {
  return (
    <>
      <section className="admin-subpanel" aria-labelledby="refund-lines-title">
        <h3 id="refund-lines-title">Refund line projection</h3>
        <div className="admin-list" role="list" aria-label="Refund line projections">
          {data.lines.map((line) => (
            <article className="admin-mini-item" role="listitem" key={line.refundLineId}>
              <strong>{line.productId}</strong>
              <span>{line.quantityProjectionText}. {line.amountProjectionText}. Line truth is not produced here.</span>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-subpanel" aria-labelledby="refund-context-title">
        <h3 id="refund-context-title">Risk, support, order context</h3>
        <p>{data.riskContextProjectionText}</p>
        <p>{data.supportContextProjectionText}</p>
        <p>{data.orderContextProjectionText}</p>
        <p>{data.paymentContextProjectionText}</p>
        <p>{data.settlementContextProjectionText}</p>
        <p>{data.payoutContextProjectionText}</p>
        <p>{data.providerContextProjectionText}</p>
      </section>
      <section className="admin-subpanel" aria-labelledby="maker-checker-title">
        <h3 id="maker-checker-title">Maker-checker foundation</h3>
        <p>{data.makerChecker.makerActorProjectionText}</p>
        <p>{data.makerChecker.checkerActorProjectionText}</p>
        <p>Review workflow state: {data.makerChecker.reviewWorkflowStateProjection}.</p>
        <p>{data.makerChecker.latestDecisionProjectionText}</p>
        <p>Same actor checker approval blocked: {data.makerChecker.sameActorApprovalBlockedProjection ? 'yes' : 'no'}.</p>
        <p>Dual approval required projection: {data.makerChecker.dualApprovalRequiredProjection ? 'yes' : 'no'}.</p>
      </section>
    </>
  );
}

function RefundAuditEvidencePanel({ data }: { data: RefundReviewDetailProjection }) {
  return (
    <section className="admin-subpanel" aria-labelledby="refund-audit-title">
      <span className="placeholder-label">Audit/evidence projection</span>
      <h3 id="refund-audit-title">Audit intent preview</h3>
      {data.auditEvidence.missingEvidenceWarnings.length > 0 ? (
        <div className="admin-warning" role="status">
          {data.auditEvidence.missingEvidenceWarnings.join(' ')}
        </div>
      ) : null}
      <dl className="admin-facts">
        <Fact label="Required evidence" value={data.auditEvidence.requiredEvidenceRefs.join(', ')} />
        <Fact label="Provided evidence" value={data.auditEvidence.providedEvidenceRefs.join(', ') || 'Evidence refs not attached in projection'} />
        <Fact label="Reason" value={data.auditEvidence.reasonCodeProjectionText} />
        <Fact label="Intent preview" value={data.auditEvidence.auditIntentPreview.join(' | ')} />
        <Fact label="Audit intent" value={data.auditEvidence.auditIntentRecordedProjection ? 'recorded' : 'pending'} />
        <Fact label="Audit outbox" value={data.auditEvidence.auditIntentPersistedProjection ? 'persisted' : 'pending'} />
        <Fact label="Latest audit" value={data.auditEvidence.latestAuditIntentText ?? 'Audit intent pending'} />
      </dl>
      <p>Audit intent recording is separate from finance, provider, settlement, payout, and completed refund truth.</p>
    </section>
  );
}

function AdminRefundActionPanel({ detail }: { detail?: RefundReviewDetailProjection }) {
  const [intentStatus, setIntentStatus] = useState<RefundCommandIntentStatus | 'submitting' | 'idle'>('idle');
  const [auditIntentState, setAuditIntentState] = useState<'pending' | 'delivered' | 'idle'>('idle');

  async function handleIntent(kind: 'review' | 'manual-escalation' | 'evidence-required') {
    if (!detail) return;
    setIntentStatus('submitting');

    const result = await executeRefundCommandIntent({
      kind,
      refundId: detail.refundId,
      reasonCode: kind === 'evidence-required' ? 'EVIDENCE_REQUIRED' : 'MANUAL_REVIEW',
      evidenceRefs: ['admin-refund-review-surface'],
    });

    setIntentStatus(result.status);
    setAuditIntentState(result.auditIntentPersisted ? 'pending' : 'pending');
  }

  return (
    <aside className="admin-actions" aria-labelledby="refund-actions-title">
      <span className="placeholder-label">Protected command intent</span>
      <h2 id="refund-actions-title">Refund review actions</h2>
      {intentStatus !== 'idle' ? (
        <div className="admin-warning" role="status">
          Command intent status: {formatOperationalIntentStatus(intentStatus)}
        </div>
      ) : null}
      {auditIntentState !== 'idle' ? (
        <div className="admin-warning" role="status">
          Audit intent: {auditIntentState}
        </div>
      ) : null}
      <button type="button" onClick={() => handleIntent('review')} disabled={!detail || intentStatus === 'submitting'}>
        Send review intent
      </button>
      <button type="button" onClick={() => handleIntent('manual-escalation')} disabled={!detail || intentStatus === 'submitting'}>
        Send manual escalation intent
      </button>
      <button type="button" onClick={() => handleIntent('evidence-required')} disabled={!detail || intentStatus === 'submitting'}>
        Send evidence required intent
      </button>
      <p>Buttons submit protected intent only. Owner refund execution, finance state changes, provider operations, audit persistence, settlement, and payout remain outside this UI.</p>
      <p>Accepted intent is owner handoff status, not final finance or provider outcome.</p>
    </aside>
  );
}

function AdminModerationQueue({ projection }: { projection?: PublicProjectionEnvelope<ModerationReviewQueueProjection> }) {
  const items = projection?.data?.items ?? [];

  return (
    <section className="admin-layout" aria-labelledby="admin-moderation-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Moderation review projection</span>
          <h2 id="admin-moderation-title">Moderation operational review queue</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded moderation queue" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Moderation queue empty" description="No final moderation, account/store action, enforcement, fraud truth, or payout action is inferred." />
          ) : (
            <div className="admin-list" role="list" aria-label="Moderation review queue projections">
              {items.map((item) => <AdminModerationQueueItem item={item} key={item.caseId} />)}
            </div>
          )}
        </section>
      </div>
      <AdminModerationActionPanel />
    </section>
  );
}

function AdminModerationQueueItem({ item }: { item: ModerationReviewQueueItemProjection }) {
  return (
    <article className="admin-list-item" role="listitem" data-status={item.statusProjection}>
      <div className="admin-item-media" aria-hidden="true">Mod</div>
      <div>
        <h3>{item.caseId}</h3>
        <p className="admin-status">Severity: {item.severityProjection}. Status projection: {item.statusProjection}.</p>
        <p>{item.targetTypeProjection}:{item.targetIdProjection}. {item.relatedContextProjectionText}</p>
        <p>{item.evidencePreviewText}</p>
        <p>{item.escalation.visibilityText}</p>
        <p>{item.payoutHoldRecommendation.recommendationText}</p>
        <Link className="state-action secondary" href={item.detailHref}>Open moderation detail</Link>
      </div>
    </article>
  );
}

function AdminModerationDetail({ projection, caseId }: { projection?: PublicProjectionEnvelope<ModerationReviewDetailProjection>; caseId?: string }) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-moderation-detail-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Moderation detail projection</span>
          <h2 id="admin-moderation-detail-title">{data?.caseId ?? caseId ?? 'Moderation detail unavailable'}</h2>
          {!data ? <EmptyState title="Moderation detail unavailable" description="No enforcement, account/store action, final moderation, fraud truth, or payout action is created." /> : null}
          {data ? (
            <>
              <dl className="admin-facts">
                <Fact label="Target" value={`${data.targetTypeProjection}:${data.targetIdProjection}`} />
                <Fact label="Severity" value={data.severityProjection} />
                <Fact label="Status" value={`${data.statusProjection}. Projection only.`} />
                <Fact label="Escalation" value={data.escalation.visibilityText} />
                <Fact label="Payout hold" value={data.payoutHoldRecommendation.recommendationText} />
              </dl>
              <OperationalEvidencePanel title="Moderation evidence preview" evidence={data.evidence} auditEvidence={data.auditEvidence} />
              <OperationalMakerCheckerPanel makerChecker={data.makerChecker} />
              <section className="admin-subpanel" aria-labelledby="moderation-context-title">
                <h3 id="moderation-context-title">Related context</h3>
                <p>{data.relatedOrderStoreUserPostContextProjectionText}</p>
                <p>{data.contentPreviewProjectionText}</p>
              </section>
            </>
          ) : null}
        </section>
      </div>
      <AdminModerationActionPanel detail={data} />
    </section>
  );
}

function AdminModerationActionPanel({ detail }: { detail?: ModerationReviewDetailProjection }) {
  const [intentStatus, setIntentStatus] = useState<ModerationCommandIntentStatus | 'submitting' | 'idle'>('idle');
  const [auditIntentState, setAuditIntentState] = useState<'pending' | 'delivered' | 'idle'>('idle');

  async function handleIntent(kind: 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold') {
    if (!detail) return;
    setIntentStatus('submitting');
    const result = await executeModerationCommandIntent({
      kind,
      caseId: detail.caseId,
      reasonCode: kind === 'require-evidence' ? 'EVIDENCE_REQUIRED' : 'MANUAL_REVIEW',
      evidenceRefs: ['admin-moderation-surface'],
    });
    setIntentStatus(result.status);
    setAuditIntentState(result.auditIntentPersisted ? 'pending' : 'pending');
  }

  return <OperationalActionPanel title="Moderation review actions" disabled={!detail || intentStatus === 'submitting'} intentStatus={intentStatus} auditIntentState={auditIntentState} onIntent={handleIntent} />;
}

function AdminRiskQueue({ projection }: { projection?: PublicProjectionEnvelope<RiskReviewQueueProjection> }) {
  const items = projection?.data?.items ?? [];

  return (
    <section className="admin-layout" aria-labelledby="admin-risk-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Risk review projection</span>
          <h2 id="admin-risk-title">Risk operational review queue</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded risk queue" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Risk queue empty" description="No fraud truth, payout action, account action, penalty, or enforcement truth is inferred." />
          ) : (
            <div className="admin-list" role="list" aria-label="Risk review queue projections">
              {items.map((item) => <AdminRiskQueueItem item={item} key={item.caseId} />)}
            </div>
          )}
        </section>
      </div>
      <AdminRiskActionPanel />
    </section>
  );
}

function AdminRiskQueueItem({ item }: { item: RiskReviewQueueItemProjection }) {
  return (
    <article className="admin-list-item" role="listitem" data-status={item.statusProjection}>
      <div className="admin-item-media" aria-hidden="true">Risk</div>
      <div>
        <h3>{item.caseId}</h3>
        <p className="admin-status">Risk level: {item.riskLevelProjection}. {item.scoreProjectionText}.</p>
        <p>{item.targetTypeProjection}:{item.targetIdProjection}. {item.relatedContextProjectionText}</p>
        <p>{item.evidencePreviewText}</p>
        <p>{item.escalation.visibilityText}</p>
        <p>{item.payoutHoldRecommendation.recommendationText}</p>
        <Link className="state-action secondary" href={item.detailHref}>Open risk detail</Link>
      </div>
    </article>
  );
}

function AdminRiskDetail({ projection, caseId }: { projection?: PublicProjectionEnvelope<RiskReviewDetailProjection>; caseId?: string }) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-risk-detail-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Risk detail projection</span>
          <h2 id="admin-risk-detail-title">{data?.caseId ?? caseId ?? 'Risk detail unavailable'}</h2>
          {!data ? <EmptyState title="Risk detail unavailable" description="No fraud confirmation, payout hold execution, blocking, penalty, or enforcement truth is created." /> : null}
          {data ? (
            <>
              <dl className="admin-facts">
                <Fact label="Target" value={`${data.targetTypeProjection}:${data.targetIdProjection}`} />
                <Fact label="Risk level" value={data.riskLevelProjection} />
                <Fact label="Score" value={data.scoreProjectionText} />
                <Fact label="Status" value={`${data.statusProjection}. Projection only.`} />
                <Fact label="Payout hold" value={data.payoutHoldRecommendation.recommendationText} />
              </dl>
              <OperationalEvidencePanel title="Risk evidence preview" evidence={data.evidence} auditEvidence={data.auditEvidence} />
              <OperationalMakerCheckerPanel makerChecker={data.makerChecker} />
              <section className="admin-subpanel" aria-labelledby="risk-context-title">
                <h3 id="risk-context-title">Related context</h3>
                <p>{data.relatedOrderStoreUserPostContextProjectionText}</p>
                <p>{data.fraudSignalProjectionText}</p>
              </section>
            </>
          ) : null}
        </section>
      </div>
      <AdminRiskActionPanel detail={data} />
    </section>
  );
}

function AdminRiskActionPanel({ detail }: { detail?: RiskReviewDetailProjection }) {
  const [intentStatus, setIntentStatus] = useState<RiskCommandIntentStatus | 'submitting' | 'idle'>('idle');
  const [auditIntentState, setAuditIntentState] = useState<'pending' | 'delivered' | 'idle'>('idle');

  async function handleIntent(kind: 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold') {
    if (!detail) return;
    setIntentStatus('submitting');
    const result = await executeRiskCommandIntent({
      kind,
      caseId: detail.caseId,
      reasonCode: kind === 'require-evidence' ? 'EVIDENCE_REQUIRED' : kind === 'recommend-payout-hold' ? 'PAYOUT_HOLD_RECOMMENDATION' : 'MANUAL_REVIEW',
      evidenceRefs: ['admin-risk-surface'],
    });
    setIntentStatus(result.status);
    setAuditIntentState(result.auditIntentPersisted ? 'pending' : 'pending');
  }

  return <OperationalActionPanel title="Risk review actions" disabled={!detail || intentStatus === 'submitting'} intentStatus={intentStatus} auditIntentState={auditIntentState} onIntent={handleIntent} />;
}

function OperationalEvidencePanel({
  title,
  evidence,
  auditEvidence,
}: {
  title: string;
  evidence: Array<{ evidenceId: string; evidenceTypeProjection: string; sourceProjection: string; summaryProjectionText: string; createdAtProjectionText: string }>;
  auditEvidence: ModerationReviewDetailProjection['auditEvidence'] | RiskReviewDetailProjection['auditEvidence'];
}) {
  return (
    <section className="admin-subpanel" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <span className="placeholder-label">Audit/evidence projection</span>
      <h3 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h3>
      <dl className="admin-facts">
        <Fact label="Required evidence" value={auditEvidence.requiredEvidenceRefs.join(', ')} />
        <Fact label="Provided evidence" value={auditEvidence.providedEvidenceRefs.join(', ') || 'Evidence refs not attached in projection'} />
        <Fact label="Reason" value={auditEvidence.reasonCodeProjectionText} />
        <Fact label="Audit intent" value={auditEvidence.auditIntentRecordedProjection ? 'recorded' : 'pending'} />
        <Fact label="Audit outbox" value={auditEvidence.auditIntentPersistedProjection ? 'persisted' : 'pending'} />
      </dl>
      <div className="admin-list" role="list" aria-label={title}>
        {evidence.map((item) => (
          <article className="admin-mini-item" role="listitem" key={item.evidenceId}>
            <strong>{item.evidenceTypeProjection}</strong>
            <span>{item.sourceProjection}. {item.summaryProjectionText}. {item.createdAtProjectionText}.</span>
          </article>
        ))}
      </div>
      <p>Audit/evidence visibility is not audit owner mutation, enforcement completion, fraud confirmation, or payout blocking.</p>
    </section>
  );
}

function OperationalMakerCheckerPanel({
  makerChecker,
}: {
  makerChecker: ModerationReviewDetailProjection['makerChecker'] | RiskReviewDetailProjection['makerChecker'];
}) {
  return (
    <section className="admin-subpanel" aria-labelledby="ops-maker-checker-title">
      <h3 id="ops-maker-checker-title">Maker-checker foundation</h3>
      <p>{makerChecker.makerActorProjectionText}</p>
      <p>{makerChecker.checkerActorProjectionText}</p>
      <p>Workflow state: {makerChecker.workflowStateProjection}.</p>
      <p>Same actor checker approval blocked: {makerChecker.sameActorApprovalBlockedProjection ? 'yes' : 'no'}.</p>
      <p>Owner handoff required projection: {makerChecker.ownerHandoffRequiredProjection ? 'yes' : 'no'}.</p>
    </section>
  );
}

function OperationalActionPanel({
  title,
  disabled,
  intentStatus,
  auditIntentState,
  onIntent,
}: {
  title: string;
  disabled: boolean;
  intentStatus: ModerationCommandIntentStatus | RiskCommandIntentStatus | 'submitting' | 'idle';
  auditIntentState: 'pending' | 'delivered' | 'idle';
  onIntent: (kind: 'review' | 'escalation' | 'require-evidence' | 'recommend-payout-hold') => void;
}) {
  return (
    <aside className="admin-actions" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <span className="placeholder-label">Protected command intent</span>
      <h2 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h2>
      {intentStatus !== 'idle' ? <div className="admin-warning" role="status">Command intent status: {formatOperationalIntentStatus(intentStatus)}</div> : null}
      {auditIntentState !== 'idle' ? <div className="admin-warning" role="status">Audit intent: {auditIntentState}</div> : null}
      <button type="button" onClick={() => onIntent('review')} disabled={disabled}>Send review intent</button>
      <button type="button" onClick={() => onIntent('escalation')} disabled={disabled}>Send escalation intent</button>
      <button type="button" onClick={() => onIntent('require-evidence')} disabled={disabled}>Send require evidence intent</button>
      <button type="button" onClick={() => onIntent('recommend-payout-hold')} disabled={disabled}>Recommend payout hold</button>
      <p>Buttons submit protected intent only. They do not ban accounts, block payouts, confirm fraud, finalize moderation, execute penalties, mutate settlement, or enforce owner state.</p>
    </aside>
  );
}

function AdminProductQueue({ projection }: { projection?: PublicProjectionEnvelope<AdminProductApprovalQueueProjection> }) {
  const items = projection?.data?.items ?? [];

  return (
    <section className="admin-layout" aria-labelledby="admin-products-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Product approval projection</span>
          <h2 id="admin-products-title">Submitted product review queue</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded product approval queue" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Product approval queue empty" description="No local approval, activation, risk, or moderation truth is inferred." />
          ) : (
            <div className="admin-list" role="list" aria-label="Product approval queue projections">
              {items.map((item) => <AdminProductQueueItem item={item} key={item.productId} />)}
            </div>
          )}
        </section>
      </div>
      <AdminActionPanel />
    </section>
  );
}

function AdminProductQueueItem({ item }: { item: AdminProductApprovalQueueItemProjection }) {
  return (
    <article className="admin-list-item" role="listitem" data-status={item.reviewStatusProjection}>
      <div className="admin-item-media" aria-hidden="true">Review</div>
      <div>
        <h3>{item.title}</h3>
        <p className="admin-status">Review: {item.reviewStatusProjection}. Product submitted does not mean product approved.</p>
        <p>{item.supplierNameProjection}. {item.storeContextProjection}</p>
        <p>{item.riskSignalProjectionText}. Risk signal is not a rejection decision.</p>
        <p>{item.moderationSignalProjectionText}. Moderation flag is not a final moderation decision.</p>
        <p>{item.evidenceRequiredProjectionText}. Audit visible does not mutate audit owner state.</p>
        <Link className="state-action secondary" href={item.detailHref}>Open review detail</Link>
      </div>
    </article>
  );
}

function AdminProductDetail({
  projection,
  productId,
}: {
  projection?: PublicProjectionEnvelope<AdminProductApprovalDetailProjection>;
  productId?: string;
}) {
  const data = projection?.data;

  return (
    <section className="admin-layout" aria-labelledby="admin-product-detail-title">
      <div className="admin-main-stack">
        <section className="admin-panel">
          <span className="placeholder-label">Review detail projection</span>
          <h2 id="admin-product-detail-title">{data?.title ?? productId ?? 'Product detail unavailable'}</h2>
          {data?.degradedStateText ? <DegradedState title="Degraded approval detail" description={data.degradedStateText} /> : null}
          {!data ? <EmptyState title="Approval detail unavailable" description="No local approval, activation, moderation, or risk decision is created." /> : null}
          {data ? (
            <>
              <dl className="admin-facts">
                <Fact label="Review reference" value={data.reviewReference} />
                <Fact label="Supplier" value={data.supplierContextProjectionText} />
                <Fact label="Creator" value={data.creatorContextProjectionText ?? 'Creator context projection unavailable'} />
                <Fact label="Category" value={data.categoryTaxonomyProjectionText} />
                <Fact label="Submitted price" value={`${data.priceSubmittedProjectionText}. UI does not confirm price truth.`} />
                <Fact label="Submitted stock" value={`${data.stockSubmittedProjectionText}. UI does not confirm stock truth.`} />
              </dl>
              <DetailFields data={data} />
              <AuditEvidencePanel data={data.auditEvidence} />
            </>
          ) : null}
        </section>
      </div>
      <AdminActionPanel detail={data} />
    </section>
  );
}

function DetailFields({ data }: { data: AdminProductApprovalDetailProjection }) {
  return (
    <>
      <section className="admin-subpanel" aria-labelledby="submitted-fields-title">
        <h3 id="submitted-fields-title">Submitted fields projection</h3>
        <dl className="admin-facts">
          {data.submittedFields.map((field) => <Fact key={field.label} label={field.label} value={field.valueProjectionText} />)}
        </dl>
      </section>
      <section className="admin-subpanel" aria-labelledby="media-assets-title">
        <h3 id="media-assets-title">Media and assets projection</h3>
        <div className="admin-list" role="list" aria-label="Media asset projections">
          {data.media.map((media) => (
            <article className="admin-mini-item" role="listitem" key={media.mediaId}>
              <strong>{media.label}</strong>
              <span>{media.statusProjectionText}. Raw provider payload is not exposed.</span>
            </article>
          ))}
        </div>
      </section>
      <section className="admin-subpanel" aria-labelledby="approval-checklist-title">
        <h3 id="approval-checklist-title">Approval checklist projection</h3>
        <div className="admin-list" role="list" aria-label="Approval checklist projections">
          {data.checklist.map((item) => (
            <article className="admin-mini-item" role="listitem" key={item.checklistId}>
              <strong>{item.label}</strong>
              <span>{item.statusProjectionText}. Owner decision truth is not produced by UI.</span>
              {item.requiredEvidenceProjectionText ? <span role="status">{item.requiredEvidenceProjectionText}</span> : null}
            </article>
          ))}
        </div>
      </section>
      <section className="admin-subpanel" aria-labelledby="risk-moderation-title">
        <h3 id="risk-moderation-title">Risk and moderation signals</h3>
        <p>{data.riskSignalProjectionText}. Risk signal does not clear or reject this product.</p>
        <p>{data.moderationSignalProjectionText}. Moderation flag is not final moderation decision.</p>
      </section>
    </>
  );
}

function AuditEvidencePanel({ data }: { data: AdminProductApprovalDetailProjection['auditEvidence'] }) {
  return (
    <section className="admin-subpanel" aria-labelledby="audit-evidence-title">
      <span className="placeholder-label">Audit/evidence foundation</span>
      <h3 id="audit-evidence-title">Audit and evidence visibility</h3>
      {data.missingEvidenceWarnings.length > 0 ? (
        <div className="admin-warning" role="status">
          {data.missingEvidenceWarnings.join(' ')}
        </div>
      ) : null}
      <dl className="admin-facts">
        <Fact label="Required evidence" value={data.requiredEvidence.join(', ') || 'No required evidence projection returned'} />
        <Fact label="Audit trail preview" value={data.auditTrailPreview.join(' | ') || 'Audit trail projection unavailable'} />
        <Fact label="Actor/reason" value={data.actorReasonPlaceholderText} />
      </dl>
      <p>Audit visible does not mean audit owner mutation. Evidence visibility does not upload or mutate evidence.</p>
    </section>
  );
}

function AdminActionPanel({ detail }: { detail?: AdminProductApprovalDetailProjection }) {
  const [handoffStatus, setHandoffStatus] = useState<AdminOwnerHandoffStatus | 'SUBMITTING' | 'IDLE'>('IDLE');

  async function handleAction(actionType: 'APPROVE_PRODUCT_HANDOFF' | 'REJECT_PRODUCT_HANDOFF' | 'REQUEST_REVISION_HANDOFF' | 'REQUIRE_EVIDENCE_HANDOFF') {
    if (!detail) return;
    setHandoffStatus('SUBMITTING');

    const res = await executeAdminProtectedAction({
      actorId: 'client-actor',
      actorRole: 'admin',
      actionType,
      targetType: 'product',
      targetId: detail.productId,
      reasonCode: actionType === 'APPROVE_PRODUCT_HANDOFF' ? '' : 'MANUAL_REVIEW',
      correlationId: `ui-${Date.now()}`,
      idempotencyKey: `idem-${Date.now()}`,
      requestedAt: new Date().toISOString(),
    });

    setHandoffStatus(res.handoffStatus);
  }

  return (
    <aside className="admin-actions" aria-labelledby="admin-actions-title">
      <span className="placeholder-label">Owner command handoff</span>
      <h2 id="admin-actions-title">Review actions</h2>
      
      {handoffStatus !== 'IDLE' && (
        <div className="admin-warning" role="status">
          Handoff status: {handoffStatus}
        </div>
      )}

      <button type="button" onClick={() => handleAction('APPROVE_PRODUCT_HANDOFF')} disabled>
        {detail?.actionHandoff.approvePlaceholderText ?? 'Approve handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REJECT_PRODUCT_HANDOFF')} disabled>
        {detail?.actionHandoff.rejectPlaceholderText ?? 'Reject handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REQUEST_REVISION_HANDOFF')} disabled>
        {detail?.actionHandoff.requestRevisionPlaceholderText ?? 'Request revision handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REQUIRE_EVIDENCE_HANDOFF')} disabled>
        {detail?.actionHandoff.requireEvidencePlaceholderText ?? 'Require evidence handoff'}
      </button>
      <p>UI only shows intent command placeholders. Owner approval, rejection, revision, evidence requirement, audit write, and owner state mutation are not executed here.</p>
      <p>Admin reviewed is not owner state mutated. Product approved is not product active or sellable.</p>
    </aside>
  );
}

function AdminStateReview() {
  return (
    <section className="state-grid" aria-labelledby="admin-state-review-title">
      <div className="section-heading">
        <span className="placeholder-label">State handling</span>
        <h2 id="admin-state-review-title">Admin empty, error, and degraded states</h2>
      </div>
      <div className="grid two">
        <EmptyState title="Admin unavailable" description="Rendered without local admin authority, permission, or owner truth." />
        <EmptyState title="Queue empty" description="Rendered without creating approval, activation, moderation, or risk fallback truth." />
        <DegradedState title="Risk signal degraded" description="Rendered as signal text only; no clearance or rejection decision is inferred." />
        <DegradedState title="Missing evidence projection" description="Rendered as audit/evidence warning only; no evidence owner mutation is performed." />
      </div>
    </section>
  );
}

function AdminProjectionNotice({ projection, isError, retry }: { projection?: PublicProjectionEnvelope<unknown>; isError: boolean; retry: () => void }) {
  if (isError) {
    return <ErrorState title="Admin projection read failed" description="Read transport failed. No approval, activation, moderation, risk, audit, or owner truth is inferred locally." action={<button className="shell-action" type="button" onClick={retry}>Retry</button>} />;
  }

  if (!projection) {
    return <DegradedState title="Admin projection unavailable" description="Projection read has not returned transport state yet." />;
  }

  if (projection.transport.status === 'available') {
    return null;
  }

  if (projection.transport.status === 'empty') {
    return <EmptyState title="Admin projection returned empty" description="No local approval, activation, moderation, risk, audit, or owner fallback truth is generated." />;
  }

  const message = projection.transport.error?.message ?? `Admin projection transport state: ${projection.transport.status}.`;
  return <DegradedState title={projection.transport.status === 'timeout' ? 'Admin projection timeout' : 'Degraded admin projection'} description={message} action={projection.transport.retryable ? <button className="shell-action" type="button" onClick={retry}>Retry</button> : undefined} />;
}

function SummaryCard({ title, value, href }: { title: string; value: string; href?: string }) {
  const content = (
    <>
      <span>{title}</span>
      <strong>{value}</strong>
    </>
  );

  if (href) {
    return <Link className="admin-summary-card" href={href}>{content}</Link>;
  }

  return <div className="admin-summary-card">{content}</div>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
