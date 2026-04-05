<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../../lib/rpc';
  import { mgmtAuth } from '../../lib/mgmt-auth.svelte';

  let clients = $state<any[]>([]);
  let loading = $state(true);
  
  let showCreateModal = $state(false);
  let isEditing = $state(false);
  let editingClientId = $state<string | null>(null);

  let formName = $state('');
  let formAppType = $state('Login');
  let formUen = $state('');
  let formRedirectUris = $state('');
  
  let lastCreatedSecret = $state<string | null>(null);

  async function fetchClients() {
    loading = true;
    try {
      const res = await client.api.mgmt.me.clients.$get();
      if (res.ok) {
        const data = await res.json();
        clients = data.items;
      }
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    isEditing = false;
    editingClientId = null;
    formName = '';
    formAppType = 'Login';
    formUen = '';
    formRedirectUris = '';
    showCreateModal = true;
  }

  function openEditModal(c: any) {
    isEditing = true;
    editingClientId = c.id;
    formName = c.name;
    formAppType = c.appType;
    formUen = c.uen;
    formRedirectUris = c.redirectUris.join(', ');
    showCreateModal = true;
  }

  async function submitClientForm() {
    const payload = {
      name: formName,
      appType: formAppType,
      uen: formUen,
      redirectUris: formRedirectUris.split(',').map(u => u.trim()),
      allowedScopes: ['openid', 'profile'],
      grantTypes: ['authorization_code'],
    };

    if (isEditing && editingClientId) {
      const res = await client.api.mgmt.me.clients[':clientId'].$put({
        param: { clientId: editingClientId },
        json: payload
      });
      if (res.ok) {
        showCreateModal = false;
        await fetchClients();
      }
    } else {
      const res = await client.api.mgmt.me.clients.$post({
        json: payload
      });

      if (res.ok) {
        const data = await res.json() as any;
        lastCreatedSecret = data.clientSecret;
        showCreateModal = false;
        await fetchClients();
      }
    }
  }

  async function toggleStatus(c: any) {
    const res = await client.api.mgmt.me.clients[':clientId'].status.$patch({
      param: { clientId: c.id },
      json: { isActive: !c.isActive }
    });
    if (res.ok) {
      await fetchClients();
    }
  }

  async function rotateSecret(clientId: string) {
    if (!confirm('Are you sure you want to rotate the secret? The old secret will be invalidated immediately.')) return;
    const res = await client.api.mgmt.me.clients[':clientId']['rotate-secret'].$post({
      param: { clientId }
    });
    if (res.ok) {
      const data = await res.json() as any;
      alert(`New secret: ${data.newSecret}\n\nPLEASE SAVE THIS SOMEWHERE SAFE. It will not be shown again.`);
    }
  }

  async function deleteClient(clientId: string) {
    if (!confirm('Are you sure you want to delete this client? All active sessions will be revoked.')) return;
    const res = await client.api.mgmt.me.clients[':clientId'].$delete({
      param: { clientId }
    });
    if (res.ok) {
      await fetchClients();
    }
  }

  onMount(fetchClients);
</script>

{#if !mgmtAuth.user}
  <div class="p-10 text-center text-gray-500">Authenticating...</div>
{:else}
  <div class="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
    <div class="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Your OIDC Clients</h3>
      <button
        onclick={openCreateModal}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Create Client
      </button>
    </div>

    {#if loading}
      <div class="p-10 text-center text-gray-500">Loading clients...</div>
    {:else if clients.length === 0}
      <div class="p-10 text-center text-gray-500">No clients registered yet.</div>
    {:else}
      <ul class="divide-y divide-gray-200">
        {#each clients as c}
          <li class="p-4 hover:bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-lg font-bold text-gray-900">{c.name}</div>
                <div class="text-sm text-gray-500">Client ID: <code class="bg-gray-100 px-1 rounded text-pink-600">{c.id}</code></div>
                <div class="mt-1 flex space-x-2">
                  <span class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">{c.appType}</span>
                  <button 
                    onclick={() => toggleStatus(c)} 
                    class="px-2 py-0.5 text-xs font-medium {c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded hover:opacity-80"
                    title="Click to toggle status"
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick={() => openEditModal(c)} class="text-xs text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                <button onclick={() => rotateSecret(c.id)} class="text-xs text-indigo-600 hover:text-indigo-900 font-medium">Rotate Secret</button>
                <button onclick={() => deleteClient(c.id)} class="text-xs text-red-600 hover:text-red-900 font-medium">Delete</button>
              </div>
            </div>
            <div class="mt-2 text-sm text-gray-600">
              <strong>Redirect URIs:</strong> {c.redirectUris.join(', ')}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if lastCreatedSecret}
    <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
      <div class="font-bold text-lg mb-1">⚠️ IMPORTANT: CLIENT SECRET CREATED</div>
      <p class="mb-2">This secret will only be shown ONCE. Please copy it now:</p>
      <code class="bg-white p-2 border border-yellow-200 rounded block text-xl font-mono select-all text-center">{lastCreatedSecret}</code>
      <button onclick={() => lastCreatedSecret = null} class="mt-3 text-sm font-bold underline">I have saved it</button>
    </div>
  {/if}

  {#if showCreateModal}
    <div class="fixed z-10 inset-0 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">{isEditing ? 'Edit OIDC Client' : 'Register New OIDC Client'}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">App Name</label>
              <input type="text" bind:value={formName} class="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500" placeholder="My Awesome App" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">App Type</label>
              <select bind:value={formAppType} class="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500">
                <option>Login</option>
                <option>Myinfo</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">UEN</label>
              <input type="text" bind:value={formUen} class="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500" placeholder="UEN12345678" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Redirect URIs (comma separated)</label>
              <input type="text" bind:value={formRedirectUris} class="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-indigo-500" placeholder="http://localhost:3000/callback" />
            </div>
          </div>
          <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button onclick={submitClientForm} class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:col-start-2 sm:text-sm">{isEditing ? 'Save' : 'Create'}</button>
            <button onclick={() => showCreateModal = false} class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
