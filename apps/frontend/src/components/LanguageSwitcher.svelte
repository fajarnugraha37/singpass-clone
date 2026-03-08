<script lang="ts">
  import { i18n, type Locale } from '../lib/i18n.svelte';

  const languages: { code: Locale; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'zh', label: 'Mandarin', native: '简体中文' },
    { code: 'ms', label: 'Malay', native: 'Bahasa Melayu' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' }
  ];

  let isOpen = $state(false);

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectLanguage(code: Locale) {
    i18n.setLocale(code);
    isOpen = false;
  }

  const currentLangLabel = $derived(languages.find(l => l.code === i18n.locale)?.label || 'English');
</script>

<div class="relative inline-block text-left">
  <div>
    <button
      type="button"
      class="inline-flex items-center justify-center w-full rounded-md border border-singpass-gray-300 shadow-sm px-3 py-1.5 bg-white text-xs font-bold text-singpass-dark hover:bg-singpass-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-singpass-red transition-all"
      id="menu-button"
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label={i18n.t('header.lang.aria')}
      onclick={toggleDropdown}
    >
      {currentLangLabel}
      <svg class="-mr-1 ml-2 h-4 w-4 text-singpass-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  {#if isOpen}
    <div
      class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-singpass-gray-100 focus:outline-none z-[100] animate-in fade-in zoom-in-95 duration-100"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div class="py-1" role="none">
        {#each languages as lang}
          <button
            class="flex items-center justify-between w-full text-left px-4 py-2.5 text-xs {i18n.locale === lang.code ? 'bg-singpass-light text-singpass-red font-bold' : 'text-singpass-gray-500 hover:bg-singpass-gray-50 hover:text-singpass-dark'} transition-colors"
            role="menuitem"
            tabindex="-1"
            aria-current={i18n.locale === lang.code ? 'true' : undefined}
            onclick={() => selectLanguage(lang.code)}
          >
            <span lang={lang.code}>{lang.native}</span>
            {#if i18n.locale === lang.code}
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Backdrop to close dropdown -->
    <button
      type="button"
      class="fixed inset-0 h-full w-full bg-transparent z-[90] cursor-default"
      onclick={toggleDropdown}
      aria-hidden="true"
    ></button>
  {/if}
</div>
