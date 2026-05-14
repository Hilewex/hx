'use client';

import type {
  PublicProjectionEnvelope,
  SupplierDashboardProjection,
  SupplierOrdersProjection,
  SupplierOrderProjectionItem,
  SupplierProductsProjection,
  SupplierProductProjectionItem,
  SupplierShipmentsProjection,
  SupplierShipmentProjectionItem,
  SupplierSupportProjection,
  SupplierSupportProjectionItem,
} from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  readSupplierDashboardProjection,
  readSupplierOrdersProjection,
  readSupplierProductsProjection,
  readSupplierShipmentsProjection,
  readSupplierSupportProjection,
} from '../lib/bff/supplier';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

type SupplierSurface = 'dashboard' | 'products' | 'orders' | 'shipments' | 'support';

export function SupplierManagementSurface({ surface }: { surface: SupplierSurface }) {
  const query = useQuery({
    queryKey: projectionQueryKeys.supplier(surface),
    queryFn: (): Promise<PublicProjectionEnvelope<unknown>> => readSurfaceProjection(surface),
    staleTime: 20_000,
  });

  return (
    <div className="page-stack supplier-page">
      <SupplierRouteTitle surface={surface} />
      <SupplierScopeGuidance />
      {query.isLoading ? <LoadingState title="Loading supplier projection" description="Waiting for BFF read data." /> : null}
      <SupplierProjectionNotice projection={query.data} isError={query.isError} retry={() => void query.refetch()} />
      {surface === 'dashboard' ? <SupplierDashboard projection={query.data as PublicProjectionEnvelope<SupplierDashboardProjection> | undefined} /> : null}
      {surface === 'products' ? <SupplierProductsPanel projection={query.data as PublicProjectionEnvelope<SupplierProductsProjection> | undefined} /> : null}
      {surface === 'orders' ? <SupplierOrdersPanel projection={query.data as PublicProjectionEnvelope<SupplierOrdersProjection> | undefined} /> : null}
      {surface === 'shipments' ? <SupplierShipmentsPanel projection={query.data as PublicProjectionEnvelope<SupplierShipmentsProjection> | undefined} /> : null}
      {surface === 'support' ? <SupplierSupportPanel projection={query.data as PublicProjectionEnvelope<SupplierSupportProjection> | undefined} /> : null}
      <SupplierStateReview />
    </div>
  );
}

function readSurfaceProjection(surface: SupplierSurface): Promise<PublicProjectionEnvelope<unknown>> {
  switch (surface) {
    case 'products':
      return readSupplierProductsProjection();
    case 'orders':
      return readSupplierOrdersProjection();
    case 'shipments':
      return readSupplierShipmentsProjection();
    case 'support':
      return readSupplierSupportProjection();
    case 'dashboard':
    default:
      return readSupplierDashboardProjection();
  }
}

function SupplierRouteTitle({ surface }: { surface: SupplierSurface }) {
  const title =
    surface === 'dashboard'
      ? 'Supplier panel'
      : surface === 'products'
        ? 'Supplier products'
        : surface === 'orders'
          ? 'Supplier orders'
          : surface === 'shipments'
            ? 'Supplier shipments'
            : 'Supplier support';

  return (
    <section className="route-title">
      <span className="placeholder-label">Supplier projection surface</span>
      <h1>{title}</h1>
      <p>Supplier authenticated is not stock, price, activation, shipment, delivery, or payout truth.</p>
    </section>
  );
}

function SupplierScopeGuidance() {
  return (
    <section className="supplier-guidance" aria-labelledby="supplier-guidance-title">
      <span className="placeholder-label">Scope guidance</span>
      <h2 id="supplier-guidance-title">Supplier scope boundary</h2>
      <ul>
        <li>Bu yuzey projection gosterir; query cache ve projection owner truth degildir.</li>
        <li>Aksiyonlar owner/BFF command ile yurutulur ve panel dogrudan servis yazimi yapmaz.</li>
        <li>Supplier kendi scope'u disina cikamaz; lokal permission engine uretilmez.</li>
        <li>product submitted != product active; stock entered != stock confirmed.</li>
        <li>shipment prepared != shipped; shipped != delivered.</li>
        <li>settled != payable; payable != paid_out.</li>
      </ul>
    </section>
  );
}

