<script lang="ts">
  import { client } from '../lib/rpc';

  let otp = '';
  let error = '';
  let isLoading = false;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    isLoading = true;

    try {
      // POST /api/auth/api/2fa
      const res = await client.api.auth.api['2fa'].$post({
        json: { otp }
      });

      const data = await res.json();

      if (data.success && data.redirect_uri) {
        // Final OIDC redirect
        window.location.href = data.redirect_uri;
      } else {
        error = data.error || '2FA verification failed';
      }
    } catch (err) {
      console.error('2FA error:', err);
      error = 'An unexpected error occurred';
    } finally {
      isLoading = false;
    }
  }
</script>

<form on:submit={handleSubmit} class="space-y-6">
  <div class="text-center">
    <p class="text-sm text-gray-600 mb-6">
      Enter the 6-digit OTP sent to your registered mobile number.
    </p>
  </div>

  {#if error}
    <div class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
      {error}
    </div>
  {/if}

  <div>
    <label for="otp" class="block text-sm font-medium text-center text-gray-700">Enter OTP</label>
    <div class="mt-4 flex justify-center">
      <input
        id="otp"
        name="otp"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="6"
        required
        bind:value={otp}
        class="block w-48 text-center text-2xl tracking-[1em] py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        placeholder="------"
      />
    </div>
  </div>

  <div>
    <button
      type="submit"
      disabled={isLoading || otp.length < 6}
      class="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
    >
      {isLoading ? 'Verifying...' : 'Submit'}
    </button>
  </div>
  
  <div class="text-center mt-4">
    <button type="button" class="text-sm text-red-600 hover:underline">
      Resend OTP
    </button>
  </div>
</form>
