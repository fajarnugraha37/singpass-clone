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
    // For M series, use the standard mapping: K, L, J, N, P, Q, R, T, U, W, X
    // The index is 10 - remainder.
    // M1234567: sum=106, offset=3, sum+offset=109, 109%11=10. Index = 10-10=0. Mapping[0]=K.
    // M0123456: sum=77, offset=3, sum+offset=80, 80%11=3. Index = 10-3=7. Mapping[7]=T.
    expectedChar = M_MAPPING[10 - remainder];
  }

  return lastChar === expectedChar;
}
