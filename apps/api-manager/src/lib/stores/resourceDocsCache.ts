import { browser } from "$app/environment";

// Import both caches
import { resourceDocsCache as serverCache } from "./resourceDocsCache.svelte";
import { resourceDocsCacheBrowser as browserCache } from "./resourceDocsCache.browser.svelte";

/**
 * Unified export that automatically uses the correct cache
 * based on the environment (browser vs server)
 */
export const resourceDocsCache = browser ? browserCache : serverCache;

// Re-export types for convenience
export type { ResourceDoc } from "./resourceDocsCache.svelte";
