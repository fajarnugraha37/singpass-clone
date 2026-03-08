<script lang="ts">
  import { i18n } from '../lib/i18n.svelte';
  import NricInput from './NricInput.svelte';
  import PasswordInput from './PasswordInput.svelte';
  import { validateNric } from '../lib/nric-validator';

  let nric = $state('');
  let password = $state('');
  let rememberMe = $state(false);
  let isNricValid = $state(false);

  let isFormValid = $derived(isNricValid && password.length > 0);

  function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!validateNric(nric)) {
      // Re-trigger validation UI by making sure NricInput knows it's touched
      // In this case, we just check and let NricInput handle its own state if possible
      // but here we can just show an alert for the demo
      return;
    }

    if (password.length === 0) {
      return;
    }

    alert(i18n.t('login.demo.alert'));
  }

  function handleNricChange(val: string) {
    nric = val;
  }

  function handlePasswordChange(val: string) {
    password = val;
  }

  function handleNricValidityChange(valid: boolean) {
    isNricValid = valid;
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <div class="space-y-5">
    <NricInput 
      bind:value={nric} 
      onchange={handleNricChange} 
      onvaliditychange={handleNricValidityChange}
    />
    
    <PasswordInput 
      bind:value={password} 
      onchange={handlePasswordChange}
    />
  </div>

  <div class="flex items-center">
    <input
      id="remember-me"
      type="checkbox"
      bind:checked={rememberMe}
      class="h-4 w-4 text-singpass-red border-singpass-gray-300 rounded focus:ring-singpass-red/20 transition-all cursor-pointer"
    />
    <label for="remember-me" class="ml-2 block text-sm text-singpass-gray-500 cursor-pointer select-none">
      {i18n.t('login.form.remember')}
    </label>
  </div>

  <button
    type="submit"
    class="w-full py-3.5 px-4 bg-singpass-red hover:bg-[#C11732] active:bg-[#A0132A] text-white font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
    disabled={!isFormValid}
  >
    {i18n.t('login.form.submit')}
  </button>
</form>

<style>
  /* Custom checkbox styling if needed */
  input[type="checkbox"] {
    accent-color: #E31C3D;
  }
</style>
