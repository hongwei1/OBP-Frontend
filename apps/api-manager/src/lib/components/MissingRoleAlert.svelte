<script lang="ts">
  import { ShieldCheck } from "@lucide/svelte";
  import MessageBox from "$lib/components/MessageBox.svelte";
  import { rolesCache } from "$lib/stores/rolesCache.svelte";
  import { currentBank } from "$lib/stores/currentBank.svelte";
  import { onMount } from "svelte";

  interface Props {
    roles: string[];
    errorCode?: string;
    message?: string;
    bankId?: string;
  }

  let { roles, errorCode, message, bankId }: Props = $props();

  let isExpanded = $state(false);
  let isSubmitting = $state(false);
  let submitSuccess = $state(false);
  let submitError = $state<string | null>(null);
  let rolesMetadata = $state<Map<string, boolean>>(new Map());
  let loadingMetadata = $state(false);
  let selectedBankId = $state(currentBank.bankId);
  // "bank" = bank-scoped (send bank_id), "system" = system-wide (send empty string)
  let scopeChoice = $state<"bank" | "system">("bank");

  $effect(() => {
    selectedBankId = currentBank.bankId;
  });

  // Fetch role metadata on mount
  onMount(async () => {
    loadingMetadata = true;
    try {
      await rolesCache.fetchRoles();
      // Build a map of role name -> requires_bank_id
      const metadataMap = new Map<string, boolean>();
      roles.forEach((roleName) => {
        metadataMap.set(roleName, rolesCache.requiresBankId(roleName));
      });
      rolesMetadata = metadataMap;

      // Default scope based on whether role requires bank_id
      const anyRequiresBank = Array.from(metadataMap.values()).some((v) => v);
      if (!anyRequiresBank) {
        scopeChoice = "system";
      } else {
        scopeChoice = "bank";
      }
    } catch (error) {
      console.error("Failed to fetch role metadata:", error);
    } finally {
      loadingMetadata = false;
    }
  });

  // Check if any role requires bank_id
  let requiresBankId = $derived(
    Array.from(rolesMetadata.values()).some((requires) => requires),
  );

  // The effective bank_id to use: empty for system-wide, otherwise provided prop or currentBank
  let effectiveBankId = $derived(
    scopeChoice === "system" ? "" : (bankId || selectedBankId)
  );

  async function handleRequestClick() {
    if (isSubmitting) return;

    // Validate bank selection if bank-scoped
    if (scopeChoice === "bank" && !bankId && !selectedBankId) {
      submitError = "Please select a bank in My Account for this bank-scoped role.";
      return;
    }

    isSubmitting = true;
    submitError = null;

    try {
      // Submit entitlement request for each missing role
      for (const role of roles) {
        const requestBody: any = {
          role_name: role,
          // Always send bank_id - use empty string for system-wide roles
          bank_id: effectiveBankId || "",
        };

        const response = await fetch("/api/rbac/entitlement-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to submit entitlement request",
          );
        }
      }

      submitSuccess = true;
    } catch (error) {
      submitError =
        error instanceof Error ? error.message : "Failed to submit request";
      isSubmitting = false;
    }
  }
</script>

