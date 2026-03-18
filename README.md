# OBP-Frontend

Monorepo for Open Bank Project frontend applications, using npm workspaces.

## Structure

```
apps/
  portal/          # OBP Portal (SvelteKit) — port 5174
  api-manager/     # API Manager II (SvelteKit) — port 3003
packages/
  shared/          # Shared components & utilities (@obp/shared)
```

## Setup

```bash
npm install          # installs all workspaces, symlinks @obp/shared
```

## Environment

Each app has its own `.env` file. Copy the example and configure:

```bash
cp apps/portal/.env.example apps/portal/.env
cp apps/api-manager/.env.example apps/api-manager/.env
```

Key differences between the two `.env` files:

| Variable | Portal | API Manager |
|---|---|---|
| `ORIGIN` | `http://localhost:5174` | `http://localhost:3003` |
| `APP_CALLBACK_URL` | `http://localhost:5174/login/obp/callback` | `http://localhost:3003/login/obp/callback` |

Everything else (OBP API URL, OAuth credentials, Redis, Opey) can be shared.

## Development

```bash
# Run Portal
npm run dev --workspace=apps/portal

# Run API Manager
npm run dev --workspace=apps/api-manager

# Run both at once (in separate terminals)
npm run dev --workspace=apps/portal &
npm run dev --workspace=apps/api-manager &

# Build
npm run build --workspace=apps/portal
npm run build --workspace=apps/api-manager

# Build shared package (required before first app build)
npm run build --workspace=packages/shared

# Type check
npm run check --workspace=apps/portal
npm run check --workspace=apps/api-manager

# Run tests
npm test --workspace=apps/portal
npm test --workspace=apps/api-manager
```

## How it works

The `@obp/shared` package is symlinked into each app's `node_modules` via npm workspaces. Changes to `packages/shared/` are picked up immediately by Vite's HMR in dev mode — no publishing or version bumping needed.

Apps import from the shared package using subpath exports:

```ts
import { OpeyChat } from '@obp/shared/components';
import { createOpeyAuthHandler } from '@obp/shared/server/opey';
import { deduplicateRoles } from '@obp/shared/opey';
```
