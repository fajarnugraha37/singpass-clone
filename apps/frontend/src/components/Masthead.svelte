<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
</script>

<div class="bg-singpass-gray-100 py-1.5 border-b border-singpass-gray-200">
  <div class="container-singpass flex items-center gap-1.5 text-[10px] text-singpass-gray-500 font-medium">
    <img 
      src="https://www.common.gov.sg/assets/img/lion-head-symbol.png" 
      alt="Singapore Lion Head Symbol" 
      class="h-3.5 w-auto"
    />
    <span>{i18n.t('masthead.agency')}</span>
  </div>
</div>
