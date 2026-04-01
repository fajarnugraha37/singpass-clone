export interface PollResult {
  status: 'PENDING' | 'AUTHORIZED' | 'CANCELLED' | 'EXPIRED' | 'ERROR';
  redirectUrl?: string;
}

/**
 * Long Polling utility for Singpass QR Status.
 * Handles the recursive polling loop with AbortSignal support and retry logic.
 */
export async function pollQRStatus(
  sessionId: string, 
  onUpdate: (result: PollResult) => void, 
  signal?: AbortSignal
) {
  let retryCount = 0;
  const maxRetries = 5;

  const poll = async () => {
    if (signal?.aborted) return;

    try {
      const response = await fetch(`/api/auth/singpass/qr/status/${sessionId}`, { signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PollResult = await response.json();
      retryCount = 0; // Reset retry count on success
      onUpdate(result);

      if (result.status === 'PENDING') {
        setTimeout(poll, 1000);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      retryCount++;
      console.warn(`[Polling] Attempt ${retryCount} failed:`, error.message);

      if (retryCount >= maxRetries) {
        console.error('[Polling] Max retries exceeded');
        onUpdate({ status: 'ERROR' });
      } else {
        // Exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(poll, delay);
      }
    }
  };

  await poll();
}
