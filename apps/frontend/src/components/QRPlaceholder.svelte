<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
</script>

<div class="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-singpass-gray-200">
  <div class="relative">
    <!-- QR Code SVG -->
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-48 h-48 md:w-56 md:h-56" role="img" aria-label={i18n.t('login.qr.title')}>
      <title>{i18n.t('login.qr.title')}</title>
      <rect width="200" height="200" rx="8" fill="#F2F2F2"/>
      <rect x="20" y="20" width="40" height="40" stroke="#212121" stroke-width="4"/>
      <rect x="140" y="20" width="40" height="40" stroke="#212121" stroke-width="4"/>
      <rect x="20" y="140" width="40" height="40" stroke="#212121" stroke-width="4"/>
      <rect x="30" y="30" width="20" height="20" fill="#212121"/>
      <rect x="150" y="30" width="20" height="20" fill="#212121"/>
      <rect x="30" y="150" width="20" height="20" fill="#212121"/>
      
      <!-- Pulsing squares to indicate activity -->
      <rect x="70" y="70" width="20" height="20" fill="#E31C3D">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="110" y="70" width="20" height="20" fill="#E31C3D">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="70" y="110" width="20" height="20" fill="#E31C3D">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="110" y="110" width="20" height="20" fill="#E31C3D">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
      </rect>
    </svg>
  </div>
  
  <p class="mt-6 text-sm text-singpass-gray-500 font-medium text-center">
    {i18n.t('login.qr.description')}
  </p>
</div>

<style>
  /* Extra styling if needed */
</style>
