<script lang="ts">
  let error = $state<any>(null);

  export function onError(e: any) {
    error = e;
  }
</script>

{#if error}
  <div class="p-4 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
    <h4 class="font-bold">Something went wrong</h4>
    <p class="text-sm">{error.message || 'An unexpected error occurred.'}</p>
    <button 
      on:click={() => error = null}
      class="mt-2 text-xs underline hover:no-underline"
    >
      Try again
    </button>
  </div>
{:else}
  <slot />
{/if}
