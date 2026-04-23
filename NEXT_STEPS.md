# Next Steps — Running OBP-Frontend Locally

## Files created during setup (2026-04-23)

### `apps/portal/.env` (gitignored)

Starts from your OBP-Portal `.env` verbatim + a clearly-marked
`=== Added from monorepo .env.example ===` block at the bottom with:

- `SESSION_SECRET="CHANGE_ME_generate_with_openssl_rand_hex_32"` **← required, fill this in**
- `PUBLIC_CANONICAL_URL`, `PUBLIC_LOGO_WIDTH`, `PUBLIC_OBP_CHAT_URL`
- Welcome-splash / help / suggested-question vars
- `ENABLE_ANALYTICS=false`
- Commented sponsor vars

Keycloak creds (`KEYCLOAK_OAUTH_CLIENT_ID/SECRET`) are preserved from upstream.

### `apps/api-manager/.env` (gitignored)

Starts from your API-Manager-II `.env` verbatim + the appended block with:

- `ORIGIN=http://localhost:3003`
- `SESSION_SECRET` placeholder
- `API_MANAGER_URL`, `SUBSCRIPTIONS_URL`
- UI config (`PUBLIC_LOGO_*`)
- `OBP_GRPC_*` (log-cache / metrics streaming)
- `OBP_OAUTH_WELL_KNOWN_URL`, `VITE_OIDC_ISSUER`, `VITE_CLIENT_ID`
- `KEYCLOAK_OAUTH_CLIENT_ID/SECRET` placeholders — fill in real Keycloak creds if api-manager should show the Keycloak login option too.

### Dev scripts

At the monorepo root (all `chmod +x`, none gitignored — commit if you want them versioned):

- `./start_dev_portal.sh` — just the portal (→ `http://localhost:5174`, log: `/tmp/obp-portal.log`). Thin `exec` wrapper over `apps/portal/start-dev.sh`.
- `./start_dev_manager.sh` — just the API manager (→ `http://localhost:3003`, log: `/tmp/obp-api-manager.log`). Thin `exec` wrapper over `apps/api-manager/start-dev.sh`.
- `./start_dev_all.sh` — starts **both** apps concurrently. Ctrl+C stops both. Output prefixed `[portal] ` / `[apim]   ` so you can tell them apart, and each is teed to its own log file.

The underlying per-app scripts also exist:

- `apps/portal/start-dev.sh` (already tracked in git)
- `apps/api-manager/start-dev.sh` (new, mirrors the portal one)

## Before you run

### 1. Fill in both `SESSION_SECRET` values

The server throws on startup without a session secret. Quick one-liner:

```bash
sed -i "s/CHANGE_ME_generate_with_openssl_rand_hex_32/$(openssl rand -hex 32)/" apps/portal/.env apps/api-manager/.env
```

Or paste the output of `openssl rand -hex 32` manually into each file.

### 2. Make sure these are running locally

- OBP-API on `localhost:8080`
- Redis on `localhost:6379`
- Opey on `localhost:5000` (if you want the chat features)
- OBP-OIDC on `localhost:9000` (for the OIDC login flow)

## Run

Both apps at once:

```bash
./start_dev_all.sh
```

- Portal      → http://localhost:5174
- API Manager → http://localhost:3003

Logs at `/tmp/obp-portal.log` and `/tmp/obp-api-manager.log`.

Or just one:

```bash
./start_dev_portal.sh
# or
./start_dev_manager.sh
```
