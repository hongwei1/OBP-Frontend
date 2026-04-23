# OBP-API Proxy Pattern

## Overview

The OBP-Portal's SvelteKit Node backend acts as an authenticated proxy to the OBP-API. The browser never talks to the OBP-API directly. This design:

1. **Keeps OAuth tokens server-side** — the access token is stored in the session and never sent to the browser
2. **Provides a uniform API** — the Portal's API mirrors the OBP-API exactly, no reshaping
3. **Enables protocol bridging** — the Node backend can speak gRPC to the OBP-API and SSE to the browser

```
┌─────────┐         ┌──────────────────┐         ┌──────────┐
│ Browser  │  HTTP   │  SvelteKit Node  │  HTTP   │  OBP-API │
│          │ ──────> │    (proxy)       │ ──────> │          │
│          │ <────── │  + OAuth token   │ <────── │          │
└─────────┘         └──────────────────┘         └──────────┘
                           │                          │
                     SSE   │         gRPC             │
                    <──────│  ────────────────────────>│
```

## Generic proxy: `/proxy/obp/[...path]`

**File:** `src/routes/proxy/obp/[...path]/+server.ts`

A single catch-all route that handles GET, POST, PUT, DELETE, and PATCH. It:

1. Checks the user is authenticated (returns 401 if not)
2. Reads the OBP path from the URL (`/proxy/obp/v6.0.0/foo` → `/obp/v6.0.0/foo`)
3. Forwards query parameters as-is
4. Forwards the request body as-is (for POST/PUT/PATCH)
5. Adds the `Authorization: Bearer {token}` header
6. Returns the OBP-API response unmodified (same status code, same JSON body)

### Usage from client-side code

```typescript
// GET messages
const res = await fetch(`/proxy/obp/v6.0.0/chat-rooms/${roomId}/messages`);
const data = await res.json(); // { messages: [...] } — same shape as OBP-API

// POST a message
const res = await fetch(`/proxy/obp/v6.0.0/chat-rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Hello', message_type: 'text' })
});

// DELETE a reaction
await fetch(`/proxy/obp/v6.0.0/chat-rooms/${roomId}/messages/${msgId}/reactions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji: '👍' })
});
```

### Error handling

Errors from the OBP-API are passed through with the original status code and JSON body. The proxy adds two additional error cases:

- **504 Gateway Timeout** — the OBP-API did not respond within 15 seconds
- **502 Bad Gateway** — the OBP-API is unreachable (connection refused, DNS failure, etc.)

These use the same `{ code, message }` format as OBP-API errors.

### Security

- The proxy only works for authenticated users — unauthenticated requests get 401
- The OAuth token is added server-side and never exposed to the browser
- The proxy does not restrict which OBP-API paths can be called — this relies on the OBP-API's own authorization (roles, entitlements) to control access

## Dedicated routes: `/backend/...`

Some features need more than simple auth forwarding:

### gRPC → SSE bridge (`/backend/chat/[chatRoomId]/stream`)

The OBP-API streams chat events via gRPC (HTTP/2 binary framing). Browsers can't speak gRPC natively. This route:

1. Opens a gRPC stream to the OBP-API's `ChatStreamService.StreamMessages`
2. Converts each gRPC event to JSON
3. Pushes events to the browser via Server-Sent Events (SSE)
4. Handles reconnection and cleanup

This cannot be a simple proxy because the transport protocol changes (gRPC → SSE).

## When to use which

Use the generic proxy (`/proxy/obp/...`) for:
- Any standard REST call (GET, POST, PUT, DELETE) to the OBP-API
- Endpoints where the request and response should match the OBP-API exactly

Use a dedicated route (`/backend/...`) for:
- Protocol bridging (gRPC → SSE, WebSocket, etc.)
- Aggregating multiple OBP-API calls into one response
- Server-side validation or transformation that can't be done client-side
- Endpoints that don't map to a single OBP-API call

## Adding a new proxied endpoint

No Portal code changes needed. Just call `/proxy/obp/` followed by the OBP-API path from the client:

```typescript
// Call any OBP-API endpoint through the proxy
const res = await fetch('/proxy/obp/v6.0.0/banks');
```

The proxy handles auth, timeout, and error passthrough automatically.
