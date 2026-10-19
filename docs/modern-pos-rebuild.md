# Modern POS rebuild

## Product direction

Build a fast, keyboard-friendly retail workspace with a clear cashier checkout, dependable inventory operations, useful reporting, and role-aware access. Keep the existing Ghana cedi context and preserve transaction and stock history during each migration.

## Existing foundation

- React/Vite client and Express/PostgreSQL API.
- Password hashing, server sessions, account deactivation, password reset/change flow, and owner/manager/cashier roles.
- API permission middleware and store-scoped access checks.
- Cash checkout with server price/stock verification, idempotency, held orders, receipt output, customer attachment, and stock movement recording.
- Product catalog, categories, suppliers, customers, sales history, multi-store records, team management, and dashboard reporting.
- The client is in `apps/web`; a large module (`apps/web/src/POS.jsx`) still owns app state, API calls, demo mode, permissions, checkout, and most page rendering.
- The Express API is in `apps/api/src`. `shared/src` contains typed permission and GHS minor-unit contracts; the rest of the client and API still use JavaScript.

## Target structure

```text
apps/
  web/
    src/             app shell and feature-oriented React client
  api/
    src/             NestJS modules, guards, services, and database access (target)
shared/
  src/               typed roles, money, identifiers, and API contracts
```

The current API remains Express until its behavior is covered by migration tests. The database is still initialized at API startup; Prisma migrations are a later step.

## Modern operating workflows

1. **Checkout:** barcode scanner input, instant product search, keyboard-first cart, customer lookup, cash/card/mobile-money/split tender, suspend/resume, receipt print/share, and explicit payment status.
2. **Inventory:** purchase orders and receiving, supplier costs, stock adjustments with reason, transfers, cycle counts, reorder suggestions, batch/expiry tracking where relevant, and a searchable stock movement ledger.
3. **Sales service:** refunds and exchanges linked to the original receipt, configurable refund tender, clear approval thresholds, and stock disposition on returns.
4. **Customer operations:** searchable profiles, consent-aware contact details, purchase history, store credit/loyalty as optional modules.
5. **Operations:** multi-store dashboard, cashier shift open/close and cash reconciliation, low-stock tasks, sales and margin reports, export, and audit history for sensitive business actions.

## Authentication and authorization

- Retain server-side sessions and password hashing; centralize session lifecycle and account state checks.
- Define named capabilities (for example `sales.refund`, `inventory.receive`, `reports.margin`, `staff.manage`) and map roles to capabilities. Keep authorization enforced by the API; the client only reflects allowed actions.
- Scope every business query to the selected store and the user's assigned stores. Require explicit owner/manager approval for refunds, price overrides, and stock corrections above configured limits.
- Add audit events for sign-in failures, staff/role changes, refunds, tender changes, and inventory corrections.
- Add staff PIN unlock as an optional register convenience while retaining full account authentication for sign-in and sensitive actions.

## Delivery sequence

1. **Foundation:** capture current behavior, establish workspace packages and typed shared permissions/money helpers, then split the POS monolith by feature without changing behavior. Versioned database migrations and the NestJS API remain outstanding.
2. **Core operations:** finish scanner-first checkout and tender abstractions; add shifts, purchase receiving, stock ledger views, returns/exchanges, and approval rules.
3. **Access and reliability:** capability-based access, audit events, session hardening, offline-safe catalog/cart with an explicit queued-sale reconciliation flow.
4. **Insights and rollout:** operational reports, exports, accessibility and responsive polish, migration rehearsals, and staged deployment.

## Decisions to confirm before integrating external services

- Payment integrations: mobile money providers and card processor, including whether Paystack should be enabled.
- Tax and receipt requirements for the operating jurisdictions.
- Whether offline sales may be accepted when the server cannot confirm stock, and what reconciliation policy should apply.
- Refund destinations, approval limits, loyalty/store-credit rules, and staff PIN policy.

No existing records should be discarded as part of the rebuild. Each schema change must be additive or have a reviewed migration and rollback plan.
