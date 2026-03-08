<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
</script>

<header class="bg-white border-b border-singpass-gray-200 sticky top-0 z-50">
  <div class="container-singpass h-16 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/" class="block" aria-label={i18n.t('header.logo.aria')}>
        <img 
          src="/src/assets/icons/SingpassLogo.svg" 
          alt="Singpass Logo" 
          class="h-10 w-auto"
        />
      </a>
      <div class="hidden md:block border-l border-singpass-gray-300 h-6 mx-2"></div>
      <div class="hidden md:block text-xs text-singpass-gray-500 font-medium">
        {i18n.t('header.trusted')}
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <nav class="hidden lg:flex items-center gap-6 mr-4" aria-label="Main Navigation">
        <a href="#" class="text-xs font-semibold text-singpass-dark hover:text-singpass-red transition-colors">{i18n.t('header.nav.services')}</a>
        <a href="#" class="text-xs font-semibold text-singpass-dark hover:text-singpass-red transition-colors">{i18n.t('header.nav.business')}</a>
        <a href="#" class="text-xs font-semibold text-singpass-dark hover:text-singpass-red transition-colors">{i18n.t('header.nav.help')}</a>
      </nav>
      <LanguageSwitcher />
    </div>
  </div>
</header>
