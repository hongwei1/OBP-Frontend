<script lang="ts">
  import { currentBank } from "$lib/stores/currentBank.svelte";

  const bank = $derived(currentBank.bank);
</script>

{#if bank}
  <span class="text-sm">for {bank.short_name}</span>
{/if}
