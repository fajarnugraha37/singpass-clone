<script lang="ts">
  import { onMount } from 'svelte';
  import { client } from '../../lib/rpc';

  let users = $state<any[]>([]);
  let loading = $state(true);
  let cursor = $state<string | null>(null);
  let nextCursor = $state<string | null>(null);
  let status = $state('');

  async function fetchUsers(reset = true) {
    loading = true;
    if (reset) {
      users = [];
      cursor = null;
    }

    try {
      const res = await client.api.mgmt.admin.sandbox.users.$get({
        query: { limit: 20, cursor: cursor || undefined }
      });

      if (res.ok) {
        const data = await res.json() as any;
        if (reset) {
          users = data.items;
        } else {
          users = [...users, ...data.items];
        }
        nextCursor = data.nextCursor;
      }
    } finally {
      loading = false;
    }
  }

  async function createSandboxUser() {
    status = 'Generating...';
    const res = await client.api.mgmt.admin.sandbox.users.$post({
      json: { generateMockData: true, nric: '', password: 'test1234' }
    });

    if (res.ok) {
      status = 'User generated successfully!';
      await fetchUsers();
    } else {
      status = 'Generation failed';
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this sandbox user?')) return;
    const res = await client.api.mgmt.admin.sandbox.users[':userId'].$delete({
      param: { userId }
    });
    if (res.ok) {
      await fetchUsers();
    }
  }

  async function toggleStatus(u: any) {
    const newStatus = u.accountType === 'deactivated' ? 'active' : 'deactivated';
    const res = await client.api.mgmt.admin.sandbox.users[':userId'].status.$patch({
      param: { userId: u.id },
      json: { status: newStatus }
    });
    if (res.ok) {
      await fetchUsers();
    }
  }

  async function resetPassword(userId: string) {
    const newPassword = prompt('Enter new password (leave blank for test1234):');
    if (newPassword === null) return; // cancelled
    
    const res = await client.api.mgmt.admin.sandbox.users[':userId']['reset-password'].$post({
      param: { userId },
      json: { newPassword: newPassword || 'test1234' }
    });
    
    if (res.ok) {
      const data = await res.json() as any;
      alert(`Password successfully reset to: ${data.password}`);
    } else {
      alert('Failed to reset password');
    }
  }

  let showEditModal = $state(false);
  let editingUserAttributes = $state('');
  let editingUserId = $state<string | null>(null);

  async function openEditModal(userId: string) {
    const res = await client.api.mgmt.admin.sandbox.users[':userId'].$get({
      param: { userId }
    });
    if (res.ok) {
      const data = await res.json() as any;
      editingUserId = userId;
      editingUserAttributes = JSON.stringify(data.myinfoPayload, null, 2);
      showEditModal = true;
    }
  }

  async function saveAttributes() {
    if (!editingUserId) return;
    try {
      const myinfoPayload = JSON.parse(editingUserAttributes);
      const res = await client.api.mgmt.admin.sandbox.users[':userId'].attributes.$put({
        param: { userId: editingUserId },
        json: { myinfoPayload }
      });
      if (res.ok) {
        showEditModal = false;
        await fetchUsers();
      } else {
        alert('Failed to save attributes');
      }
    } catch (e) {
      alert('Invalid JSON format');
    }
  }

  onMount(fetchUsers);
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h3 class="text-lg font-medium text-gray-900">Singpass Sandbox Users</h3>
    <div class="flex items-center space-x-4">
      {#if status}
        <span class="text-sm text-indigo-600 font-medium">{status}</span>
      {/if}
      <button
        onclick={createSandboxUser}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Faker: Generate User
      </button>
    </div>
  </div>

  <div class="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
    {#if loading && users.length === 0}
      <div class="p-10 text-center text-gray-500">Loading sandbox users...</div>
    {:else if users.length === 0}
      <div class="p-10 text-center text-gray-500">No sandbox users found.</div>
    {:else}
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NRIC</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each users as u}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{u.nric}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {u.name}
                <div class="text-xs text-gray-500">{u.email}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button 
                  onclick={() => toggleStatus(u)}
                  class="px-2 py-1 text-xs font-semibold rounded-full hover:opacity-80 {u.accountType !== 'deactivated' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}"
                  title="Click to toggle status"
                >
                  {u.accountType !== 'deactivated' ? 'Active' : 'Deactivated'}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                <button onclick={() => openEditModal(u.id)} class="text-blue-600 hover:text-blue-900">Edit Profile</button>
                <button onclick={() => resetPassword(u.id)} class="text-indigo-600 hover:text-indigo-900">Reset PW</button>
                <button onclick={() => deleteUser(u.id)} class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if nextCursor}
        <div class="p-4 text-center border-t border-gray-200">
          <button
            onclick={() => { cursor = nextCursor; fetchUsers(false); }}
            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Load More
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if showEditModal}
  <div class="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick={() => showEditModal = false}></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Edit MyInfo Attributes</h3>
        <p class="text-sm text-gray-500 mb-4">Modify the raw JSON payload for this sandbox user's MyInfo profile.</p>
        <textarea
          bind:value={editingUserAttributes}
          class="w-full h-96 p-3 font-mono text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        ></textarea>
        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button onclick={saveAttributes} class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:col-start-2 sm:text-sm">Save Changes</button>
          <button onclick={() => showEditModal = false} class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm">Cancel</button>
        </div>
      </div>
    </div>
  </div>
{/if}