<div class="alert alert-missing-role" class:expanded={isExpanded}>
  <button
    type="button"
    class="alert-header"
    onclick={() => isExpanded = !isExpanded}
  >
    <span class="alert-icon">🔒</span>
    <span class="alert-title">
      <strong>Missing Entitlement{roles.length > 1 ? "s" : ""}:</strong>
      <span class="role-preview">{roles.join(", ")}</span>
    </span>
    {#if errorCode}
      <span class="error-code">OBP-{errorCode}</span>
    {/if}
    <span class="expand-icon">{isExpanded ? "▼" : "▶"}</span>
  </button>

  {#if isExpanded}
    <div class="alert-content">
      <div class="entitlement-list">
        {#each roles as role}
          <div class="entitlement-name">{role}</div>
        {/each}
      </div>

      <!-- Role scope display (auto-determined from role metadata) -->
      {#if bankId}
        <div class="scope-display scope-bank">
          <strong>Bank-level role</strong> — Bank: <code class="bank-code">{bankId}</code>
        </div>
      {:else if scopeChoice === "bank"}
        <div class="scope-display scope-bank">
          <strong>Bank-level role</strong>
          {#if selectedBankId}
            — Bank: <code class="bank-code">{selectedBankId}</code>
          {:else}
            — <a href="/user" class="bank-select-link">select a bank</a> first
          {/if}
        </div>
      {:else}
        <div class="scope-display scope-system">
          <strong>System-wide role</strong> — no bank required
        </div>
      {/if}

      {#if message}
        <MessageBox {message} type="error" />
      {/if}

      {#if submitError}
        <MessageBox message={submitError} type="error" />
      {/if}

      {#if submitSuccess}
        <div class="submit-success">
          Thanks, an Entitlement Request has been generated. Please ask your administrator to accept it using the <a href="/rbac/entitlement-requests" class="entitlement-requests-link">Entitlement Requests page</a>.
        </div>
      {:else}
        <div class="alert-actions">
          <button
            class="btn-request"
            onclick={handleRequestClick}
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <span class="spinner">⏳</span>
              Submitting...
            {:else}
              <ShieldCheck size={18} />
              Request Entitlement
            {/if}
          </button>
        </div>
      {/if}

      <div class="tip-box">
        <strong>💡 Tip:</strong> If you have recently been granted this entitlement,
        you should <strong>log out and log back in</strong> again.
      </div>
    </div>
  {/if}
</div>

<style>
  .alert {
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .alert-missing-role {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    color: #92400e;
    padding: 0.75rem 1rem;
  }

  .alert-missing-role.expanded {
    padding: 1rem 1.25rem;
  }

  :global([data-mode="dark"]) .alert-missing-role {
    background: rgb(var(--color-warning-900));
    border-color: rgb(var(--color-warning-600));
    color: rgb(var(--color-warning-200));
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    color: inherit;
  }

  .alert-header:hover {
    opacity: 0.9;
  }

  .expanded .alert-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  :global([data-mode="dark"]) .expanded .alert-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .alert-title {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .role-preview {
    font-weight: normal;
    font-size: 0.8125rem;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .expand-icon {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-left: auto;
    flex-shrink: 0;
  }

  .alert-content {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .alert-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .error-code {
    font-size: 0.75rem;
    font-family: monospace;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    margin-left: auto;
  }

  :global([data-mode="dark"]) .error-code {
    background: rgba(255, 255, 255, 0.1);
  }

  .entitlement-list {
    margin: 1rem 0;
  }

  .entitlement-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: #78350f;
    margin: 0.5rem 0;
  }

  :global([data-mode="dark"]) .entitlement-name {
    color: rgb(var(--color-warning-100));
  }

  .bank-code {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .bank-code {
    background: rgba(255, 255, 255, 0.15);
  }

  .alert-actions {
    margin-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 1rem;
  }

  :global([data-mode="dark"]) .alert-actions {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .btn-request {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #51b265;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-request:hover {
    background: #3d9e52;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .btn-request:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  :global([data-mode="dark"]) .btn-request {
    background: #51b265;
  }

  :global([data-mode="dark"]) .btn-request:hover {
    background: #3d9e52;
  }

  .btn-request:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .submit-success {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 4px;
    color: #065f46;
    font-size: 0.875rem;
    font-weight: 600;
  }

  :global([data-mode="dark"]) .submit-success {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
    color: rgb(var(--color-success-200));
  }

  .submit-success :global(.entitlement-requests-link) {
    color: #1e40af;
    text-decoration: underline;
    font-weight: 600;
  }

  .submit-success :global(.entitlement-requests-link:hover) {
    color: #1d4ed8;
  }

  :global([data-mode="dark"]) .submit-success :global(.entitlement-requests-link) {
    color: #93c5fd;
  }

  :global([data-mode="dark"]) .submit-success :global(.entitlement-requests-link:hover) {
    color: #bfdbfe;
  }

  .tip-box {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :global([data-mode="dark"]) .tip-box {
    background: rgba(59, 130, 246, 0.15);
    border-left-color: rgb(var(--color-primary-500));
  }


  .scope-display {
    margin: 0.75rem 0;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .scope-display.scope-bank {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #92400e;
  }

  .scope-display.scope-system {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #1e40af;
  }

  :global([data-mode="dark"]) .scope-display.scope-bank {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }

  :global([data-mode="dark"]) .scope-display.scope-system {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: rgb(var(--color-primary-300));
  }

  .bank-select-link {
    color: #1e40af;
    text-decoration: underline;
    font-weight: 600;
  }

  .bank-select-link:hover {
    color: #1d4ed8;
  }

  :global([data-mode="dark"]) .bank-select-link {
    color: rgb(var(--color-primary-300));
  }

  :global([data-mode="dark"]) .bank-select-link:hover {
    color: rgb(var(--color-primary-200));
  }

</style>
