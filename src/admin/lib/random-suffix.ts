const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ALPHABET_LENGTH = ALPHABET.length; // 36

// 256 % 36 === 4, so a plain `byte % 36` would make the first 4 letters ("a"-"d") land
// slightly more often than the rest. Reject any byte >= this cutoff and redraw so every
// letter has an exactly equal chance.
const MAX_UNBIASED_BYTE = 256 - (256 % ALPHABET_LENGTH);

/** A short random, URL-safe suffix for `vehicleSlug` — 4 chars by default, `[a-z0-9]` only, uniformly distributed. */
export function randomSlugSuffix(length = 4): string {
  const chars: string[] = [];
  while (chars.length < length) {
    // Draw a small batch at a time so we rarely need more than one call to crypto.
    const batch = new Uint8Array(length - chars.length + 4);
    crypto.getRandomValues(batch);
    for (const byte of batch) {
      if (chars.length >= length) break;
      if (byte >= MAX_UNBIASED_BYTE) continue;
      chars.push(ALPHABET[byte % ALPHABET_LENGTH]!);
    }
  }
  return chars.join("");
}
