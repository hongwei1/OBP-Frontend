<script lang="ts">
  import { apiActivity } from "$lib/stores/apiActivity";
</script>

{#if $apiActivity.isActive}
  <div class="api-indicator" class:pulsing={$apiActivity.isActive}></div>
{/if}

<style>
  .api-indicator {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 12px;
    height: 12px;
    background: oklch(68.5% 0.14 148.36deg);
    border-radius: 50%;
    z-index: 9999;
    box-shadow: 0 2px 8px oklch(68.5% 0.14 148.36deg / 0.4);
    animation: pulse-and-fade 3s ease-in-out infinite;
  }

  @keyframes pulse-and-fade {
    0% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 2px 8px oklch(68.5% 0.14 148.36deg / 0.4);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.3);
      box-shadow: 0 2px 16px oklch(68.5% 0.14 148.36deg / 0.6);
    }
    100% {
      opacity: 0.1;
      transform: scale(1);
      box-shadow: 0 2px 8px oklch(68.5% 0.14 148.36deg / 0.1);
    }
  }

  :global([data-mode="dark"]) .api-indicator {
    background: oklch(72.39% 0.11 211.15deg);
    box-shadow: 0 2px 8px oklch(72.39% 0.11 211.15deg / 0.4);
  }

  :global([data-mode="dark"]) .api-indicator {
    animation: pulse-and-fade-dark 3s ease-in-out infinite;
  }

  @keyframes pulse-and-fade-dark {
    0% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 2px 8px oklch(72.39% 0.11 211.15deg / 0.4);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.3);
      box-shadow: 0 2px 16px oklch(72.39% 0.11 211.15deg / 0.6);
    }
    100% {
      opacity: 0.1;
      transform: scale(1);
      box-shadow: 0 2px 8px oklch(72.39% 0.11 211.15deg / 0.1);
    }
  }
</style>
