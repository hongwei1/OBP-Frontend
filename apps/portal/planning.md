# Plan: Port OBP-API Pages to OBP-Portal

## Context

Several pages are being removed from OBP-API (Lift/Scala) and need equivalent replacements in OBP-Portal (SvelteKit). These pages cover consent management, OTP validation, user onboarding, user invitations, and OAuth consent screens. A new "Misc" menu section houses navigable pages. Flow pages (accessed via TPP redirects) don't appear in the menu but have accessible routes.

## Key Decisions

- **Hydra consent screen** → Replaced with a generic OAuth consent screen (Keycloak/OBP-OIDC)
- **User invitation pages** → Already existed in the portal (user-invitation, user-invitation-info, user-invitation-warning)
- **BG consent IBAN selection** → Full version using REST APIs (`GET /my/accounts`)
- **Consents listing** → Already exists at `/user/consents`, no new page needed
- **Role Guard** → All new protected pages require `HasEarlyAccess` system role (adapted from API-Manager-II's PageRoleCheck)
- **Error Handling** → All pages display errors inline on the page rather than throwing HTTP errors before page load

---

## Implementation Status

### Step 1: TypeScript Types ✅
Added to `src/lib/obp/types.ts`: OBPUserAuthContextUpdate, OBPConsentRequestResponse, OBPConsentChallengeResponse, OBPBGConsentAccess, OBPConsumerDetails, OBPBGPaymentAuthorisation

### Step 2: Static Pages ✅
- `src/routes/user-invitation-info/+page.svelte`
- `src/routes/user-invitation-warning/+page.svelte`

### Step 3: User Auth Context Update / Onboarding ✅
- `src/routes/(protected)/add-user-auth-context-update-request/+page.server.ts` & `+page.svelte`
- `src/routes/(protected)/confirm-user-auth-context-update-request/+page.server.ts` & `+page.svelte`

### Step 4: OTP Validation Page ✅
- `src/routes/(protected)/otp/+page.server.ts` & `+page.svelte`

### Step 5: VRP Consent Flow ✅
- `src/routes/(protected)/confirm-vrp-consent-request/+page.server.ts` & `+page.svelte`
- `src/routes/(protected)/confirm-vrp-consent/+page.server.ts` & `+page.svelte`

### Step 6: Berlin Group Consent Flow ✅
- `src/routes/(protected)/confirm-bg-consent-request/+page.server.ts` & `+page.svelte`
- `src/routes/(protected)/confirm-bg-consent-request-sca/+page.server.ts` & `+page.svelte`
- `src/routes/(protected)/confirm-bg-consent-request-redirect-uri/+page.server.ts` & `+page.svelte`

### Step 7: OAuth Consent Screen ✅
- `src/routes/(protected)/consent-screen/+page.server.ts` & `+page.svelte`
- Note: Has TODO placeholders for Keycloak/OBP-OIDC integration

### Step 8: User Invitation Pages ✅ (Already Existed)
- `src/routes/user-invitation/+page.server.ts` & `+page.svelte` were already implemented

### Step 9: Navigation ✅
- Added `miscItems` to `src/lib/config/navigation.ts`
- Added "Misc" expandable section to `src/routes/+layout.svelte`

### Role Guard ✅
- Created `src/lib/utils/roleChecker.ts` - Utility for checking user entitlements (OR logic)
- Created `src/lib/components/RoleGuard.svelte` - Wrapper component adapted from API-Manager-II
- All new protected pages wrapped with `<RoleGuard requiredRoles={[{ role: 'HasEarlyAccess' }]}>`
- Shows expandable "Missing Entitlement" alert with tip to request role via Entitlements page

### Error Handling ✅
- All `load()` functions return `loadError` as data prop instead of throwing `error()`
- All pages display `loadError` inline in the rendered page
- Pages show as much content as possible even when errors occur

---

## New Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| RoleGuard | `src/lib/components/RoleGuard.svelte` | Checks user has required roles before showing content |
| roleChecker | `src/lib/utils/roleChecker.ts` | Utility for OR-logic role checking |

## Environment Variables Needed

- `DEFAULT_BANK_ID` - Used by VRP consent and BG consent SCA pages (private env var)

## TODOs

1. **OAuth consent screen** - Integrate with the OIDC provider's consent mechanism. The consent challenge flow is provider-specific (not part of the OIDC standard). Keycloak typically handles consent within its own UI; OBP-OIDC would need a custom consent endpoint. The UI shell is ready with Allow/Deny buttons and scope display.

## Completed TODOs

- ~~**BG consent deny action**~~ ✅ - Calls `PUT /obp/v6.0.0/banks/{DEFAULT_BANK_ID}/consents/{CONSENT_ID}` with `{"status": "REJECTED"}`, then redirects to TPP Nok Redirect URI
- ~~**BG consent account selection**~~ ✅ - Calls `PUT /obp/v6.0.0/management/banks/{DEFAULT_BANK_ID}/consents/{CONSENT_ID}/account-access` with selected IBANs mapped to BG access format (accounts, balances, transactions)
