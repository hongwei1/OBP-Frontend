<script lang="ts">
  import MissingRoleAlert from "$lib/components/MissingRoleAlert.svelte";
  import type { RoleRequirement } from "$lib/utils/roleChecker";
  import { checkRoles } from "$lib/utils/roleChecker";
  import type { Snippet } from "svelte";

  interface Props {
    userEntitlements: any[];
    required: RoleRequirement[];
    optional?: RoleRequirement[];
    currentBankId?: string;
    children?: Snippet;
  }

  let { userEntitlements, required, optional, currentBankId, children }: Props =
    $props();

  // Check required roles (OR logic — need at least one)
  let requiredCheck = $derived.by(() => {
    return checkRoles(userEntitlements || [], required || [], currentBankId);
  });

  let showContent = $derived(requiredCheck.hasAllRoles);

  // Check optional roles (informational — content still renders)
  let optionalCheck = $derived.by(() => {
    if (!optional || optional.length === 0) return null;
    return checkRoles(userEntitlements || [], optional, currentBankId);
  });

  let missingOptionalRoles = $derived(
    optionalCheck && !optionalCheck.hasAllRoles
      ? optionalCheck.missingRoles
      : [],
  );
</script>

{#if requiredCheck.missingRoles.length > 0}
  <div class="role-alerts">
    {#each requiredCheck.missingRoles as missingRole}
      <MissingRoleAlert
        roles={[missingRole.role]}
        bankId={missingRole.bankId || undefined}
        message={`You need the following role to access this page: ${missingRole.role}`}
      />
    {/each}
  </div>
{/if}

{#if showContent && children}
  {#if missingOptionalRoles.length > 0}
    <div class="optional-role-note">
      <span class="note-icon">&#x2139;&#xFE0F;</span>
      <span>
        Some actions on this page require additional roles:
        {missingOptionalRoles.map((r) => r.role).join(", ")}
      </span>
    </div>
  {/if}
  {@render children()}
{/if}

<style>
  .role-alerts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .optional-role-note {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 0.5rem;
    color: #1e40af;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  :global([data-mode="dark"]) .optional-role-note {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
    color: #93c5fd;
  }

  .note-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }
</style>
