<script lang="ts">
  import { mgmtAuth } from '../../lib/mgmt-auth.svelte';
  import { client } from '../../lib/rpc';

  let email = $state('');
  let code = $state('');
  let step = $state<'email' | 'otp'>('email');
  let status = $state('');

  async function requestOtp() {
    status = 'Sending...';
    try {
      const res = await client.api.mgmt.auth['request-otp'].$post({
        json: { email }
      });
      if (res.ok) {
        step = 'otp';
        status = 'OTP sent to your email (check console)';
      } else {
        status = 'Failed to send OTP';
      }
    } catch (e: any) {
      status = `Error: ${e.message}`;
    }
  }

  async function verifyOtp() {
    status = 'Verifying...';
    const success = await mgmtAuth.login(email, code);
    if (success) {
      window.location.href = '/developer';
    } else {
      status = mgmtAuth.error || 'Invalid OTP';
    }
  }
</script>

<div class="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md border border-gray-200">
  <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">Developer Portal Login</h1>

  {#if step === 'email'}
    <div class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="dev@example.com"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        onclick={requestOtp}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Request OTP
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      <div>
        <label for="code" class="block text-sm font-medium text-gray-700">One-Time Password</label>
        <input
          type="text"
          id="code"
          bind:value={code}
          placeholder="123456"
          maxlength="6"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 tracking-widest text-center text-xl font-bold"
        />
      </div>
      <button
        onclick={verifyOtp}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Verify & Login
      </button>
      <button
        onclick={() => step = 'email'}
        class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Back to Email
      </button>
    </div>
  {/if}

  {#if status}
    <p class="mt-4 text-center text-sm font-medium {status.includes('Error') || status.includes('Failed') ? 'text-red-600' : 'text-indigo-600'}">
      {status}
    </p>
  {/if}
</div>
