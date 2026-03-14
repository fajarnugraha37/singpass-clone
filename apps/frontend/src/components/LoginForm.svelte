<script lang="ts">
  import { client } from '../lib/rpc';
  import NricInput from './NricInput.svelte';
  import PasswordInput from './PasswordInput.svelte';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let isLoading = $state(false);
  let isNricValid = $state(false);

  interface Props {
    onSuccess: () => void;
  }

  let { onSuccess }: Props = $props();

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!isNricValid) return;
    
    error = '';
    isLoading = true;

    try {
      // POST /api/auth/login
      const res = await client.api.auth.login.$post({
        json: { username, password }
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

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

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
      {error}
    </div>
  {/if}

  <NricInput 
    bind:value={username} 
    onchange={(val) => username = val}
    onvaliditychange={(isValid) => isNricValid = isValid}
  />

  <PasswordInput 
    bind:value={password} 
    onchange={(val) => password = val}
  />

  <div>
    <button
      type="submit"
      disabled={isLoading || !isNricValid || !password}
      class="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
    >
      {isLoading ? 'Logging in...' : 'Log in'}
    </button>
  </div>
</form>
