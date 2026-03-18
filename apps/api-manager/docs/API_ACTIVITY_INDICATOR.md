# API Activity Indicator

## Overview

The API Activity Indicator is a visual component that provides real-time feedback to users when API calls are being made. It appears as a small, animated indicator in the top-right corner of the screen, showing "API" with a pulsing dot whenever network requests are in progress.

## Components

### 1. ApiActivityIndicator Component

**Location:** `src/lib/components/ApiActivityIndicator.svelte`

A fixed-position UI component that displays when API calls are active.

**Features:**
- Fixed positioning in top-right corner
- Pulsing animation on the indicator dot
- Auto-shows/hides based on API activity
- Dark mode support
- High z-index (9999) to stay above other content

**Visual Design:**
- Blue background (`rgba(102, 126, 234, 0.95)`)
- White text and pulsing dot
- Smooth fade in/out transitions
- Backdrop blur effect for modern appearance

### 2. API Activity Store

**Location:** `src/lib/stores/apiActivity.ts`

A Svelte store that manages the state of API activity across the application.

**State Interface:**
```typescript
interface ApiActivityState {
  isActive: boolean;
  activeCallsCount: number;
}
```

**Methods:**
- `startCall()` - Increment active calls counter and show indicator
- `endCall()` - Decrement active calls counter and hide indicator when count reaches zero

**Smart Features:**
- Automatic call counting to handle concurrent requests
- 300ms delay before hiding to create a brief flash effect
- Timer cleanup to prevent memory leaks

### 3. Tracked Fetch Utility

**Location:** `src/lib/utils/trackedFetch.ts`

A wrapper around the native `fetch` API that automatically tracks API activity.

**Usage:**

```typescript
import { trackedFetch } from '$lib/utils/trackedFetch';

// Use exactly like native fetch
const response = await trackedFetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Advanced Usage - Track Multiple Calls:**

```typescript
import { trackApiActivity } from '$lib/utils/trackedFetch';

// Track multiple sequential calls as one operation
const result = await trackApiActivity(async () => {
  const user = await fetch('/api/user').then(r => r.json());
  const profile = await fetch(`/api/profile/${user.id}`).then(r => r.json());
  return { user, profile };
});
```

## Implementation

### Step 1: Add to Layout

The indicator is added to the root layout to be globally available:

**File:** `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import ApiActivityIndicator from "$lib/components/ApiActivityIndicator.svelte";
  // ... other imports
</script>

<!-- At the bottom of the layout, after Toast -->
<Toast />
<ApiActivityIndicator />
```

### Step 2: Use trackedFetch in Components

Replace standard `fetch` calls with `trackedFetch`:

**Before:**
```typescript
const response = await fetch("/api/rbac/entitlements", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

**After:**
```typescript
import { trackedFetch } from "$lib/utils/trackedFetch";

const response = await trackedFetch("/api/rbac/entitlements", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

## Files Updated

The following files have been updated to use the API Activity Indicator:

1. **Root Layout**
   - `src/routes/+layout.svelte` - Added `ApiActivityIndicator` component

2. **RBAC Pages**
   - `src/routes/(protected)/rbac/entitlement-requests/+page.svelte` - Accept/Decline actions
   - `src/routes/(protected)/rbac/entitlements/create/+page.svelte` - Create entitlement form

3. **Widget Components**
   - `src/lib/components/UserSearchWidget.svelte` - User search API calls
   - `src/lib/components/BankSelectWidget.svelte` - Bank loading API calls

## Benefits

1. **User Feedback:** Users immediately see when the application is communicating with the server
2. **Loading State:** Eliminates confusion about whether an action is processing
3. **Non-Intrusive:** Small, fixed indicator doesn't block content
4. **Concurrent Support:** Handles multiple simultaneous API calls gracefully
5. **Easy Integration:** Simple wrapper function makes adoption straightforward
6. **Consistent UX:** Single global indicator provides consistent experience across the app

## Best Practices

### When to Use trackedFetch

✅ **DO use for:**
- User-initiated actions (button clicks, form submissions)
- Search operations
- Data fetching operations
- CRUD operations

❌ **DON'T use for:**
- Background polling (would cause constant flashing)
- Analytics or logging requests
- Non-critical background operations

### Alternative: Manual Tracking

For complex scenarios, you can manually control the indicator:

```typescript
import { apiActivity } from '$lib/stores/apiActivity';

async function complexOperation() {
  apiActivity.startCall();
  
  try {
    // Your complex logic here
    await someOperation();
  } finally {
    apiActivity.endCall();
  }
}
```

### Nested Calls

The store automatically handles nested/concurrent calls:

```typescript
// Both calls will be tracked, indicator stays visible until both complete
await Promise.all([
  trackedFetch('/api/users'),
  trackedFetch('/api/roles')
]);
```

## Styling

The indicator can be customized by modifying the styles in `ApiActivityIndicator.svelte`:

```css
.api-indicator {
  position: fixed;
  top: 1rem;           /* Vertical position */
  right: 1rem;         /* Horizontal position */
  background: rgba(102, 126, 234, 0.95); /* Background color */
  z-index: 9999;       /* Stacking order */
  /* ... other styles */
}
```

## Testing

To verify the indicator is working:

1. Open the application
2. Navigate to RBAC > Entitlement Requests
3. Click "Accept" or "Decline" on a request
4. Observe the blue "API" indicator in the top-right corner
5. The indicator should pulse during the API call and disappear when complete

## Future Enhancements

Potential improvements for future iterations:

1. **Progress Indication:** Show number of active calls
2. **Error States:** Red indicator for failed requests
3. **Request Details:** Hover to see which endpoints are being called
4. **Performance Metrics:** Display request duration
5. **Configurable Position:** Allow users to move the indicator
6. **Request Cancellation:** Add ability to cancel pending requests

## Troubleshooting

### Indicator Not Showing

1. Check that `ApiActivityIndicator` is imported in the layout
2. Verify `trackedFetch` is being used instead of native `fetch`
3. Check browser console for any errors
4. Ensure z-index isn't being overridden by other elements

### Indicator Stays Visible

1. Ensure all `startCall()` have matching `endCall()`
2. Check for uncaught errors that prevent `finally` blocks from executing
3. Verify no infinite loops in API call logic

### Multiple Indicators

1. Only one `ApiActivityIndicator` should be in the component tree
2. Remove any duplicate imports in nested layouts

## Related Files

- Component: `src/lib/components/ApiActivityIndicator.svelte`
- Store: `src/lib/stores/apiActivity.ts`
- Utility: `src/lib/utils/trackedFetch.ts`
- Layout: `src/routes/+layout.svelte`

## Version History

- **v1.0.0** (Current) - Initial implementation with basic activity tracking
  - Global indicator component
  - Activity store with call counting
  - Tracked fetch utility
  - Integration in RBAC section and widgets
