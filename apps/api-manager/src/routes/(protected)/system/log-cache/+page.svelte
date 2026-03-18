<script lang="ts">
  let { data } = $props();

  let logs = $state<any[]>([]);
  let logLevel = $state<string>("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let lastUpdated = $state<string>("");
  let refreshInterval: number | undefined = undefined;
  let copiedMessageIndex = $state<number | null>(null);

  const logLevels = [
    { value: "", label: "ALL" },
    { value: "ERROR", label: "ERROR" },
    { value: "WARNING", label: "WARNING" },
    { value: "INFO", label: "INFO" },
    { value: "DEBUG", label: "DEBUG" },
  ];

  async function fetchLogs() {
    try {
      isLoading = true;
      error = null;

      const params = new URLSearchParams();
      if (logLevel) {
        params.append("log_level", logLevel);
      }

      const url = `/api/devops/log-cache${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText;
        throw new Error(
          `Failed to fetch logs (${response.status}): ${errorMsg}`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle both array response and object with entries property
      logs = Array.isArray(data) ? data : data.entries || [];
      lastUpdated = new Date().toLocaleString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to fetch logs";
    } finally {
      isLoading = false;
    }
  }

  function startAutoRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Initial fetch
    fetchLogs();

    // Set up 5-second interval
    refreshInterval = setInterval(() => {
      fetchLogs();
    }, 5000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = undefined;
    }
  }

  function handleLogLevelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    logLevel = target.value;
    // Restart auto-refresh with new log level
    startAutoRefresh();
  }

  function parseLogMessage(message: string): {
    timestamp: string;
    source: string;
    cleanMessage: string;
  } {
    // Parse format: [2025-11-23 16:37:53Z] [thread-name] [Source] message
    const pattern = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)$/;
    const match = message.match(pattern);

    if (match) {
      return {
        timestamp: match[1],
        source: match[3],
        cleanMessage: match[4],
      };
    }

    return {
      timestamp: "",
      source: "",
      cleanMessage: message,
    };
  }

  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }

  function getLogLevelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case "ERROR":
        return "log-level-error";
      case "WARN":
      case "WARNING":
        return "log-level-warn";
      case "INFO":
        return "log-level-info";
      case "DEBUG":
        return "log-level-debug";
      default:
        return "";
    }
  }

  // Initialize on mount - run only once
  let initialized = $state(false);

  $effect(() => {
    if (typeof window !== "undefined" && !initialized) {
      initialized = true;
      startAutoRefresh();
    }
  });

  // Cleanup effect
  $effect(() => {
    return () => {
      stopAutoRefresh();
    };
  });

  async function copyMessage(log: any, index: number) {
    try {
      const parsed = parseLogMessage(log.message || "");
      const timestamp = formatTimestamp(parsed.timestamp);
      const level = log.level || log.log_level || "N/A";
      const message = parsed.cleanMessage || "N/A";
      const source = parsed.source || "N/A";

      const rowData = `${timestamp},${level},${message},${source}`;
      await navigator.clipboard.writeText(rowData);
      copiedMessageIndex = index;
      setTimeout(() => {
        copiedMessageIndex = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  }
</script>

<svelte:head>
  <title>Log Cache - API Manager II</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <div class="panel">
      <div class="panel-header">
        <div class="header-content">
          <div>
            <h1 class="panel-title">LogCache</h1>
            <div class="panel-subtitle">
              View and monitor cached logs from the OBP API
            </div>
          </div>
          <div class="header-controls">
            <div class="filter-group">
              <label for="logLevel" class="filter-label">Log Level:</label>
              <select
                id="logLevel"
                value={logLevel}
                onchange={handleLogLevelChange}
                class="filter-select"
              >
                {#each logLevels as level}
                  <option value={level.value}>{level.label}</option>
                {/each}
              </select>
            </div>
            {#if lastUpdated}
              <div class="last-updated">
                Last updated: <span class="timestamp">{lastUpdated}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
      <div class="panel-content">
        {#if error}
          <div class="alert alert-error">
            <strong>Error:</strong>
            {error}
          </div>
        {/if}

        {#if isLoading && logs.length === 0}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading logs...</p>
          </div>
        {:else if logs.length > 0}
          <div class="logs-container">
            <div class="table-wrapper">
              <table class="logs-table">
                <thead>
                  <tr>
                    <th style="width: 40px;"></th>
                    <th>Timestamp</th>
                    <th>Level</th>
                    <th>Message</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {#each logs as log}
                    {@const parsed = parseLogMessage(log.message || "")}
                    <tr>
                      <td class="copy-cell">
                        <button
                          class="copy-btn"
                          onclick={() => copyMessage(log, logs.indexOf(log))}
                          title="Copy row"
                          aria-label="Copy row"
                        >
                          {#if copiedMessageIndex === logs.indexOf(log)}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          {:else}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path
                                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                              ></path>
                            </svg>
                          {/if}
                        </button>
                      </td>
                      <td class="timestamp-cell">
                        {formatTimestamp(parsed.timestamp)}
                      </td>
                      <td>
                        <span
                          class="log-level-badge {getLogLevelClass(
                            log.level || log.log_level,
                          )}"
                        >
                          {log.level || log.log_level || "N/A"}
                        </span>
                      </td>
                      <td class="message-cell">
                        {parsed.cleanMessage || "N/A"}
                      </td>
                      <td class="source-cell">{parsed.source || "N/A"}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <div class="logs-count">Showing {logs.length} log entries</div>
          </div>
        {:else}
          <div class="empty-state">
            <p>No logs found</p>
            {#if logLevel}
              <p class="text-sm">Try selecting a different log level</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

<style>
  .container {
    max-width: 1600px;
  }

  .panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  :global([data-mode="dark"]) .panel {
    background: rgb(var(--color-surface-800));
  }

  .panel-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .panel-header {
    border-bottom-color: rgb(var(--color-surface-700));
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .panel-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  :global([data-mode="dark"]) .panel-title {
    color: var(--color-surface-100);
  }

  .panel-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  :global([data-mode="dark"]) .panel-subtitle {
    color: var(--color-surface-400);
  }

  .header-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  :global([data-mode="dark"]) .filter-label {
    color: var(--color-surface-300);
  }

  .filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    cursor: pointer;
  }

  .filter-select option {
    background: white;
    color: #111827;
  }

  :global([data-mode="dark"]) .filter-select {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .filter-select option {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-100);
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px;
    ring-color: rgba(59, 130, 246, 0.2);
  }

  .last-updated {
    font-size: 0.75rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .last-updated {
    color: var(--color-surface-400);
  }

  .timestamp {
    font-family: monospace;
    font-weight: 500;
    color: #374151;
  }

  :global([data-mode="dark"]) .timestamp {
    color: var(--color-surface-300);
  }

  .panel-content {
    padding: 1.5rem;
  }

  .logs-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  :global([data-mode="dark"]) .table-wrapper {
    border-color: rgb(var(--color-surface-700));
  }

  .logs-table {
    width: 100%;
    border-collapse: collapse;
  }

  .logs-table th {
    text-align: left;
    padding: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
  }

  :global([data-mode="dark"]) .logs-table th {
    color: var(--color-surface-300);
    background: rgb(var(--color-surface-700));
    border-bottom-color: rgb(var(--color-surface-600));
  }

  .logs-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: #111827;
  }

  :global([data-mode="dark"]) .logs-table td {
    border-bottom-color: rgb(var(--color-surface-700));
    color: var(--color-surface-100);
  }

  .logs-table tbody tr:hover {
    background: #f9fafb;
  }

  :global([data-mode="dark"]) .logs-table tbody tr:hover {
    background: rgb(var(--color-surface-700));
  }

  .logs-table tbody tr:last-child td {
    border-bottom: none;
  }

  .timestamp-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    white-space: nowrap;
  }

  .message-cell {
    max-width: 600px;
    word-wrap: break-word;
  }

  .copy-cell {
    width: 40px;
    text-align: center;
    padding: 0.5rem;
  }

  .copy-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .copy-btn:hover {
    background: #f3f4f6;
    color: #3b82f6;
  }

  :global([data-mode="dark"]) .copy-btn {
    color: var(--color-surface-400);
  }

  :global([data-mode="dark"]) .copy-btn:hover {
    background: rgb(var(--color-surface-700));
    color: rgb(var(--color-primary-400));
  }

  .copy-btn:active {
    transform: scale(0.95);
  }

  .copy-btn svg {
    width: 16px;
    height: 16px;
  }

  .source-cell {
    font-family: monospace;
    font-size: 0.8125rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .source-cell {
    color: var(--color-surface-400);
  }

  .log-level-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .log-level-error {
    background: #fee2e2;
    color: #991b1b;
  }

  :global([data-mode="dark"]) .log-level-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
  }

  .log-level-warn {
    background: #fef3c7;
    color: #92400e;
  }

  :global([data-mode="dark"]) .log-level-warn {
    background: rgba(251, 191, 36, 0.2);
    color: rgb(253, 224, 71);
  }

  .log-level-info {
    background: #dbeafe;
    color: #1e40af;
  }

  :global([data-mode="dark"]) .log-level-info {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(147, 197, 253);
  }

  .log-level-debug {
    background: #e5e7eb;
    color: #374151;
  }

  :global([data-mode="dark"]) .log-level-debug {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-300);
  }

  .logs-count {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: right;
  }

  :global([data-mode="dark"]) .logs-count {
    color: var(--color-surface-400);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  :global([data-mode="dark"]) .spinner {
    border-color: rgb(var(--color-surface-700));
    border-top-color: rgb(var(--color-primary-400));
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  :global([data-mode="dark"]) .empty-state {
    color: var(--color-surface-400);
  }

  .empty-state .text-sm {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
  }

  .alert-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  :global([data-mode="dark"]) .alert-error {
    background: rgb(var(--color-error-900));
    color: rgb(var(--color-error-200));
    border-color: rgb(var(--color-error-800));
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .header-controls {
      align-items: stretch;
    }

    .filter-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.25rem;
    }

    .filter-select {
      width: 100%;
    }

    .last-updated {
      text-align: center;
    }
  }
</style>
