/** Retry delay: 2 s, 4 s, 8 s ... capped at 5 minutes, plus up to 1 s of jitter. */
export function retryDelayMs(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(2000 * 2 ** Math.max(0, attempts - 1), 5 * 60_000);
  return base + Math.floor(random() * 1000);
}
