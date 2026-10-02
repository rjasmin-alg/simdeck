// Robert Jenkins' hash, exactly as Ceph implements it in src/crush/hash.c.
//
// This one is a faithful port, not an approximation: CRUSH's whole behaviour —
// which OSD a PG lands on, and how little moves when the map changes — comes out
// of this function. Getting it right is what makes the rest trustworthy.
//
// C's __u32 arithmetic maps onto JS cleanly as long as every step is forced back
// into 32 bits. `|0` does that for -, and `>>>` implicitly does ToUint32 on its
// operand, so `c >>> 13` is already the logical shift C would do on a __u32.

const SEED = 1315423911;

/** The 9-step avalanche from crush_hashmix(). Operates on [a, b, c]. */
function mix(s) {
  let [a, b, c] = s;
  a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 13;
  b = (b - c) | 0; b = (b - a) | 0; b ^= a << 8;
  c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 13;
  a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 12;
  b = (b - c) | 0; b = (b - a) | 0; b ^= a << 16;
  c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 5;
  a = (a - b) | 0; a = (a - c) | 0; a ^= c >>> 3;
  b = (b - c) | 0; b = (b - a) | 0; b ^= a << 10;
  c = (c - a) | 0; c = (c - b) | 0; c ^= b >>> 15;
  s[0] = a; s[1] = b; s[2] = c;
}

export function hash1(a) {
  a |= 0;
  let hash = SEED ^ a;
  let b = a, x = 231232, y = 1232;
  let s = [b, x, hash]; mix(s); b = s[0]; x = s[1]; hash = s[2];
  s = [y, a, hash]; mix(s); y = s[0]; a = s[1]; hash = s[2];
  return hash >>> 0;
}

export function hash2(a, b) {
  a |= 0; b |= 0;
  let hash = SEED ^ a ^ b;
  let x = 231232, y = 1232;
  let s = [a, b, hash]; mix(s); a = s[0]; b = s[1]; hash = s[2];
  s = [x, a, hash]; mix(s); x = s[0]; a = s[1]; hash = s[2];
  s = [b, y, hash]; mix(s); b = s[0]; y = s[1]; hash = s[2];
  return hash >>> 0;
}

export function hash3(a, b, c) {
  a |= 0; b |= 0; c |= 0;
  let hash = SEED ^ a ^ b ^ c;
  let x = 231232, y = 1232;
  let s = [a, b, hash]; mix(s); a = s[0]; b = s[1]; hash = s[2];
  s = [c, x, hash]; mix(s); c = s[0]; x = s[1]; hash = s[2];
  s = [y, a, hash]; mix(s); y = s[0]; a = s[1]; hash = s[2];
  s = [b, x, hash]; mix(s); b = s[0]; x = s[1]; hash = s[2];
  s = [y, c, hash]; mix(s); y = s[0]; c = s[1]; hash = s[2];
  return hash >>> 0;
}

export function hash4(a, b, c, d) {
  a |= 0; b |= 0; c |= 0; d |= 0;
  let hash = SEED ^ a ^ b ^ c ^ d;
  let x = 231232, y = 1232;
  let s = [a, b, hash]; mix(s); a = s[0]; b = s[1]; hash = s[2];
  s = [c, d, hash]; mix(s); c = s[0]; d = s[1]; hash = s[2];
  s = [a, x, hash]; mix(s); a = s[0]; x = s[1]; hash = s[2];
  s = [y, b, hash]; mix(s); y = s[0]; b = s[1]; hash = s[2];
  s = [c, x, hash]; mix(s); c = s[0]; x = s[1]; hash = s[2];
  s = [y, d, hash]; mix(s); y = s[0]; d = s[1]; hash = s[2];
  return hash >>> 0;
}

// Ceph's stable PG masking (ceph_stable_mod). Keeps a value inside pg_num even
// when pg_num is not a power of two, and does it in a way that only moves the
// values that had to move when pg_num grows — which is why splitting a pool is
// cheap and why pg_num values that are not powers of two are merely untidy
// rather than broken.
export function stableMod(x, b, bmask) {
  return (x & bmask) < b ? (x & bmask) : (x & (bmask >> 1));
}

/**
 * The companion mask: (1 << cbits(n - 1)) - 1, i.e. the smallest 2^k-1 that can
 * hold n-1. pg_num 1 -> 0, 2 -> 1, 100 -> 127, 512 -> 511.
 */
export function bmaskFor(n) {
  let m = 0;
  while (m < n - 1) m = (m << 1) | 1;
  return m;
}
