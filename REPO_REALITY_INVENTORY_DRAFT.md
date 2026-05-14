# Repo Reality Inventory Draft

## 1. Repository Type
- **Monorepo or not**: Yes, Monorepo.
- **Package manager**: pnpm (pnpm-workspace.yaml implied, package.json uses pnpm in scripts).
- **Main runtime**: Node.js / TypeScript (tsx used for execution).
- **Frameworks detected**: Next.js (in `apps/web`), React (implied by Next.js and `.tsx` files in web).

## 2. Top-Level Structure
- `apps/`: Contains frontend and aggregation layer applications (web, panel, bff).
- `services/`: Contains domain-specific backend services/modules.
- `packages/`: Contains shared libraries, contracts, configuration, persistence, and UI components.
- `docs/`: Documentation, runbooks, standards.
- `infra/`: Infrastructure files.
- `tests/`: Smoke tests and other end-to-end tests.
- `Root_Phase_Executions/` & `kontrol v1/`: Project management and phase reporting artifacts.

## 3. Apps
- **`@hx/web`**
  - **path**: `apps/web/`
  - **likely purpose**: Main consumer facing frontend application (and some supplier/admin UI routes).
  - **framework**: Next.js (App Router detected by `app/layout.tsx`, `page.tsx`).
  - **important routes/pages**: `/admin/*`, `/cart`, `/checkout`, `/creator/*`, `/order/*`, `/supplier/*`, `/support/*`.
  - **critical business areas**: Checkout, Admin Panel, Creator Portal, Supplier Portal, Order Tracking, Search, Return/Support.
- **`@hx/panel`**
  - **path**: `apps/panel/`
  - **likely purpose**: Standalone internal admin/operations panel API or app.
  - **framework**: Node.js/TypeScript
  - **important routes/pages**: Internal bootstrap files (`bootstrap/access.ts`, `bootstrap/actions.ts`, `bootstrap/auth.ts`, `bootstrap/customer.ts`).
- **`@hx/bff`**
  - **path**: `apps/bff/`
  - **likely purpose**: Backend-For-Frontend serving tailored API responses and orchestrating service calls for the web application.
  - **framework**: Node.js/TypeScript
  - **important routes/pages**: `server/*.ts` defining endpoints for domains like `checkout`, `cart`, `catalog`, `finance-ledger`, `moderation`, `order`, `payment`, `refund`.

## 4. Services
Extensive domain services detected under `services/`:
- **Admin**: `services/admin/` - Administrative operations.
- **Analytics**: `services/analytics/` - Data analytics.
- **Auth**: `services/auth/` - Authentication.
- **Commerce**: `services/commerce/`, `services/catalog/`, `services/category/`, `services/checkout/`, `services/order/`, `services/order-ops/` - Core e-commerce logic, checkout, orders.
- **Finance**: `services/finance/`, `services/finance-correction/`, `services/payment/`, `services/payout/`, `services/pricing/`, `services/refund/`, `services/settlement/` - Money movement, ledgers, corrections.
- **Customer/Social**: `services/customer/`, `services/customer-reward/`, `services/customer-social/`, `services/creator-management/`, `services/follow/`, `services/interaction/`, `services/post/`, `services/story/`, `services/ugc/` - Social network integration and user management.
- **Trust & Safety**: `services/fraud/`, `services/moderation/`, `services/risk/` - System integrity.
- **Operations**: `services/media/`, `services/notification/`, `services/operational-outbox/`, `services/provider-callback/` - Infrastructure workflows and third-party integrations.

## 5. Packages
Shared libraries under `packages/`:
- **`config`**: Shared configuration settings.
- **`contracts`**: Domain interfaces, shared types, API definitions (`access.ts`, `order.ts`, `payment.ts`, etc.).
- **`events`**: Event schema and envelope definitions (`envelope.ts`).
- **`observability`**: Logging and tracing (`logger.ts`, `tracer.ts`).
- **`persistence`**: Database schemas, migrations, and shared data access (`run-migrations.ts`, `verify-schema.ts`, `audit-event.ts`, `finance-ledger.ts`).
- **`shared-kernel`**: Core primitives and error definitions (`errors.ts`).
- **`testing`**: Test utilities and data builders (`builders.ts`).
- **`types`**: Additional shared global types.
- **`ui`**: Shared UI components for frontend apps.

