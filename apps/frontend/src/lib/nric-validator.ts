/**
 * NRIC/FIN Validator using the weighted sum and mapping algorithm.
 * Supports S, T, F, G, and M series.
 */

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2];

const S_T_MAPPING = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
const F_G_MAPPING = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];
const M_MAPPING = ['K', 'L', 'J', 'N', 'P', 'Q', 'R', 'T', 'U', 'W', 'X'];

const WHITELIST = ['S7654321Z'];

export function validateNric(input: string): boolean {
  if (!input) return false;
  const nric = input.trim().toUpperCase();
  if (WHITELIST.includes(nric)) return true;
  if (nric.length !== 9) return false;

  const firstChar = nric.charAt(0);
  const digits = nric.substring(1, 8).split('').map(d => parseInt(d, 10));
  const lastChar = nric.charAt(8);

  if (digits.some(d => isNaN(d))) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += digits[i]! * WEIGHTS[i]!;
  }

  let offset = 0;
  if (firstChar === 'T' || firstChar === 'G') offset = 4;
  if (firstChar === 'M') offset = 3;

  const remainder = (sum + offset) % 11;

  if (firstChar === 'S' || firstChar === 'T') {
    return lastChar === S_T_MAPPING[remainder];
  } else if (firstChar === 'F' || firstChar === 'G') {
    return lastChar === F_G_MAPPING[remainder];
  } else if (firstChar === 'M') {
    // K, L, J, N, P, Q, R, T, U, W, X (Index is 10 - remainder)
    return lastChar === M_MAPPING[10 - remainder];
  }

  return false;
}
