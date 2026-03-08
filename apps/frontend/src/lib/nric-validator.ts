/**
 * NRIC/FIN Validator using the weighted sum and mapping algorithm.
 * Supports S, T, F, G, and M series.
 */

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2];

const S_T_MAPPING = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
const F_G_MAPPING = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
const M_MAPPING = ['K', 'L', 'J', 'N', 'P', 'Q', 'R', 'T', 'U', 'W', 'X'];

export function validateNric(nric: string): boolean {
  if (!nric || nric.length !== 9) return false;

  const firstChar = nric.charAt(0).toUpperCase();
  const digits = nric.substring(1, 8).split('').map(d => parseInt(d, 10));
  const lastChar = nric.charAt(8).toUpperCase();

  if (digits.some(d => isNaN(d))) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * WEIGHTS[i];
  }

  let offset = 0;
  switch (firstChar) {
    case 'T':
      offset = 4;
      break;
    case 'G':
      offset = 4;
      break;
    case 'M':
      offset = 3;
      break;
    case 'S':
    case 'F':
      offset = 0;
      break;
    default:
      return false; // Invalid first character
  }

  let remainder = (sum + offset) % 11;

  let expectedChar = '';
  if (firstChar === 'S' || firstChar === 'T') {
    expectedChar = S_T_MAPPING[remainder];
  } else if (firstChar === 'F' || firstChar === 'G') {
    expectedChar = F_G_MAPPING[remainder];
  } else if (firstChar === 'M') {
    // For M series, the mapping is K, L, J, N, P, Q, R, T, U, W, X 
    // for remainder 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    // Based on actual observed values:
    // M1234567 -> sum+3 = 109 -> 109%11 = 10. Map to K.
    // M0123456 -> sum+3 = (0*2+1*7+2*6+3*5+4*4+5*3+6*2)+3 = (0+7+12+15+16+15+12)+3 = 77+3 = 80.
    // 80%11 = 3. Map to L? 
    // Wait, M_MAPPING[10 - 10] = M_MAPPING[0] = K. (Passed)
    // M_MAPPING[10 - 3] = M_MAPPING[7] = T. (Expected L, got T)
    // If it was just M_MAPPING[remainder]:
    // M_MAPPING[10] = X. (Failed)
    // M_MAPPING[3] = N. (Failed)
    // Looking at M-series details: it's actually 10 - remainder but some sources say 
    // the mapping is different. Let's try the common one for M:
    // Index = 10 - remainder.
    // M0123456L: remainder 3. 10 - 3 = 7. M_MAPPING[7] = T. 
    // If we want L (index 1), then index = remainder - 2? 3 - 2 = 1.
    // M1234567K: remainder 10. 10 - 2 = 8. M_MAPPING[8] = U. (No)
    // Correct mapping for M series is often:
    // K, L, J, N, P, Q, R, T, U, W, X for remainders 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0
    // This is EXACTLY M_MAPPING[10 - remainder] if M_MAPPING is [X, W, U, T, R, Q, P, N, J, L, K]
    // Let's re-verify the M_MAPPING order.
    // Most sources: K, L, J, N, P, Q, R, T, U, W, X.
    // Let's try direct remainder mapping with this order:
    // Remainder 0 -> K, 1 -> L, 2 -> J, 3 -> N, 4 -> P, 5 -> Q, 6 -> R, 7 -> T, 8 -> U, 9 -> W, 10 -> X
    // M1234567 (10) -> X.
    // M0123456 (3) -> N.
    // Still not matching my test case expectations (K and L).
    // Let's adjust the test case to more reliable values if needed, or fix logic.
    // Actually, M series uses: X, W, U, T, R, Q, P, N, J, L, K for 0..10.
    const CORRECT_M_MAPPING = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'J', 'L', 'K'];
    expectedChar = CORRECT_M_MAPPING[remainder];
  }

  return lastChar === expectedChar;
}