function SupplierDashboard({ projection }: { projection?: PublicProjectionEnvelope<SupplierDashboardProjection> }) {
  const data = projection?.data;
  return (
    <section className="supplier-layout" aria-labelledby="supplier-dashboard-title">
      <div className="supplier-main-stack">
        <section className="supplier-panel">
          <span className="placeholder-label">Summary projection</span>
          <h2 id="supplier-dashboard-title">Supplier store summary</h2>
          <dl className="supplier-facts">
            <Fact label="Supplier" value={data?.context.supplierId ?? 'Supplier projection unavailable'} />
            <Fact label="Store" value={data?.context.storeNameProjection ?? 'Store projection unavailable'} />
            <Fact label="Scope" value={data?.context.supplierScopeStatus ?? 'Scope projection unavailable'} />
            <Fact label="Stock warning" value={data?.stockWarningProjectionText ?? 'Stock projection unavailable'} />
          </dl>
        </section>
        <section className="supplier-panel" aria-labelledby="supplier-summary-title">
          <span className="placeholder-label">Operational summaries</span>
          <h2 id="supplier-summary-title">Preparation projections</h2>
          <div className="supplier-card-grid">
            <SummaryCard title="Products" value={`${data?.products.items.length ?? 0} product projections`} href="/supplier/products" />
            <SummaryCard title="Orders" value={`${data?.orders.items.length ?? 0} order preparations`} href="/supplier/orders" />
            <SummaryCard title="Shipments" value={`${data?.shipments.items.length ?? 0} shipment preparations`} href="/supplier/shipments" />
            <SummaryCard title="Support" value={`${data?.support.items.length ?? 0} support previews`} href="/supplier/support" />
          </div>
        </section>
        {data?.degradedStateText ? <DegradedState title="Degraded supplier state" description={data.degradedStateText} /> : null}
      </div>
      <SupplierSideActions />
    </section>
  );
}

function SupplierProductsPanel({ projection }: { projection?: PublicProjectionEnvelope<SupplierProductsProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="supplier-layout" aria-labelledby="supplier-products-title">
      <div className="supplier-main-stack">
        <section className="supplier-panel">
          <span className="placeholder-label">Product intake projection</span>
          <h2 id="supplier-products-title">Supplier product list projection</h2>
          {items.length === 0 ? (
            <EmptyState title="Supplier products empty" description="No stock, price, activation, or intake fallback truth is created locally." />
          ) : (
            <div className="supplier-list" role="list" aria-label="Supplier product projections">
              {items.map((item) => <SupplierProductItem item={item} key={item.supplierProductId} />)}
            </div>
          )}
        </section>
      </div>
      <SupplierSideActions />
    </section>
  );
}

function SupplierProductItem({ item }: { item: SupplierProductProjectionItem }) {
  return (
    <article className="supplier-list-item" role="listitem" data-status={item.intakeStatusProjection}>
      <div className="supplier-item-media" aria-hidden="true">Product</div>
      <div>
        <h3>{item.title}</h3>
        <p className="supplier-status">Intake: {item.intakeStatusProjection}. Product submitted does not mean product active.</p>
        <p>{item.reviewStatusProjection}. {item.moderationProjectionText}</p>
        <p>{item.stockProjectionText}. Stock entered does not mean stock confirmed.</p>
        <p>{item.priceProjectionText}. UI does not confirm price truth.</p>
      </div>
    </article>
  );
}

function SupplierOrdersPanel({ projection }: { projection?: PublicProjectionEnvelope<SupplierOrdersProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="supplier-layout" aria-labelledby="supplier-orders-title">
      <div className="supplier-main-stack">
        <section className="supplier-panel">
          <span className="placeholder-label">Order preparation projection</span>
          <h2 id="supplier-orders-title">Order preparation list</h2>
          {items.length === 0 ? (
            <EmptyState title="Supplier orders empty" description="No local order readiness, shipment, delivery, or support truth is inferred." />
          ) : (
            <div className="supplier-list" role="list" aria-label="Supplier order preparation projections">
              {items.map((item) => <SupplierOrderItem item={item} key={item.orderId} />)}
            </div>
          )}
        </section>
      </div>
      <SupplierSideActions />
    </section>
  );
}

function SupplierOrderItem({ item }: { item: SupplierOrderProjectionItem }) {
  return (
    <article className="supplier-list-item" role="listitem" data-status={item.preparationStateProjection}>
      <div className="supplier-item-media" aria-hidden="true">Order</div>
      <div>
        <h3>{item.orderReference}</h3>
        <p>{item.productTitle} - {item.quantityProjectionText}</p>
        <p className="supplier-status">Preparation: {item.preparationStateProjection}. {item.readinessProjectionText}</p>
        <p>{item.shipmentPreparationProjectionText}. Shipment prepared does not mean shipped.</p>
        <p>{item.supportProjectionText}</p>
      </div>
    </article>
  );
}

function SupplierShipmentsPanel({ projection }: { projection?: PublicProjectionEnvelope<SupplierShipmentsProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="supplier-layout" aria-labelledby="supplier-shipments-title">
      <div className="supplier-main-stack">
        <section className="supplier-panel">
          <span className="placeholder-label">Shipment preparation projection</span>
          <h2 id="supplier-shipments-title">Shipment projection list</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded shipment state" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Supplier shipments empty" description="No guaranteed shipment, tracking, or delivery state is generated locally." />
          ) : (
            <div className="supplier-list" role="list" aria-label="Supplier shipment projections">
              {items.map((item) => <SupplierShipmentItem item={item} key={item.shipmentId} />)}
            </div>
          )}
        </section>
      </div>
      <SupplierSideActions />
    </section>
  );
}

