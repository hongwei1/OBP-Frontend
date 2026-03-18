/**
 * trackedFetch.ts
 *
 * A wrapper around the native fetch API that automatically tracks API activity
 * using the apiActivity store. This ensures the ApiActivityIndicator shows
 * whenever API calls are in progress.
 *
 * Usage:
 *   import { trackedFetch } from '$lib/utils/trackedFetch';
 *
 *   // Use exactly like fetch
 *   const response = await trackedFetch('/api/endpoint', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(data)
 *   });
 */

import { apiActivity } from '$lib/stores/apiActivity';

/**
 * A fetch wrapper that automatically tracks API activity.
 *
 * @param input - The resource URL or Request object
 * @param init - Optional fetch configuration
 * @returns Promise<Response> - The fetch response
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  apiActivity.startCall();

  try {
    const response = await fetch(input, init);
    return response;
  } finally {
    apiActivity.endCall();
  }
}

/**
 * Helper function to wrap multiple sequential fetch calls in a single activity tracking scope.
 * Useful when you want to track a series of related API calls as one operation.
 *
 * @param fn - An async function containing fetch calls
 * @returns Promise<T> - The result of the function
 *
 * @example
 * await trackApiActivity(async () => {
 *   const user = await fetch('/api/user').then(r => r.json());
 *   const profile = await fetch(`/api/profile/${user.id}`).then(r => r.json());
 *   return { user, profile };
 * });
 */
export async function trackApiActivity<T>(fn: () => Promise<T>): Promise<T> {
  apiActivity.startCall();

  try {
    return await fn();
  } finally {
    apiActivity.endCall();
  }
}
