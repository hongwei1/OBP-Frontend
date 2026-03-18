<script lang="ts">
  import { Building2, ChevronDown } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { trackedFetch } from "$lib/utils/trackedFetch";
  import {
    extractErrorFromResponse,
    formatErrorForDisplay,
    logErrorDetails,
  } from "$lib/utils/errorHandler";

  interface Bank {
    bank_id: string;
    short_name: string;
    full_name: string;
    logo?: string;
    website?: string;
  }

  interface Props {
    selectedBankId?: string;
    disabled?: boolean;
    allowEmpty?: boolean;
    emptyLabel?: string;
  }

  let {
    selectedBankId = $bindable(""),
    disabled = false,
    allowEmpty = true,
    emptyLabel = "System-wide (no specific bank)",
  }: Props = $props();

  let banks = $state<Bank[]>([]);
  let isLoading = $state(false);
  let error = $state("");

  let selectedBank = $derived(banks.find((bank) => bank.bank_id === selectedBankId));

  onMount(async () => {
    await fetchBanks();
  });

  async function fetchBanks() {
    isLoading = true;
    error = "";

    try {
      const response = await trackedFetch("/api/banks");

      if (!response.ok) {
        const errorDetails = await extractErrorFromResponse(
          response,
          "Failed to fetch banks",
        );
        logErrorDetails("Fetch Banks", errorDetails);
        error = formatErrorForDisplay(errorDetails);
        return;
      }

      const data = await response.json();
      // Filter out banks with missing bank_id and sort by bank_id
      banks = (data.banks || [])
        .filter((b: Bank) => b.bank_id != null)
        .sort((a: Bank, b: Bank) => (a.bank_id || "").localeCompare(b.bank_id || ""));
    } catch (err) {
      console.error("Error fetching banks:", err);
      error = err instanceof Error ? err.message : "Failed to load banks";
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="bank-select-widget">
  <div class="select-wrapper">
    <Building2 class="select-icon" size={18} />
    <select class="select-input" bind:value={selectedBankId} {disabled}>
      {#if allowEmpty}
        <option value="">{emptyLabel}</option>
      {/if}

      {#if isLoading}
        <option value="" disabled>Loading banks...</option>
      {:else if error}
        <option value="" disabled>Error loading banks</option>
      {:else if banks.length === 0}
        <option value="" disabled>No banks available</option>
      {:else}
        {#each banks as bank}
          <option value={bank.bank_id}>
            {bank.short_name}
            {#if bank.full_name && bank.full_name !== bank.short_name}
              - {bank.full_name}
            {/if}
          </option>
        {/each}
      {/if}
    </select>
    <ChevronDown class="chevron-icon" size={18} />
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if selectedBankId && selectedBank}
    <div class="selected-info">
      <Building2 size={14} />
      <span class="selected-text">
        Selected Bank: <strong>{selectedBank.short_name}</strong>
        {#if selectedBank.full_name && selectedBank.full_name !== selectedBank.short_name}
          ({selectedBank.full_name})
        {/if}
        <span class="bank-id">- {selectedBankId}</span>
      </span>
    </div>
  {/if}
</div>

<style>
  .bank-select-widget {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .select-wrapper :global(.select-icon) {
    position: absolute;
    left: 0.75rem;
    color: #9ca3af;
    pointer-events: none;
    z-index: 1;
  }

  :global([data-mode="dark"]) .select-wrapper :global(.select-icon) {
    color: var(--color-surface-400);
  }

  .select-wrapper :global(.chevron-icon) {
    position: absolute;
    right: 0.75rem;
    color: #9ca3af;
    pointer-events: none;
    z-index: 1;
  }

  :global([data-mode="dark"]) .select-wrapper :global(.chevron-icon) {
    color: var(--color-surface-400);
  }

  .select-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 2.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .select-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .select-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  :global([data-mode="dark"]) .select-input {
    background: rgb(var(--color-surface-700));
    border-color: rgb(var(--color-surface-600));
    color: var(--color-surface-100);
  }

  :global([data-mode="dark"]) .select-input:focus {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  :global([data-mode="dark"]) .select-input:disabled {
    background: rgb(var(--color-surface-800));
  }

  .select-input option {
    background: white;
    color: #111827;
    padding: 0.5rem;
  }

  :global([data-mode="dark"]) .select-input option {
    background: rgb(var(--color-surface-700));
    color: var(--color-surface-100);
  }

  .error-message {
    padding: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #991b1b;
    font-size: 0.75rem;
  }

  :global([data-mode="dark"]) .error-message {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: rgb(var(--color-error-200));
  }

  .selected-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #1e40af;
  }

  :global([data-mode="dark"]) .selected-info {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
    color: rgb(var(--color-primary-200));
  }

  .selected-info :global(svg) {
    flex-shrink: 0;
  }

  .selected-text {
    flex: 1;
  }

  .bank-id {
    color: #64748b;
    font-size: 0.7rem;
  }

  :global([data-mode="dark"]) .bank-id {
    color: rgb(var(--color-surface-400));
  }
</style>
