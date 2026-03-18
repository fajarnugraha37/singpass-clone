<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../lib/rpc';
  import type { AuthSessionResponse } from '@vibe/shared/contracts/auth';

  let session = $state<AuthSessionResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const res = await client.api.auth.session.$get();
      if (res.ok) {
        session = await res.json();
      } else if (res.status === 401) {
        error = 'Unauthorized';
      } else {
        error = 'Failed to load session';
      }
    } catch (e) {
      console.error('[SessionInfo] Fetch error:', e);
      error = 'Network error';
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-4 border rounded shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
  {#if loading}
    <div class="flex items-center space-x-2 animate-pulse">
      <div class="w-4 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
      <div class="h-4 bg-gray-200 rounded w-24 dark:bg-gray-700"></div>
    </div>
  {:else if error === 'Unauthorized'}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Not logged in. <a href="/auth" class="text-blue-600 hover:underline dark:text-blue-400">Sign in</a>
    </div>
  {:else if error}
    <div class="text-sm text-red-600 dark:text-red-400">
      {error}
    </div>
  {:else if session}
    <div class="flex items-center justify-between">
      <div>
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Active Session</span>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{session.clientName}</h3>
      </div>
      <div class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-200">
        {session.status}
      </div>
    </div>
    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Expires: {new Date(session.expiresAt).toLocaleString()}
    </div>
  {/if}
</div>
