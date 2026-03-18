<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '../lib/i18n.svelte';
  import { client } from '../lib/rpc';

  let { clientName: initialClientName } = $props<{ clientName?: string }>();
  let clientName = $state(initialClientName);

  onMount(async () => {
    // If not passed as prop, try to fetch from session
    if (!clientName) {
      try {
        const res = await client.api.auth.session.$get();
        if (res.ok) {
          const data = await res.json();
          if (data.clientName) {
            clientName = data.clientName;
          }
        }
      } catch (e) {
        // Silent failure if no session
      }
    }
  });
</script>

<div class="max-w-xl text-center lg:text-left">
  <h1 class="text-4xl md:text-5xl font-bold text-singpass-dark leading-tight mb-6">
    {#if clientName}
      Log in to {clientName}
    {:else}
      {i18n.t('login.header')}
    {/if}
  </h1>
  <p class="text-lg text-singpass-gray-500 mb-8 leading-relaxed">
    {i18n.t('login.hero.description')}
  </p>
  
  <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
    <div class="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-singpass-gray-200">
      <div class="w-10 h-10 bg-singpass-red rounded-lg flex items-center justify-center text-white font-bold italic">S</div>
      <div>
        <p class="text-[10px] text-singpass-gray-400 font-bold uppercase tracking-wider">{i18n.t('login.hero.get_app')}</p>
        <p class="text-xs font-bold text-singpass-dark">{i18n.t('login.tab.app')}</p>
      </div>
    </div>
  </div>
</div>
