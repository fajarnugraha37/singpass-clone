<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
  import { validateNric } from '../lib/nric-validator';

  interface Props {
    value: string;
    onchange: (val: string) => void;
    onvaliditychange?: (isValid: boolean) => void;
  }

  let { value = $bindable(), onchange, onvaliditychange }: Props = $props();
  
  let touched = $state(false);
  let isValid = $derived(value === '' || validateNric(value));
  let showError = $derived(touched && !isValid && value !== '');

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const val = target.value.toUpperCase();
    value = val;
    onchange(val);
    if (onvaliditychange) {
      onvaliditychange(validateNric(val));
    }
  }

  function handleBlur() {
    touched = true;
  }
</script>

<div class="flex flex-col space-y-1.5 w-full">
  <label for="nric-input" class="text-sm font-semibold text-singpass-gray-500">
    {i18n.t('login.form.id.label')}
  </label>
  
  <div class="relative">
    <input
      id="nric-input"
      type="text"
      {value}
      placeholder={i18n.t('login.form.id.placeholder')}
      class="w-full px-4 py-3 bg-singpass-light border {showError ? 'border-singpass-red focus:ring-singpass-red/20' : 'border-singpass-gray-300 focus:border-singpass-red focus:ring-singpass-red/20'} rounded-md text-singpass-dark placeholder-singpass-gray-400 focus:outline-none focus:ring-4 transition-all duration-200"
      oninput={handleInput}
      onblur={handleBlur}
      autocomplete="username"
      aria-invalid={showError}
      aria-describedby={showError ? "nric-error" : undefined}
    />
  </div>

  {#if showError}
    <p id="nric-error" class="text-xs text-singpass-red font-medium animate-in fade-in slide-in-from-top-1 duration-200">
      {i18n.t('login.form.error.nric')}
    </p>
  {/if}
</div>

<style>
  input::placeholder {
    opacity: 1;
  }
</style>
