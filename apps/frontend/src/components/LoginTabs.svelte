<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
  import QRPlaceholder from './QRPlaceholder.svelte';
  import LoginForm from './LoginForm.svelte';

  type Tab = 'app' | 'password';

  let activeTab = $state<Tab>('password');

  function setTab(tab: Tab) {
    activeTab = tab;
  }
</script>

<div class="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-singpass-gray-100 overflow-hidden">
  <!-- Tabs Navigation -->
  <div role="tablist" aria-label="Login methods" class="flex border-b border-singpass-gray-200 bg-singpass-light/50">
    <button
      class="flex-1 py-4 text-sm font-semibold transition-all duration-200 border-b-2 {activeTab === 'app' ? 'border-singpass-red text-singpass-red bg-white' : 'border-transparent text-singpass-gray-700 hover:text-singpass-dark'}"
      onclick={() => setTab('app')}
      aria-selected={activeTab === 'app'}
      role="tab"
    >
      {i18n.t('login.tab.app')}
    </button>
    <button
      class="flex-1 py-4 text-sm font-semibold transition-all duration-200 border-b-2 {activeTab === 'password' ? 'border-singpass-red text-singpass-red bg-white' : 'border-transparent text-singpass-gray-700 hover:text-singpass-dark'}"
      onclick={() => setTab('password')}
      aria-selected={activeTab === 'password'}
      role="tab"
    >
      {i18n.t('login.tab.password')}
    </button>
  </div>

  <!-- Tab Content -->
  <div class="p-6 md:p-8">
    {#if activeTab === 'app'}
      <div class="flex flex-col items-center">
        <QRPlaceholder />
      </div>
    {:else}
      <LoginForm />
    {/if}
  </div>

  <!-- Bottom link -->
  <div class="px-6 py-4 bg-singpass-light/30 border-t border-singpass-gray-100 text-center">
    <a href="#" class="text-xs text-singpass-red font-medium hover:underline transition-all">
      {i18n.t('login.form.reset')}
    </a>
  </div>
</div>

<style>
  /* Transition for tab underline */
  button {
    outline: none;
  }
</style>
