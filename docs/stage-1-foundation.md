# Stage 1: Environment and architecture

## Existing project

The repository already contains a working POS application. Its current implementation is a React 19/Vite 8 client and an Express 5/PostgreSQL API written in JavaScript. It includes store-scoped roles, sessions, products and stock movements, suppliers, customers, cash checkout, idempotent sale submission, and reports. The client is partly feature-organized, with the main application and several workflows still in `apps/web/src/POS.jsx`. The database schema is initialized by the API at startup rather than through versioned migrations.

This is an existing foundation to migrate incrementally. Replacing it with empty applications or moving its source before the new workspace commands work would risk breaking the running product and its history.

## Development environment inspected

| Tool | Result |
| --- | --- |
| Node.js | v24.22.0 is installed; the nvm-managed default was not selected in the shell. |
| npm | 11.19.1 |
| pnpm | 12.14.0, available with the installed Node 24 toolchain. |
| Git | 2.56.0; repository was clean at inspection, on `main` one commit ahead of `origin/main`. |
| Docker | 29.8.2; daemon is available when Docker named-pipe access is permitted. |
| PostgreSQL | No local `psql` client or Windows service was found. Project Compose PostgreSQL 17 is running and healthy on `127.0.0.1:5432`. |

The Node 24 executable is installed under `%LOCALAPPDATA%\Author Software\nvm\installs\v24.22.0`. Add that directory to the current PowerShell process `PATH` to run the installed toolchain without changing the user's global nvm selection:

```powershell
$nodeDir = Join-Path $env:LOCALAPPDATA 'Author Software\nvm\installs\v24.22.0'
$env:PATH = "$nodeDir;$env:PATH"
node --version
pnpm --version
```

Docker commands may require a shell with permission to access the Docker named pipe. The database is already running; no database restart or reset is needed for this foundation stage.

## Stage 1 implementation

- Pin the repository's package manager to the available pnpm release and declare a supported Node runtime in the root manifest.
- Move the existing Vite client and static assets to `apps/web`, and the existing Express API and bootstrap command to `apps/api`. Each package now declares its own runtime/build dependencies; the root package holds workspace tooling and test/lint commands.
- Keep shared permissions and money helpers in the `shared` workspace package and consume them through `@counterpoint/shared` from both apps. Permission declarations restrict capabilities by role; GHS parsing and arithmetic use safe integer minor units. The POS uses the shared formatter for display. Vite and the API explicitly load the root `.env` after the move, and the API serves the client build from `apps/web/dist`.
- Add a strict TypeScript 6 configuration and compile the shared package before tests, web builds/dev, and API startup. The existing app files and API business layer remain JavaScript for gradual migration.
- Import dependency versions into `pnpm-lock.yaml`, synchronize the four workspace projects with a frozen lockfile, and remove the obsolete npm lockfile. pnpm is the package manager for the workspace.

## Migration plan

1. Apply the shared `MinorUnits` type to checkout, product pricing, and API DTOs so integer cents stay authoritative end to end.
2. Add TypeScript incrementally to the React client and extract the app shell from `apps/web/src/POS.jsx`.
3. Migrate the API in `apps/api` to NestJS and TypeScript, then introduce Prisma and versioned migrations with data-preserving migration and rollback steps before replacing startup schema initialization.
4. Add PostgreSQL integration coverage and prove sale, stock, payment, authorization, and idempotency invariants before expanding business workflows.

The implementation must preserve the existing database and transaction history. Checkout currently accepts cash only; electronic payment confirmation, refunds, purchasing, transfers, accounting, and offline synchronization remain future work. See [README.md](../README.md) and [modern-pos-rebuild.md](./modern-pos-rebuild.md) for current behavior and product direction.

## Baseline verification

Using the installed Node 24.22.0 and pnpm 12.14.0 toolchain:

- `pnpm install --frozen-lockfile`: all four workspace projects synchronized successfully.
- `pnpm test`: 27 passed, 0 failed; includes GHS parsing, integer arithmetic, formatting, and role-specific type checks.
- `pnpm run typecheck`: strict TypeScript checks passed.
- `pnpm run lint`: completed with 16 existing warnings and no errors.
- The Vite 8.3.0 production build succeeded using the installed Node 24 executable directly.
- Started the API and Vite client; `/api/health` returned `{"status":"ok"}` directly and through the Vite proxy, and the web page returned HTTP 200.

The local nvm shim has no default Node version selected. This shell could not run filtered app scripts that invoke Node through that shim, so the installed Node 24 executable was used to run the API and Vite CLI directly. Select a Node version with `nvm use 24.22.0` before using the documented filtered app scripts in PowerShell.

These results establish a pre-migration baseline; they do not certify production readiness or the future TypeScript/NestJS architecture.
