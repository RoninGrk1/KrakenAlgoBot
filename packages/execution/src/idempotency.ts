const seen = new Map<string, number>();
export function claimIdempotency(key: string, ttlMs = 15 * 60_000, now = Date.now()): boolean {
  const prev = seen.get(key);
  if (prev && now - prev < ttlMs) return false;
  seen.set(key, now);
  return true;
}
export function resetIdempotency(): void { seen.clear(); }
