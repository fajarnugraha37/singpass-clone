<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
</script>

<footer class="bg-singpass-gray-100 border-t border-singpass-gray-200 mt-auto pt-10 pb-16">
  <div class="container-singpass">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start mb-12">
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-singpass-dark uppercase tracking-wider">{i18n.t('footer.contact.title')}</h4>
        <p class="text-[10px] leading-relaxed text-singpass-gray-500">
          {i18n.t('footer.contact.text')}
        </p>
        <div class="flex gap-4">
          <a href="javascript:void(0)" class="text-singpass-gray-400 hover:text-singpass-red transition-colors" aria-label={i18n.t('footer.social.facebook')}>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="javascript:void(0)" class="text-singpass-gray-400 hover:text-singpass-red transition-colors" aria-label={i18n.t('footer.social.linkedin')}>
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
        </div>
      </div>
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-singpass-dark uppercase tracking-wider">{i18n.t('footer.help.title')}</h4>
        <ul class="space-y-2">
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">FAQs</a></li>
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Developer Portal</a></li>
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Partner Portal</a></li>
        </ul>
      </div>
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-singpass-dark uppercase tracking-wider">{i18n.t('footer.about.title')}</h4>
        <ul class="space-y-2">
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Introduction</a></li>
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Media Center</a></li>
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Security Advisory</a></li>
        </ul>
      </div>
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-singpass-dark uppercase tracking-wider">{i18n.t('footer.vulnerability.title')}</h4>
        <ul class="space-y-2">
          <li><a href="javascript:void(0)" class="text-[10px] text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">Report Vulnerability</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-singpass-gray-200 pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
      <div class="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2">
        <a href="javascript:void(0)" class="text-[10px] font-medium text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">{i18n.t('footer.links.privacy')}</a>
        <a href="javascript:void(0)" class="text-[10px] font-medium text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">{i18n.t('footer.links.terms')}</a>
        <a href="javascript:void(0)" class="text-[10px] font-medium text-singpass-gray-500 hover:text-singpass-red transition-colors underline-offset-2 hover:underline">{i18n.t('footer.links.rate')}</a>
      </div>
      <div class="text-center lg:text-right space-y-1">
        <p class="text-[10px] text-singpass-gray-500">
          {i18n.t('footer.copyright')}
        </p>
        <p class="text-[10px] text-singpass-gray-400 italic">
          {i18n.t('footer.last_updated')} {today}
        </p>
      </div>
    </div>
  </div>
</footer>
