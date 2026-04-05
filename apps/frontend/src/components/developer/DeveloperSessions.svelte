<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../../lib/rpc';

  let items = $state<any[]>([]);
  let loading = $state(true);
  let cursor = $state<string | null>(null);
  let nextCursor = $state<string | null>(null);

  async function fetchSessions(reset = true) {
    loading = true;
    if (reset) {
      items = [];
      cursor = null;
    }

    try {
      const query = { limit: 20, cursor: cursor || undefined };
      const res = await client.api.mgmt.me.sessions.$get({ query });

      if (res.ok) {
        const data = await res.json() as any;
        if (reset) {
          items = data.items;
        } else {
          items = [...items, ...data.items];
        }
        nextCursor = data.nextCursor;
      }
    } finally {
      loading = false;
    }
  }

  function loadMore() {
    cursor = nextCursor;
    fetchSessions(false);
  }

  async function revokeSession(sessionId: string) {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    const res = await client.api.mgmt.me.sessions[':sessionId'].$delete({
      param: { sessionId }
    });
    if (res.ok) {
      items = items.filter(i => i.id !== sessionId);
    } else {
      alert('Failed to revoke session');
    }
  }

  onMount(() => {
    fetchSessions();
  });
</script>

<div class="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mt-8">
  <div class="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Active Sessions for Your Clients</h3>
    <button onclick={() => fetchSessions(true)} class="text-sm text-indigo-600 hover:text-indigo-900">Refresh</button>
  </div>

  <div class="p-6">
    {#if loading && items.length === 0}
      <div class="text-center py-10 text-gray-500">Loading sessions...</div>
    {:else if items.length === 0}
      <div class="text-center py-10 text-gray-500">No active sessions found for your clients.</div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each items as item}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{item.id.substring(0, 16)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.clientId}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.expiresAt).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onclick={() => revokeSession(item.id)} class="text-red-600 hover:text-red-900">Revoke</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if nextCursor}
        <div class="mt-6 text-center">
          <button
            onclick={loadMore}
            disabled={loading}
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>
