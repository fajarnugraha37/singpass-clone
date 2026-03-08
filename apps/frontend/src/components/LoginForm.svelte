<script lang="ts">
  import { client } from '../lib/rpc';

  let username = '';
  let password = '';
  let error = '';
  let isLoading = false;

  export let onSuccess: () => void;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    isLoading = true;

    try {
      // POST /api/auth/api/login (using the router structure)
      // Note: Hono RPC client paths follow the app.route structure
      const res = await client.api.auth.api.login.$post({
        json: { username, password }
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        error = data.error || 'Login failed';
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'An unexpected error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
      {error}
    </div>
  {/if}

  <div>
    <label for="username" class="block text-sm font-medium text-gray-700">Singpass ID (NRIC)</label>
    <div class="mt-1">
      <input
        id="username"
        name="username"
        type="text"
        required
        bind:value={username}
        class="appearance-none block w-full px-3 py-2 border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
        placeholder="e.g. S1234567A"
      />
    </div>
  </div>

  <div>
    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
    <div class="mt-1">
      <input
        id="password"
        name="password"
        type="password"
        required
        bind:value={password}
        class="appearance-none block w-full px-3 py-2 border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
      />
    </div>
  </div>

  <div>
    <button
      type="submit"
      disabled={isLoading}
      class="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
    >
      {isLoading ? 'Logging in...' : 'Log in'}
    </button>
  </div>
</form>
