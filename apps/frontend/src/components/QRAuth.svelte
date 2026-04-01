<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';
  import { pollQRStatus, type PollResult } from '../lib/singpass-polling';
  import { i18n } from '../lib/i18n.svelte';

  let sessionId = $state('');
  let qrDataUrl = $state('');
  let status = $state<'PENDING' | 'AUTHORIZED' | 'CANCELLED' | 'EXPIRED' | 'ERROR' | 'LOADING'>('LOADING');
  let countdown = $state(60);
  let timer: any;
  let abortController: AbortController | null = null;

  async function initSession() {
    if (abortController) {
      abortController.abort();
    }
    
    status = 'LOADING';
    try {
      const response = await fetch('/api/auth/singpass/qr/init', { method: 'POST' });
      if (!response.ok) throw new Error('Init failed');
      const data = await response.json();
      
      sessionId = data.sessionId;
      qrDataUrl = await QRCode.toDataURL(data.qrUrl, { margin: 2, width: 300 });
      status = 'PENDING';
      countdown = data.expiresIn || 60;
      
      startPolling();
      startCountdown();
    } catch (err) {
      console.error('Failed to init QR:', err);
      status = 'ERROR';
    }
  }

  function startPolling() {
    abortController = new AbortController();
    pollQRStatus(sessionId, (result) => {
      status = result.status;
      if (status === 'AUTHORIZED' && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    }, abortController.signal);
  }

  function startCountdown() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (countdown > 0) {
        countdown--;
      } else {
        status = 'EXPIRED';
        clearInterval(timer);
        if (abortController) abortController.abort();
      }
    }, 1000);
  }

  onMount(() => {
    initSession();
    return () => {
      if (timer) clearInterval(timer);
      if (abortController) abortController.abort();
    };
  });
</script>

<div class="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-singpass-gray-200 min-h-[350px]">
  <div class="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
    {#if status === 'LOADING'}
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-singpass-red border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-xs text-singpass-gray-500">{i18n.t('login.qr.loading')}</p>
      </div>
    {:else if status === 'ERROR'}
      <div class="text-center p-4">
        <svg class="w-12 h-12 text-singpass-red mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm text-singpass-gray-700 mb-4">{i18n.t('login.qr.error')}</p>
        <button 
          onclick={initSession}
          class="px-4 py-2 bg-singpass-red text-white text-sm font-bold rounded hover:bg-red-700 transition-colors"
        >
          {i18n.t('login.qr.retry')}
        </button>
      </div>
    {:else if status === 'EXPIRED'}
      <div class="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-center p-4 rounded-lg">
        <p class="text-sm font-bold text-singpass-gray-900 mb-4">{i18n.t('login.qr.expired')}</p>
        <button 
          onclick={initSession}
          class="px-4 py-2 bg-singpass-red text-white text-sm font-bold rounded hover:bg-red-700 transition-colors"
        >
          {i18n.t('login.qr.retry')}
        </button>
      </div>
      {#if qrDataUrl}
        <img src={qrDataUrl} alt="Expired QR Code" class="w-full h-full opacity-20 grayscale" />
      {/if}
    {:else if status === 'CANCELLED'}
      <div class="text-center p-4">
        <svg class="w-12 h-12 text-singpass-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <p class="text-sm text-singpass-gray-700 mb-4">{i18n.t('login.qr.cancelled')}</p>
        <button 
          onclick={initSession}
          class="px-4 py-2 bg-singpass-red text-white text-sm font-bold rounded hover:bg-red-700 transition-colors"
        >
          {i18n.t('login.qr.retry')}
        </button>
      </div>
    {:else}
      {#if qrDataUrl}
        <img src={qrDataUrl} alt={i18n.t('login.qr.title')} class="w-full h-full" />
      {/if}
      
      {#if status === 'PENDING' && countdown <= 10}
        <div class="absolute bottom-2 right-2 bg-singpass-red text-white text-[10px] px-2 py-1 rounded-full animate-pulse">
          Expires in {countdown}s
        </div>
      {/if}
    {/if}
  </div>
  
  <p class="mt-6 text-sm text-singpass-gray-500 font-medium text-center">
    {status === 'PENDING' ? i18n.t('login.qr.description') : ''}
  </p>
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
