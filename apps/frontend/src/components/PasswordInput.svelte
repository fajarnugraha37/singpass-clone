<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';

  interface Props {
    value: string;
    onchange: (val: string) => void;
  }

  let { value = $bindable(), onchange }: Props = $props();
  
  let showPassword = $state(false);

  function togglePassword() {
    showPassword = !showPassword;
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    onchange(target.value);
  }
</script>

<div class="flex flex-col space-y-1.5 w-full">
  <label for="password-input" class="text-sm font-semibold text-singpass-gray-500">
    {i18n.t('login.form.password.label')}
  </label>
  
  <div class="relative group">
    <input
      id="password-input"
      type={showPassword ? "text" : "password"}
      {value}
      class="w-full px-4 py-3 bg-singpass-light border border-singpass-gray-300 focus:border-singpass-red focus:ring-singpass-red/20 rounded-md text-singpass-dark placeholder-singpass-gray-400 focus:outline-none focus:ring-4 transition-all duration-200"
      oninput={handleInput}
      autocomplete="current-password"
    />
    
    <button
      type="button"
      onclick={togglePassword}
      class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-singpass-gray-400 hover:text-singpass-red transition-colors focus:outline-none"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {#if showPassword}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      {/if}
    </button>
  </div>
</div>
