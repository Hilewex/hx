'use client';

import type { CartLineItemProjection, CartSurfaceProjection } from '@hx/contracts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { readCartProjection } from '../lib/bff/cart';
import { projectionQueryKeys } from '../lib/bff/query-keys';
import { DegradedState } from './degraded-state';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export function CartSurface() {
  const query = useQuery({
    queryKey: projectionQueryKeys.cart(),
    queryFn: readCartProjection,
    retry: 1,
    staleTime: 10_000,
  });

  if (query.isLoading) {
    return (
      <main className="page-stack cart-page">
        <LoadingState title="Loading cart projection" description="Waiting for BFF-owned cart read projection." />
        <CartSkeleton />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="page-stack cart-page">
        <ErrorState title="Cart projection failed" description="The cart surface could not read BFF projection state." />
      </main>
    );
  }

  if (!query.data?.data) {
    return (
      <main className="page-stack cart-page">
        <DegradedState
          title={query.data?.transport.status === 'timeout' ? 'Cart read timeout' : 'Cart unavailable'}
          description={query.data?.transport.error?.message ?? 'The cart read is unavailable. The browser does not synthesize cart truth.'}
          action={query.data?.transport.retryable ? <button className="shell-action" type="button" onClick={() => void query.refetch()}>Retry</button> : undefined}
        />
      </main>
    );
  }

  return <CartContent cart={query.data.data} retry={() => void query.refetch()} />;
}

function CartContent({ cart, retry }: { cart: CartSurfaceProjection; retry: () => void }) {
  const isDegraded = cart.status !== 'available' && cart.status !== 'empty';

  return (
    <main className="page-stack cart-page">
      <header className="route-title">
        <span className="placeholder-label">Cart projection</span>
        <h1>Your cart</h1>
        <p>{cart.context.actorLabel}. Price, stock, coupon, checkout, payment, and order truth stay with their owners.</p>
      </header>

      {isDegraded ? (
        <DegradedState
          title="Degraded cart projection"
          description="One or more cart sections are partial or stale by projection warning. This surface only displays owner-provided warnings."
          action={<button className="shell-action" type="button" onClick={retry}>Retry</button>}
        />
      ) : null}

      {cart.lines.length === 0 ? (
        <EmptyCartState />
      ) : (
        <section className="cart-layout" aria-labelledby="cart-lines-title">
          <div className="cart-lines-panel">
            <div className="section-heading">
              <span className="placeholder-label">Line items</span>
              <h2 id="cart-lines-title">Cart line projections</h2>
            </div>
            <div className="cart-line-list" role="list" aria-label="Cart line item projections">
              {cart.lines.map((line) => (
                <CartLineItem line={line} key={line.lineId} />
              ))}
            </div>
          </div>
          <CartSummary cart={cart} />
        </section>
      )}
    </main>
  );
}

function EmptyCartState() {
  return (
    <section className="cart-empty" aria-labelledby="empty-cart-title">
      <EmptyState title="Your cart is empty" description="No cart line projection was returned for this cart context." />
      <nav className="cart-empty-actions" aria-label="Cart discovery links">
        <Link className="state-action" href="/search">Search products</Link>
        <Link className="state-action secondary" href="/category">Browse categories</Link>
        <Link className="state-action secondary" href="/store/studio-preview">Visit storefront</Link>
      </nav>
    </section>
  );
}

function CartLineItem({ line }: { line: CartLineItemProjection }) {
  return (
    <article className="cart-line" role="listitem" aria-labelledby={`cart-line-${line.lineId}`}>
      <div className="cart-line-media" data-status={line.media.status}>
        {line.media.url ? <img src={line.media.url} alt={line.media.alt} /> : <span aria-hidden="true">Media</span>}
      </div>
      <div className="cart-line-copy">
        <div>
          <span className="placeholder-label">Item projection</span>
          <h3 id={`cart-line-${line.lineId}`}>{line.title}</h3>
          <p>{line.creatorStoreText}</p>
        </div>
        <div className="cart-line-facts" aria-label={`${line.title} safe cart facts`}>
          <span>{line.quantityText}</span>
          <span>{line.safePriceText}</span>
        </div>
        <QuantityFoundation line={line} />
        {line.warningText ? (
          <p className="cart-warning" role="status" aria-label={`Cart line warning: ${line.warningText}`}>
            {line.warningText}
          </p>
        ) : null}
        <div className="cart-line-actions" aria-label={`${line.title} action placeholders`}>
          <button type="button" aria-label={`Update ${line.title} placeholder`}>Update</button>
          <button type="button" aria-label={`Remove ${line.title} placeholder`}>Remove</button>
        </div>
      </div>
    </article>
  );
}

function QuantityFoundation({ line }: { line: CartLineItemProjection }) {
  return (
    <section className="quantity-foundation" aria-label={`${line.title} quantity projection`}>
      <span>{line.quantityText}</span>
      <button type="button" aria-label={`Decrease ${line.title} quantity placeholder`}>-</button>
      <button type="button" aria-label={`Increase ${line.title} quantity placeholder`}>+</button>
      <small>{line.actionPlaceholderText}</small>
    </section>
  );
}

function CartSummary({ cart }: { cart: CartSurfaceProjection }) {
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title">
      <div className="section-heading">
        <span className="placeholder-label">Summary projection</span>
        <h2 id="cart-summary-title">Cart summary</h2>
      </div>
      <dl>
        <div>
          <dt>Items</dt>
          <dd>{cart.summary.itemCountText}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd>{cart.summary.safeSubtotalText}</dd>
        </div>
      </dl>
      <section className="coupon-placeholder" aria-labelledby="coupon-title">
        <label htmlFor="coupon-code" id="coupon-title">Coupon</label>
        <div>
          <input id="coupon-code" name="coupon-code" placeholder="Coupon code" disabled />
          <button type="button" disabled>Validate later</button>
        </div>
        <p>{cart.summary.couponPlaceholderText}</p>
      </section>
      <section className="checkout-handoff" aria-labelledby="checkout-handoff-title" data-status={cart.checkoutHandoff.status}>
        <h3 id="checkout-handoff-title">Checkout handoff</h3>
        <p>{cart.checkoutHandoff.helperText}</p>
        <Link className="state-action" href="/checkout" aria-label="Checkout validation handoff placeholder">
          {cart.checkoutHandoff.ctaText}
        </Link>
      </section>
    </aside>
  );
}

function CartSkeleton() {
  return (
    <section className="cart-layout" aria-label="Cart loading skeleton">
      <div className="cart-lines-panel">
        <div className="cart-line">
          <div className="cart-line-media" data-status="loading"><span>Media</span></div>
          <div className="cart-line-copy">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
          </div>
        </div>
      </div>
      <aside className="cart-summary">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </aside>
    </section>
  );
}