## 6. Database Layer
- **ORM or query layer**: Native Postgres client or lightweight query builder (seen `repository/postgres.ts` and `repository/in-memory.ts` implementations across services).
- **schema files**: Defined inside `packages/persistence/src/` (e.g., `audit-event.ts`, `finance-ledger.ts`, `provider-callback.ts`).
- **migration files**: Handled via `packages/persistence/run-migrations.ts` and `migrator.ts`.
- **seed files**: Not explicitly visible, potentially handled via smoke test builders or runbooks.
- **tables/entities detected**: `finance-ledger`, `audit-event`, `payment-reconciliation-task`, `provider-callback`, `operational-intent`.

## 7. API Surface
- **public APIs**: Exposed via `apps/bff/src/server/` for storefront (`catalog`, `category`, `search`, `plp`, `story`, `feed`, `ugc`).
- **internal APIs**: Internal boundaries defined in `packages/contracts/`.
- **admin APIs**: Served via `apps/bff/src/server/admin.ts`, `ops-center.ts`.
- **creator panel APIs**: `apps/bff/src/server/creator.ts`.
- **supplier panel APIs**: `apps/bff/src/server/supplier.ts`.
- **support APIs**: `apps/bff/src/server/support.ts`, `customer-support.ts`.

## 8. Workers / Jobs / Events
- **outbox files**: `services/operational-outbox/src/operational-audit-outbox-worker.ts`.
- **workers**: Operational outbox workers, payment reconciliation task processing (`packages/persistence/src/payment-reconciliation-task.ts`).
- **jobs / cron**: Likely orchestrated by external schedulers triggering `tsx tests/smoke/run-smoke.ts` or specific worker scripts.
- **queue processors**: `operational-outbox` acts as the queue/event processor.
- **retry/DLQ logic**: Implied in `operational-outbox` and `provider-callback` replay/freshness guards (seen in package.json scripts).

## 9. Critical Domain Files
- **auth / permission**: `services/auth/`, `packages/contracts/src/auth.ts`, `apps/bff/src/server/guards.ts`.
- **product / pool**: `services/catalog/`, `services/pool/`.
- **pricing**: `services/pricing/`.
- **inventory**: `services/stock/`.
- **cart / checkout**: `services/cart/` (implied), `services/checkout/`, `apps/bff/src/server/checkout.ts`.
- **payment**: `services/payment/`, `apps/bff/src/server/payment.ts`.
- **order**: `services/order/`, `services/order-ops/`.
- **shipment / delivery**: `services/shipment/`.
- **return / refund**: `services/cancel-return/`, `services/refund/`.
- **settlement**: `services/settlement/`.
- **payout**: `services/payout/`.
- **reward / point market**: `services/customer-reward/`.
- **coupon / campaign**: Partially handled in core commerce or custom services.
- **creator store**: `services/creator-management/`, `services/storefront/`.
- **supplier**: `services/supplier-management/`.
- **admin**: `services/admin/`.
- **moderation**: `services/moderation/`.
- **fraud / risk**: `services/fraud/`, `services/risk/`.
- **search / indexing**: `services/search/`.
- **recommendation**: Ranking / feed via `services/ranking/`, `services/feed/` (implied).
- **analytics**: `services/analytics/`.
- **media**: `services/media/`.
- **support ticket**: `services/support/`, `services/question-answer/`.

## 10. Tests / Smoke / Observability
- **unit tests**: Mixed in service directories (e.g. `payout/jest.config.js`).
- **integration tests**: Heavily reliant on extensive smoke test suite.
- **Playwright tests**: `apps/web/playwright.config.ts`.
- **smoke scripts**: Massive smoke test runner in `tests/smoke/run-smoke.ts` covering everything from health, to permissions, to idempotent operations.
- **logging**: `packages/observability/src/logger.ts`.
- **metrics**: Implied through observability package.
- **tracing**: `packages/observability/src/tracer.ts`.
- **audit log files**: `packages/persistence/src/audit-event.ts`.

## 11. Missing or Unclear Areas
- Exact database migration tool or ORM syntax is unclear (whether it is raw SQL, Prisma, Kysely, or TypeORM) just by directory structure.
- Detailed message queue infrastructure (Kafka, RabbitMQ, SQS) vs. Database-backed outbox is unclear (seems DB-backed).
- Deployment and orchestration manifests (e.g., Dockerfiles, Kubernetes yaml, CI/CD pipelines) were not distinctly highlighted in the root.

## 12. Questions for Architect Review
1. Are there specific CI/CD pipeline definitions or infrastructure-as-code files stored elsewhere?
2. Is the Database Outbox pattern the only async messaging implementation, or is an external message broker (like Kafka) utilized in production?
3. Which exact ORM or query builder is being enforced in the `packages/persistence` layer to interact with Postgres?
4. What is the execution environment for workers (e.g., distinct Node processes, serverless functions)?
