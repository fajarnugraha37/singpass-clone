<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../../lib/rpc';
  import SandboxManager from './SandboxManager.svelte';
  import { mgmtAuth } from '../../lib/mgmt-auth.svelte';

  let activeTab = $state<'developers' | 'clients' | 'sessions' | 'sandbox'>('developers');
  let items = $state<any[]>([]);
  let loading = $state(true);
  let cursor = $state<string | null>(null);
  let nextCursor = $state<string | null>(null);

  async function fetchItems(reset = true) {
    loading = true;
    if (reset) {
      items = [];
      cursor = null;
    }

    try {
      let res;
      const query = { limit: 20, cursor: cursor || undefined };

      if (activeTab === 'developers') {
        res = await client.api.mgmt.admin.developers.$get({ query });
      } else if (activeTab === 'clients') {
        res = await client.api.mgmt.admin.clients.$get({ query });
      } else {
        res = await client.api.mgmt.admin.sessions.$get({ query });
      }

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
    fetchItems(false);
  }

  async function revokeSession(sessionId: string) {
    if (!confirm('Revoke this session globally?')) return;
    const res = await client.api.mgmt.admin.sessions[':sessionId'].$delete({
      param: { sessionId }
    });
    if (res.ok) {
      items = items.filter(i => i.id !== sessionId);
    }
  }

  $effect(() => {
    activeTab;
    fetchItems();
  });
</script>

{#if !mgmtAuth.user}
  <div class="p-10 text-center text-gray-500">Authenticating...</div>
{:else}
  <div class="bg-white shadow rounded-lg border border-gray-200">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
        <button
          onclick={() => activeTab = 'developers'}
          class="{activeTab === 'developers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Developers
        </button>
        <button
          onclick={() => activeTab = 'clients'}
          class="{activeTab === 'clients' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          OIDC Clients
        </button>
        <button
          onclick={() => activeTab = 'sessions'}
          class="{activeTab === 'sessions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Active Sessions
        </button>
        <button
          onclick={() => activeTab = 'sandbox'}
          class="{activeTab === 'sandbox' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
        >
          Sandbox Users
        </button>
      </nav>
    </div>

    <div class="p-6">
      {#if activeTab === 'sandbox'}
        <SandboxManager />
      {:else if loading && items.length === 0}
        <div class="text-center py-10 text-gray-500">Loading {activeTab}...</div>
      {:else if items.length === 0}
        <div class="text-center py-10 text-gray-500">No {activeTab} found.</div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                {#if activeTab === 'developers'}
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                {:else if activeTab === 'clients'}
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {:else}
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                {/if}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each items as item}
                <tr>
                  {#if activeTab === 'developers'}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.role}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                  {:else if activeTab === 'clients'}
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-pink-600">{item.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full {item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  {:else}
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{item.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.clientId}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onclick={() => revokeSession(item.id)} class="text-red-600 hover:text-red-900">Revoke</button>
                    </td>
                  {/if}
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
{/if}
