import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ResourceDocsCacheBrowser");

interface ResourceDoc {
  operation_id: string;
  request_verb: string;
  request_url: string;
  summary: string;
  description?: string;
  markdown_description?: string;
  description_html?: string;
  roles?: Array<{ role: string; requires_bank_id: boolean }>;
}

interface CacheState {
  docs: ResourceDoc[];
  lastFetched: number | null;
  loading: boolean;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (resource docs change rarely)

/**
 * Browser-side cache for OBP resource docs
 * This uses Svelte's $state for reactivity in the browser
 */
class ResourceDocsCacheBrowser {
  private state = $state<CacheState>({
    docs: [],
    lastFetched: null,
    loading: false,
  });

  get docs(): ResourceDoc[] {
    return this.state.docs;
  }

  get loading(): boolean {
    return this.state.loading;
  }

  private isCacheValid(): boolean {
    if (!this.state.lastFetched) return false;
    return Date.now() - this.state.lastFetched < CACHE_DURATION;
  }

  /**
   * Fetch resource docs from the API endpoint
   */
  async fetchResourceDocs(force: boolean = false): Promise<ResourceDoc[]> {
    // Return cached data if valid and not forcing refresh
    if (!force && this.isCacheValid() && this.state.docs.length > 0) {
      logger.info(
        `Returning cached resource docs (${this.state.docs.length} docs, age: ${Math.round((Date.now() - (this.state.lastFetched || 0)) / 1000)}s)`,
      );
      return this.state.docs;
    }

    // If already loading, wait for completion
    if (this.state.loading) {
      logger.info("Fetch already in progress, waiting...");
      // Poll until loading is complete
      while (this.state.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.state.docs;
    }

    this.state.loading = true;

    try {
      logger.info("Fetching resource docs from API...");

      const response = await fetch("/api/resource-docs");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch resource docs: ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.state.docs = data.resource_docs || [];
      this.state.lastFetched = Date.now();

      logger.info(`Cached ${this.state.docs.length} resource docs in browser`);
      return this.state.docs;
    } catch (error) {
      logger.error("Error fetching resource docs:", error);
      // Clear cache on error
      this.state.docs = [];
      this.state.lastFetched = null;
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Get resource docs for a specific role
   */
  getDocsForRole(roleName: string): ResourceDoc[] {
    return this.state.docs.filter((doc) => {
      const roles = doc.roles || [];
      return roles.some((r) => r.role === roleName);
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    logger.info("Clearing browser resource docs cache");
    this.state.docs = [];
    this.state.lastFetched = null;
    this.state.loading = false;
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    const age = this.state.lastFetched
      ? Math.round((Date.now() - this.state.lastFetched) / 1000)
      : null;

    return {
      count: this.state.docs.length,
      lastFetched: this.state.lastFetched,
      ageSeconds: age,
      isValid: this.isCacheValid(),
      loading: this.state.loading,
    };
  }

  /**
   * Pre-warm the cache in the background without blocking
   * @param accessToken - Optional, not used in browser (fetches via API endpoint)
   */
  async preWarmCache(accessToken?: string): Promise<void> {
    // Don't pre-warm if cache is already valid
    if (this.isCacheValid() && this.state.docs.length > 0) {
      logger.debug(
        `Browser cache already valid (${this.state.docs.length} docs), skipping pre-warm`,
      );
      return;
    }

    // Don't pre-warm if already loading
    if (this.state.loading) {
      logger.debug("Cache fetch already in progress, skipping pre-warm");
      return;
    }

    try {
      logger.info("Pre-warming browser resource docs cache...");
      // Start fetch without awaiting - this runs in background
      this.fetchResourceDocs().catch((error) => {
        logger.error("Browser cache pre-warm failed:", error);
      });
    } catch (error) {
      // Silently fail - pre-warming is best-effort
      logger.warn("Failed to start browser cache pre-warm:", error);
    }
  }
}

// Export singleton instance
export const resourceDocsCacheBrowser = new ResourceDocsCacheBrowser();
