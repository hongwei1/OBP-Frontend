<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    queryForm: {
      from_date: string;
      to_date: string;
      limit: string;
      offset: string;
      sort_by: string;
      direction: string;
      consumer_id: string;
      user_id: string;
      user_name: string;
      anon: string;
      url: string;
      app_name: string;
      implemented_by_partial_function: string;
      implemented_in_version: string;
      verb: string;
      correlation_id: string;
      duration: string;
      include_app_names: string;
      http_status_code: string;
    };
    autoRefresh?: string;
    onFieldChange?: () => void;
    onClear?: () => void;
    onRefresh?: () => void;
    onSubmit?: () => void;
    showAutoRefresh?: boolean;
    showClearButton?: boolean;
    showRefreshButton?: boolean;
    headerActions?: Snippet;
  }

  let {
    queryForm = $bindable(),
    autoRefresh = $bindable("none"),
    onFieldChange = () => {},
    onClear = () => {},
    onRefresh = () => {},
    onSubmit = () => {},
    showAutoRefresh = true,
    showClearButton = true,
    showRefreshButton = true,
    headerActions,
  }: Props = $props();

  function handleFieldChange() {
    if (onFieldChange) {
      onFieldChange();
    }
  }

  function handleClear() {
    if (onClear) {
      onClear();
    }
  }

  function handleRefresh() {
    if (onRefresh) {
      onRefresh();
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  }
</script>

<form onsubmit={handleSubmit} class="query-form">
  <div class="form-section">
    <div class="form-header">
      <h3 class="form-section-title">Query Parameters</h3>
      <div class="form-actions">
        {#if showClearButton}
          <button type="button" class="btn btn-secondary" onclick={handleClear}>
            🗑️ Clear Form
          </button>
        {/if}
        {#if showRefreshButton}
          <button
            type="button"
            class="refresh-btn"
            onclick={handleRefresh}
            title="Manual refresh"
          >
            🔄
          </button>
        {/if}
        {#if showAutoRefresh}
          <label for="auto_refresh" class="auto-refresh-label">
            Auto Refresh:
          </label>
          <select
            id="auto_refresh"
            bind:value={autoRefresh}
            class="form-input auto-refresh-select"
          >
            <option value="none">None</option>
            <option value="5">5 sec</option>
            <option value="10">10 sec</option>
            <option value="20">20 sec</option>
            <option value="30">30 sec</option>
            <option value="60">60 sec</option>
            <option value="120">2 min</option>
            <option value="600">10 min</option>
            <option value="1200">20 min</option>
            <option value="3600">60 min</option>
          </select>
        {/if}
        {#if headerActions}
          {@render headerActions()}
        {/if}
      </div>
    </div>

    <div class="form-row date-row">
      <div class="form-field date-field">
        <label for="from_date">From Date (UTC)</label>
        <input
          type="datetime-local"
          id="from_date"
          bind:value={queryForm.from_date}
          onblur={handleFieldChange}
          class="form-input"
          step="1"
        />
      </div>
      <div class="form-field date-field">
        <label for="to_date">To Date (UTC)</label>
        <input
          type="datetime-local"
          id="to_date"
          bind:value={queryForm.to_date}
          onblur={handleFieldChange}
          class="form-input"
          step="1"
        />
      </div>
      <div class="form-field narrow-field">
        <label for="limit">Limit</label>
        <input
          type="number"
          id="limit"
          bind:value={queryForm.limit}
          min="1"
          max="10000"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field narrow-field">
        <label for="offset">Offset</label>
        <input
          type="number"
          id="offset"
          bind:value={queryForm.offset}
          min="0"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field narrow-field">
        <label for="sort_by">Sort By</label>
        <select
          id="sort_by"
          bind:value={queryForm.sort_by}
          onchange={handleFieldChange}
          class="form-input"
        >
          <option value="date">Date</option>
          <option value="url">URL</option>
          <option value="user_name">User Name</option>
          <option value="app_name">App Name</option>
          <option value="verb">Method</option>
          <option value="duration">Duration</option>
        </select>
      </div>
      <div class="form-field narrow-field">
        <label for="direction">Direction</label>
        <select
          id="direction"
          bind:value={queryForm.direction}
          onchange={handleFieldChange}
          class="form-input"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
      <div class="form-field narrow-field">
        <label for="verb">Method</label>
        <select
          id="verb"
          bind:value={queryForm.verb}
          onchange={handleFieldChange}
          class="form-input"
        >
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div class="form-field narrow-field">
        <label for="http_status_code">Code</label>
        <select
          id="http_status_code"
          bind:value={queryForm.http_status_code}
          onchange={handleFieldChange}
          class="form-input"
        >
          <option value="">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="201">201 Created</option>
          <option value="204">204 No Content</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="500">500 Internal Server Error</option>
          <option value="502">502 Bad Gateway</option>
          <option value="503">503 Service Unavailable</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-field">
        <label for="consumer_id">Consumer ID</label>
        <input
          type="text"
          id="consumer_id"
          bind:value={queryForm.consumer_id}
          placeholder="Filter by consumer ID"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label for="app_name">App Name</label>
        <input
          type="text"
          id="app_name"
          bind:value={queryForm.app_name}
          placeholder="Filter by app name"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label for="include_app_names">Include App Names</label>
        <input
          type="text"
          id="include_app_names"
          bind:value={queryForm.include_app_names}
          placeholder="Comma-separated app names to include"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label for="user_name">User ID</label>
        <input
          type="text"
          id="user_name"
          bind:value={queryForm.user_name}
          placeholder="Filter by user ID"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label for="implemented_by_partial_function">Partial Function</label>
        <input
          type="text"
          id="implemented_by_partial_function"
          bind:value={queryForm.implemented_by_partial_function}
          placeholder="Filter by partial function"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label for="implemented_in_version">Version</label>
        <input
          type="text"
          id="implemented_in_version"
          bind:value={queryForm.implemented_in_version}
          placeholder="Filter by version"
          onblur={handleFieldChange}
          class="form-input"
        />
      </div>
      <div class="form-field narrow-field">
        <label for="anon">Anonymous</label>
        <select
          id="anon"
          bind:value={queryForm.anon}
          onchange={handleFieldChange}
          class="form-input"
        >
          <option value="">All Users</option>
          <option value="true">Anonymous Only</option>
          <option value="false">Authenticated Only</option>
        </select>
      </div>
    </div>
  </div>
</form>

<style>
  .query-form {
    width: 100%;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
  }

  .form-section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-surface-700);
    margin: 0;
  }

  :global([data-mode="dark"]) .form-section-title {
    color: var(--color-surface-300);
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: var(--color-surface-200);
    color: var(--color-surface-700);
    border-color: var(--color-surface-300);
  }

  .btn-secondary:hover {
    background: var(--color-surface-300);
  }

  :global([data-mode="dark"]) .btn-secondary {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-200);
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .btn-secondary:hover {
    background: rgb(var(--color-surface-600));
  }

  .refresh-btn {
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    background: transparent;
    border: 1px solid var(--color-surface-300);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-btn:hover {
    background: var(--color-surface-100);
    transform: rotate(90deg);
  }

  :global([data-mode="dark"]) .refresh-btn {
    border-color: rgb(var(--color-surface-600));
  }

  :global([data-mode="dark"]) .refresh-btn:hover {
    background: rgb(var(--color-surface-700));
  }

  .auto-refresh-label {
    font-size: 0.875rem;
    margin: 0;
    color: var(--color-surface-700);
  }

  :global([data-mode="dark"]) .auto-refresh-label {
    color: var(--color-surface-300);
  }

  .auto-refresh-select {
    font-size: 0.875rem;
    padding: 0.375rem 0.5rem;
    min-width: 90px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
  }

  .form-row.date-row {
    grid-template-columns: 240px 260px 80px 80px 80px 80px 80px 80px;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-field.date-field {
    min-width: 240px;
    max-width: 260px;
  }

  .form-field.narrow-field {
    max-width: 80px;
  }

  .form-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-surface-700);
    margin-bottom: 0.25rem;
  }

  :global([data-mode="dark"]) .form-field label {
    color: var(--color-surface-300);
  }

  .form-input {
    padding: 0.5rem;
    border: 1px solid var(--color-surface-300);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    color: var(--color-surface-900);
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary-500);
    ring: 2px;
    ring-color: rgba(59, 130, 246, 0.2);
  }

  :global([data-mode="dark"]) .form-input {
    background: rgb(var(--color-surface-800));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .form-input:focus {
    border-color: rgb(var(--color-primary-400));
  }

  @media (max-width: 1400px) {
    .form-row.date-row {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .form-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .form-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-row.date-row {
      grid-template-columns: 1fr;
    }

    .form-field.date-field,
    .form-field.narrow-field {
      max-width: 100%;
    }
  }
</style>