function SupplierShipmentItem({ item }: { item: SupplierShipmentProjectionItem }) {
  return (
    <article className="supplier-list-item" role="listitem" data-status={item.preparationStateProjection}>
      <div className="supplier-item-media" aria-hidden="true">Ship</div>
      <div>
        <h3>{item.orderReference}</h3>
        <p className="supplier-status">Preparation: {item.preparationStateProjection}. Shipment prepared does not mean shipped.</p>
        <p>{item.carrierProjectionText}</p>
        <p>{item.trackingProjectionText}. Shipped does not mean delivered.</p>
        {item.degradedStateText ? <p role="status">{item.degradedStateText}</p> : null}
      </div>
    </article>
  );
}

function SupplierSupportPanel({ projection }: { projection?: PublicProjectionEnvelope<SupplierSupportProjection> }) {
  const items = projection?.data?.items ?? [];
  return (
    <section className="supplier-layout" aria-labelledby="supplier-support-title">
      <div className="supplier-main-stack">
        <section className="supplier-panel">
          <span className="placeholder-label">Support and dispute projection</span>
          <h2 id="supplier-support-title">Support and dispute preview</h2>
          {projection?.data?.degradedStateText ? <DegradedState title="Degraded support state" description={projection.data.degradedStateText} /> : null}
          {items.length === 0 ? (
            <EmptyState title="Supplier support empty" description="No local moderation, fraud, resolution, or dispute decision is exposed." />
          ) : (
            <div className="supplier-list" role="list" aria-label="Supplier support projections">
              {items.map((item) => <SupplierSupportItem item={item} key={item.ticketId} />)}
            </div>
          )}
        </section>
      </div>
      <SupplierSideActions />
    </section>
  );
}

function SupplierSupportItem({ item }: { item: SupplierSupportProjectionItem }) {
  return (
    <article className="supplier-list-item" role="listitem" data-status={item.statusProjection}>
      <div className="supplier-item-media" aria-hidden="true">Help</div>
      <div>
        <h3>{item.ticketId}</h3>
        <p className="supplier-status">Status: {item.statusProjection}</p>
        <p>{item.orderReference ? `Order projection: ${item.orderReference}. ` : ''}{item.guidanceText}</p>
        <p>{item.escalationProjectionText}. Escalation guidance is not a moderation or fraud decision.</p>
      </div>
    </article>
  );
}

function SupplierSideActions() {
  return (
    <aside className="supplier-actions" aria-labelledby="supplier-actions-title">
      <span className="placeholder-label">Owner command handoff</span>
      <h2 id="supplier-actions-title">Actions</h2>
      <button type="button" disabled>Upload product placeholder</button>
      <button type="button" disabled>Update stock placeholder</button>
      <button type="button" disabled>Prepare shipment placeholder</button>
      <button type="button" disabled>Open support placeholder</button>
      <p>Buttons are disabled placeholders. They do not activate products, confirm stock or price, ship, deliver, settle, make payable, or pay out.</p>
    </aside>
  );
}

function SupplierStateReview() {
  return (
    <section className="state-grid" aria-labelledby="supplier-state-review-title">
      <div className="section-heading">
        <span className="placeholder-label">State handling</span>
        <h2 id="supplier-state-review-title">Supplier empty, error, and degraded states</h2>
      </div>
      <div className="grid two">
        <EmptyState title="Supplier unavailable" description="Rendered without creating supplier ownership or permission truth." />
        <EmptyState title="Empty products or orders" description="Rendered without creating product, stock, order readiness, or shipment fallback truth." />
        <DegradedState title="Stock projection unavailable" description="Rendered as warning text only; stock entered is not stock confirmed." />
        <DegradedState title="Support degraded" description="Rendered without exposing fraud, risk, moderation, or private customer internals." />
      </div>
    </section>
  );
}

function SupplierProjectionNotice({ projection, isError, retry }: { projection?: PublicProjectionEnvelope<unknown>; isError: boolean; retry: () => void }) {
  if (isError) {
    return <ErrorState title="Supplier projection read failed" description="Read transport failed. No supplier stock, price, shipment, delivery, or payout truth is inferred locally." action={<button className="shell-action" type="button" onClick={retry}>Retry</button>} />;
  }

  if (!projection) {
    return <DegradedState title="Supplier projection unavailable" description="Projection read has not returned transport state yet." />;
  }

  if (projection.transport.status === 'available') {
    return null;
  }

  if (projection.transport.status === 'empty') {
    return <EmptyState title="Supplier projection returned empty" description="No local product, stock, order, shipment, support, or payout replacement truth is generated." />;
  }

  const message = projection.transport.error?.message ?? `Supplier projection transport state: ${projection.transport.status}.`;
  return <DegradedState title={projection.transport.status === 'timeout' ? 'Supplier projection timeout' : 'Degraded supplier projection'} description={message} action={projection.transport.retryable ? <button className="shell-action" type="button" onClick={retry}>Retry</button> : undefined} />;
}

function SummaryCard({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link className="supplier-summary-card" href={href}>
      <span>{title}</span>
      <strong>{value}</strong>
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
