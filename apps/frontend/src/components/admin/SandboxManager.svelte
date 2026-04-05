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
