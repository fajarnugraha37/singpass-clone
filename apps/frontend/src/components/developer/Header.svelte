<script lang="ts">
  import { mgmtAuth } from '../../lib/mgmt-auth.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    const isDev = window.location.pathname.startsWith('/developer');
    const isLogin = window.location.pathname.endsWith('/login');
    if (!isLogin) {
      mgmtAuth.checkMe(isDev ? '/developer/login' : '/admin/login');
    }
  });
</script>

<nav class="bg-white shadow-sm border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <a href="/developer" class="flex-shrink-0 flex items-center">
          <span class="text-xl font-bold text-indigo-600">Vibe-Auth</span>
          <span class="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded uppercase tracking-wider">Dev Portal</span>
        </a>
      </div>
      
      <div class="flex items-center">
        {#if mgmtAuth.user}
          <div class="mr-4 text-sm text-gray-600">
            {mgmtAuth.user.email}
          </div>
          <button
            onclick={() => mgmtAuth.logout()}
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        {:else if mgmtAuth.loading}
          <div class="animate-pulse flex space-x-4">
            <div class="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>
