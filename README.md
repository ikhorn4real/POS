# Counterpoint

A retail inventory and point-of-sale app using React, Vite, Node.js, Express, and PostgreSQL.

## Local setup

1. Install Node.js 20.19+ (or 22.12+) and Docker Desktop.
2. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell). Set `OWNER_NAME`, `OWNER_EMAIL`, and a private `OWNER_PASSWORD` of at least 12 characters. Generate a unique session secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` and put the result in `SESSION_SECRET`. Do not commit `.env`.
3. Start PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

4. Create the first administrator account. The setup command creates the user table if needed, serializes concurrent setup attempts in PostgreSQL, and refuses to create another administrator:

   ```powershell
   npm run setup:owner
   ```

5. Start the API in one terminal:

   ```powershell
   npm run dev:api
   ```

6. Start the Vite client in another terminal:

   ```powershell
   npm run dev
   ```

   Open the local URL printed by Vite and sign in with `OWNER_EMAIL` and `OWNER_PASSWORD` from `.env`.

The API creates its tables on startup. New stores start with an empty database catalog; the sample products and transactions are available only in the explicitly labelled, browser-local **Explore the local demo** mode. Never use demo mode for real business data.

## Roles

- **Administrator:** overview, checkout, global catalog management, sales, all stores, and team account management. Administrators can add and edit stores.
- **Manager:** the same access as an administrator across all stores, including global catalog and team management. Managers cannot add or edit stores.
- **Cashier:** overview, checkout, read-only inventory, and their own sales only.

Role and store-membership checks are enforced by the API on every protected request; hiding a screen in the client is not used as the security boundary. Administrators can switch among all stores and manage catalog and team accounts across stores. Managers and cashiers are assigned to one store at a time. Managers can create cashier accounts and manage managers and cashiers assigned to their store, and can manage inventory, suppliers, categories, and customers; managers cannot create manager accounts or create/edit store records. Cashiers can access only their assigned store. New accounts and password resets receive a system-generated temporary password that is shown once and can be copied. Users can change their own password from the account menu after entering their current password. Passwords must be at least 8 characters and are hashed with bcrypt.

## Stores

The existing catalog and product details are shared across locations. Stock quantities, reorder levels, stock movements, and sales are tracked separately for each store. Adding a product makes it available in each active store with zero stock outside the store where opening stock was entered. Existing inventory, transactions, and stock history are migrated to the initial **Main Store**.

## Inventory

Products include an automatically generated unique SKU, category, per-store on-hand quantity, cost/selling/wholesale prices in Ghana cedis (GHS), an optional minimum wholesale quantity, per-store reorder level, optional supplier, and optional expiry date. A wholesale quantity of 0 disables tier pricing. Existing products retain standard pricing until a threshold is configured. Existing products retain their current SKUs; an SKU can be edited when editing a product. Administrators and managers can maintain the shared product, supplier, and category catalog; renaming a category updates its products. Managers can adjust stock with a required reason. Stock changes and sales are recorded in the store-specific stock movement ledger. Administrators and managers can view low-stock, expiry, inventory-valuation, and recent-movement reports. Cashiers do not receive cost prices from the API.

## Customers and checkout

All roles can view, add, and edit customer records for their selected store, associate a customer with a sale, and view customer purchase history. Existing customer profiles are assigned to stores with recorded purchases; profiles without sale history are assigned to the initial Main Store during migration. Cashier history is limited to sales made by that cashier. Every transaction is associated with its authenticated staff account; staff names appear in transaction history and receipts and can be searched along with order ID, customer, or payment method. Sales history is paginated, while dashboard sales totals are calculated from store-scoped server aggregates (cashiers see only their own totals). Users can reopen transaction details or reprint a receipt. Checkout currently supports cash payments in GHS; cash received and change are recorded, and a printable receipt is displayed after a completed sale. mobile money, split tender, and Paystack processing are not active. Before payment, checkout validates the server quote and stock; staff must review changed prices or stock, and unavailable products are removed and identified so the remaining order can be reviewed. Sale submissions use a server-side idempotency key so retrying the same request cannot create a duplicate transaction. Idempotency records are retained for 30 days and cleaned up daily. The Complete Sale action is locked while the request is processing. On small screens, a sticky order summary opens the cart and payment controls. In-progress orders can be held and resumed per store, including after a page reload on the same browser, or cancelled before completion.

## Commands

```sh
npm test       # isolated role, session, sales-scope, and owner-lock tests
npm run lint
npm run build
```

`npm run start:api` starts the production API; after `npm run build`, it also serves the built client. Set `NODE_ENV=production`, use HTTPS, a strong `SESSION_SECRET`, a production PostgreSQL connection with TLS where required, and set `WEB_ORIGIN` to the exact public origin. `PGSSL=true` enables TLS verification for PostgreSQL.

The database initialization drops legacy tax breakdown columns when the API starts; stored transaction totals are preserved.

Newly created staff accounts and reset accounts must replace their temporary password before using the workspace. Password changes and account deactivation revoke the account’s other sessions; the session changing its password is renewed. When the single-store assignment migration consolidates legacy memberships, it records the original store IDs in `user_store_assignment_migrations` for review.
